import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const KEYS_FILE = path.join(process.cwd(), '.norla-data', 'api-keys.json');
const POINTER_FILE = path.join(process.cwd(), '.norla-data', 'key-pointer.json');

interface GeminiKey {
  id: string;
  api_key: string;
  name: string;
  is_active: boolean;
  usage_count: number;
  error_count: number;
  last_used_at: string | null;
  last_error: string | null;
  created_at: string;
}

/**
 * Read all keys from the local JSON file.
 * Falls back to env variable if no file or keys exist.
 */
function readAllKeys(): GeminiKey[] {
  try {
    if (fs.existsSync(KEYS_FILE)) {
      return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }

  // Fallback: seed from env
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey) {
    return [{
      id: 'key-env-default',
      api_key: envKey,
      name: 'Default (from .env)',
      is_active: true,
      usage_count: 0,
      error_count: 0,
      last_used_at: null,
      last_error: null,
      created_at: new Date().toISOString(),
    }];
  }
  return [];
}

function writeKeys(keys: GeminiKey[]): void {
  const dir = path.dirname(KEYS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), 'utf-8');
}

/**
 * ── Round-Robin Pointer ──
 * Persists the index of the NEXT key to use.
 * Increments after every scan, wraps around after the last key.
 */
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
  const dir = path.dirname(POINTER_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(POINTER_FILE, JSON.stringify({ index, updatedAt: new Date().toISOString() }), 'utf-8');
}

/**
 * Record successful usage of a key (increment usage_count).
 */
function recordUsage(keyId: string): void {
  try {
    const keys = readAllKeys();
    const key = keys.find(k => k.id === keyId);
    if (key) {
      key.usage_count += 1;
      key.last_used_at = new Date().toISOString();
      // Reset error_count on success (consecutive error tracking)
      key.error_count = 0;
      writeKeys(keys);
    }
  } catch { /* best effort */ }
}

/**
 * Record an error for a key. Auto-disable after 10 consecutive errors.
 */
function recordError(keyId: string, error: string): void {
  try {
    const keys = readAllKeys();
    const key = keys.find(k => k.id === keyId);
    if (key) {
      key.error_count += 1;
      key.last_error = error;
      // Auto-disable after 10 consecutive errors
      if (key.error_count >= 10) key.is_active = false;
      writeKeys(keys);
    }
  } catch { /* best effort */ }
}

/**
 * ── SERIAL ROUND-ROBIN KEY SELECTION ──
 *
 * How it works:
 * 1. Read all active keys (sorted by their position in the array = insertion order)
 * 2. Read the persistent pointer (which key to use next)
 * 3. Pick the key at pointer index (wrap around if needed)
 * 4. Advance the pointer to the next position
 *
 * This ensures:
 * - Scan 1 → Key 1
 * - Scan 2 → Key 2
 * - ...
 * - Scan 15 → Key 15
 * - Scan 16 → Key 1 (loop)
 *
 * If a key fails, it tries the next one(s) automatically.
 */
export async function getGeminiModelWithFallback(modelName = 'gemini-2.5-flash') {
  const allKeys = readAllKeys();
  const activeKeys = allKeys.filter(k => k.is_active);

  if (activeKeys.length === 0) {
    throw new Error('No active Gemini API keys. Add keys in Admin → API Keys.');
  }

  // Get the round-robin pointer
  let pointer = getNextPointer();
  // Ensure pointer is within bounds of active keys
  if (pointer >= activeKeys.length) pointer = 0;

  // Try up to activeKeys.length times (full rotation)
  for (let attempt = 0; attempt < activeKeys.length; attempt++) {
    const idx = (pointer + attempt) % activeKeys.length;
    const key = activeKeys[idx];

    try {
      const genAI = new GoogleGenerativeAI(key.api_key);
      const model = genAI.getGenerativeModel({ model: modelName });

      // Advance the pointer to the NEXT key for the NEXT scan
      // (saved BEFORE the API call so even concurrent requests distribute)
      const nextPointer = (idx + 1) % activeKeys.length;
      savePointer(nextPointer);

      console.log(`[GeminiKeys] Using key "${key.name}" (slot ${idx + 1}/${activeKeys.length}), next→${nextPointer + 1}`);

      return {
        model,
        keyId: key.id,
        keyName: key.name,
        keySlot: idx + 1,
        totalKeys: activeKeys.length,
        onSuccess: () => recordUsage(key.id),
        onError: (err: string) => {
          recordError(key.id, err);
        },
      };
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Failed to create model';
      console.error(`[GeminiKeys] Key "${key.name}" failed to init: ${errMsg}`);
      recordError(key.id, errMsg);
      continue;
    }
  }

  throw new Error('All Gemini API keys failed. Check keys in Admin → API Keys.');
}
