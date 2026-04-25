import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import fs from 'fs';
import path from 'path';

const KEYS_FILE = path.join(process.cwd(), '.norla-data', 'api-keys.json');
const POINTER_FILE = path.join(process.cwd(), '.norla-data', 'key-pointer.json');

interface ApiKey {
  id: string;
  name: string;
  api_key: string;
  is_active: boolean;
  usage_count: number;
  error_count: number;
  last_used_at: string | null;
  last_error: string | null;
  created_at: string;
}

function readKeys(): ApiKey[] {
  try {
    if (fs.existsSync(KEYS_FILE)) return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf-8'));
  } catch { /* ignore */ }

  // Seed with the env key if available
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey) {
    const seed: ApiKey[] = [{
      id: 'key-env-default',
      name: 'Default (from .env)',
      api_key: envKey,
      is_active: true,
      usage_count: 0,
      error_count: 0,
      last_used_at: null,
      last_error: null,
      created_at: new Date().toISOString(),
    }];
    writeKeys(seed);
    return seed;
  }
  return [];
}

function writeKeys(keys: ApiKey[]): void {
  const dir = path.dirname(KEYS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), 'utf-8');
}

function getPointer(): number {
  try {
    if (fs.existsSync(POINTER_FILE)) {
      const data = JSON.parse(fs.readFileSync(POINTER_FILE, 'utf-8'));
      return typeof data.index === 'number' ? data.index : 0;
    }
  } catch { /* ignore */ }
  return 0;
}

function resetPointer(): void {
  const dir = path.dirname(POINTER_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(POINTER_FILE, JSON.stringify({ index: 0, updatedAt: new Date().toISOString() }), 'utf-8');
}

/** GET — list all Gemini keys (with masked values) + round-robin status */
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const keys = readKeys();
  const activeKeys = keys.filter(k => k.is_active);
  const pointer = getPointer();

  return NextResponse.json({
    keys: keys.map((k, i) => ({
      ...k,
      api_key: k.api_key.slice(0, 8) + '...' + k.api_key.slice(-4),
      is_next: k.is_active && activeKeys.indexOf(k) === pointer,
    })),
    rotation: {
      mode: 'round-robin-serial',
      totalKeys: keys.length,
      activeKeys: activeKeys.length,
      currentPointer: pointer,
      nextKeyName: activeKeys[pointer]?.name || 'N/A',
    },
  });
}

/** POST — add a new key (or bulk add) */
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();

  // Support bulk add: { keys: [{ name, api_key }, ...] }
  if (Array.isArray(body.keys)) {
    const keys = readKeys();
    let added = 0;
    for (const item of body.keys) {
      if (!item.api_key || typeof item.api_key !== 'string') continue;
      // Skip duplicates
      if (keys.some(k => k.api_key === item.api_key.trim())) continue;
      keys.push({
        id: `key-${Date.now()}-${added}`,
        name: item.name || `API Key ${keys.length + 1}`,
        api_key: item.api_key.trim(),
        is_active: true,
        usage_count: 0,
        error_count: 0,
        last_used_at: null,
        last_error: null,
        created_at: new Date().toISOString(),
      });
      added++;
    }
    writeKeys(keys);
    return NextResponse.json({ success: true, added });
  }

  // Single key add
  const { name, api_key } = body;
  if (!api_key) return NextResponse.json({ error: 'API key required' }, { status: 400 });

  const keys = readKeys();
  // Check for duplicate
  if (keys.some(k => k.api_key === api_key.trim())) {
    return NextResponse.json({ error: 'This key already exists' }, { status: 409 });
  }

  keys.push({
    id: `key-${Date.now()}`,
    name: name || `API Key ${keys.length + 1}`,
    api_key: api_key.trim(),
    is_active: true,
    usage_count: 0,
    error_count: 0,
    last_used_at: null,
    last_error: null,
    created_at: new Date().toISOString(),
  });
  writeKeys(keys);
  return NextResponse.json({ success: true });
}

/** PUT — update key status, reset errors, or reset rotation pointer */
export async function PUT(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();

  // Reset rotation pointer
  if (body.action === 'reset_rotation') {
    resetPointer();
    return NextResponse.json({ success: true, message: 'Rotation pointer reset to key #1' });
  }

  // Reset ALL error counts
  if (body.action === 'reset_all_errors') {
    const keys = readKeys();
    for (const k of keys) {
      k.error_count = 0;
      k.last_error = null;
      k.is_active = true;
    }
    writeKeys(keys);
    return NextResponse.json({ success: true, message: 'All errors reset, all keys re-enabled' });
  }

  const { id, is_active, error_count } = body;
  if (!id) return NextResponse.json({ error: 'Key ID required' }, { status: 400 });

  const keys = readKeys();
  const key = keys.find((k) => k.id === id);
  if (!key) return NextResponse.json({ error: 'Key not found' }, { status: 404 });

  if (is_active !== undefined) key.is_active = is_active;
  if (error_count !== undefined) {
    key.error_count = error_count;
    if (error_count === 0) key.last_error = null;
  }

  writeKeys(keys);
  return NextResponse.json({ success: true });
}

/** DELETE — remove a key */
export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Key ID required' }, { status: 400 });

  let keys = readKeys();
  keys = keys.filter((k) => k.id !== id);
  writeKeys(keys);
  return NextResponse.json({ success: true });
}
