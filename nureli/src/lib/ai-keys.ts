/**
 * AI Key Manager — Supabase-Backed Round-Robin
 * 
 * Stores API keys in Supabase (persistent across Render deploys)
 * with local file cache for fast reads. Supports round-robin
 * rotation across multiple OpenRouter API keys.
 * 
 * Storage priority:
 *   1. Supabase `ai_keys` table (primary, persistent)
 *   2. Local `.norla-data/api-keys.json` (cache + offline fallback)
 *   3. Environment variable OPENROUTER_API_KEY (bootstrap seed)
 */

import { createClient } from './supabase-server';
import fs from 'fs';
import path from 'path';

const KEYS_FILE = path.join(process.cwd(), '.norla-data', 'api-keys.json');
const POINTER_FILE = path.join(process.cwd(), '.norla-data', 'key-pointer.json');

// In-memory cache to avoid DB round-trip on every scan
let cachedKeys: AIKey[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

export interface AIKey {
  id: string;
  api_key: string;
  name: string;
  provider: string; // 'openrouter' | 'gemini'
  is_active: boolean;
  usage_count: number;
  error_count: number;
  last_used_at: string | null;
  last_error: string | null;
  created_at: string;
}

// ─── File helpers ───

function readKeysFromFile(): AIKey[] {
  try {
    if (fs.existsSync(KEYS_FILE)) {
      const keys = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf-8'));
      // Add provider field for legacy keys
      return keys.map((k: AIKey) => ({ ...k, provider: k.provider || 'openrouter' }));
    }
  } catch { /* ignore */ }
  return [];
}

function writeKeysToFile(keys: AIKey[]): void {
  try {
    const dir = path.dirname(KEYS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), 'utf-8');
  } catch (e) {
    console.error('[AIKeys] Failed to write file cache:', e);
  }
}

// ─── Supabase helpers ───

async function readKeysFromSupabase(): Promise<AIKey[] | null> {
  const supabase = createClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('ai_keys')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[AIKeys] Supabase read error:', error.message);
      return null;
    }
    if (!data || data.length === 0) return null;

    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      api_key: row.api_key as string,
      name: row.name as string,
      provider: (row.provider as string) || 'openrouter',
      is_active: row.is_active as boolean,
      usage_count: (row.usage_count as number) || 0,
      error_count: (row.error_count as number) || 0,
      last_used_at: row.last_used_at as string | null,
      last_error: row.last_error as string | null,
      created_at: row.created_at as string,
    }));
  } catch (e) {
    console.warn('[AIKeys] Supabase exception:', e);
    return null;
  }
}

async function upsertKeyToSupabase(key: AIKey): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  try {
    await supabase.from('ai_keys').upsert({
      id: key.id,
      name: key.name,
      api_key: key.api_key,
      provider: key.provider || 'openrouter',
      is_active: key.is_active,
      usage_count: key.usage_count,
      error_count: key.error_count,
      last_used_at: key.last_used_at,
      last_error: key.last_error,
      created_at: key.created_at,
    }, { onConflict: 'id' });
  } catch { /* best effort */ }
}

async function deleteKeyFromSupabase(keyId: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  try {
    await supabase.from('ai_keys').delete().eq('id', keyId);
  } catch { /* best effort */ }
}

// ─── Unified Read/Write ───

/**
 * Read all keys from Supabase (primary) → file (fallback) → env (seed).
 * Results are cached in-memory for CACHE_TTL_MS.
 */
export async function readAllKeys(forceRefresh = false): Promise<AIKey[]> {
  // Check in-memory cache
  if (!forceRefresh && cachedKeys && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedKeys;
  }

  // 1. Try Supabase
  const supabaseKeys = await readKeysFromSupabase();
  if (supabaseKeys && supabaseKeys.length > 0) {
    cachedKeys = supabaseKeys;
    cacheTimestamp = Date.now();
    // Sync to file for offline fallback
    writeKeysToFile(supabaseKeys);
    return supabaseKeys;
  }

  // 2. Try file
  const fileKeys = readKeysFromFile();
  if (fileKeys.length > 0) {
    cachedKeys = fileKeys;
    cacheTimestamp = Date.now();
    return fileKeys;
  }

  // 3. Seed from environment variable
  const envKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
  if (envKey) {
    const seed: AIKey[] = [{
      id: 'key-env-default',
      api_key: envKey,
      name: 'Default (from .env)',
      provider: process.env.OPENROUTER_API_KEY ? 'openrouter' : 'gemini',
      is_active: true,
      usage_count: 0,
      error_count: 0,
      last_used_at: null,
      last_error: null,
      created_at: new Date().toISOString(),
    }];
    writeKeysToFile(seed);
    cachedKeys = seed;
    cacheTimestamp = Date.now();
    return seed;
  }

  return [];
}

export async function writeAllKeys(keys: AIKey[]): Promise<void> {
  // Write to file
  writeKeysToFile(keys);
  // Sync each to Supabase
  for (const key of keys) {
    await upsertKeyToSupabase(key);
  }
  // Update cache
  cachedKeys = keys;
  cacheTimestamp = Date.now();
}

export async function addKey(key: AIKey): Promise<void> {
  const keys = await readAllKeys(true);
  keys.push(key);
  await writeAllKeys(keys);
}

export async function removeKey(keyId: string): Promise<void> {
  let keys = await readAllKeys(true);
  keys = keys.filter(k => k.id !== keyId);
  writeKeysToFile(keys);
  await deleteKeyFromSupabase(keyId);
  cachedKeys = keys;
  cacheTimestamp = Date.now();
}

// ─── Round-Robin Pointer ───

function getNextPointer(): number {
  try {
    if (fs.existsSync(POINTER_FILE)) {
      const data = JSON.parse(fs.readFileSync(POINTER_FILE, 'utf-8'));
      return typeof data.index === 'number' ? data.index : 0;
    }
  } catch { /* ignore */ }
  return 0;
}

function savePointer(index: number): void {
  try {
    const dir = path.dirname(POINTER_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(POINTER_FILE, JSON.stringify({ index, updatedAt: new Date().toISOString() }), 'utf-8');
  } catch { /* ignore */ }
}

export function resetPointer(): void {
  savePointer(0);
}

// ─── Key Usage Tracking ───

export async function recordUsage(keyId: string): Promise<void> {
  try {
    const keys = await readAllKeys();
    const key = keys.find(k => k.id === keyId);
    if (key) {
      key.usage_count += 1;
      key.last_used_at = new Date().toISOString();
      key.error_count = 0; // Reset on success
      await writeAllKeys(keys);
    }
  } catch { /* best effort */ }
}

export async function recordError(keyId: string, error: string): Promise<void> {
  try {
    const keys = await readAllKeys();
    const key = keys.find(k => k.id === keyId);
    if (key) {
      key.error_count += 1;
      key.last_error = error;
      if (key.error_count >= 10) key.is_active = false;
      await writeAllKeys(keys);
    }
  } catch { /* best effort */ }
}

// ─── Round-Robin Key Selection ───

/**
 * Get the next active API key using serial round-robin.
 * Returns the key details + callbacks for success/error tracking.
 */
export async function getNextAIKey(): Promise<{
  apiKey: string;
  keyId: string;
  keyName: string;
  keySlot: number;
  totalKeys: number;
  provider: string;
  onSuccess: () => Promise<void>;
  onError: (err: string) => Promise<void>;
}> {
  const allKeys = await readAllKeys();
  const activeKeys = allKeys.filter(k => k.is_active);

  if (activeKeys.length === 0) {
    throw new Error('No active AI API keys. Add keys in Admin → API Keys.');
  }

  let pointer = getNextPointer();
  if (pointer >= activeKeys.length) pointer = 0;

  const key = activeKeys[pointer];
  const nextPointer = (pointer + 1) % activeKeys.length;
  savePointer(nextPointer);

  console.log(`[AIKeys] Using "${key.name}" (slot ${pointer + 1}/${activeKeys.length}), next→${nextPointer + 1}`);

  return {
    apiKey: key.api_key,
    keyId: key.id,
    keyName: key.name,
    keySlot: pointer + 1,
    totalKeys: activeKeys.length,
    provider: key.provider || 'openrouter',
    onSuccess: () => recordUsage(key.id),
    onError: (err: string) => recordError(key.id, err),
  };
}
