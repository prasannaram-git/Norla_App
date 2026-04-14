import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import fs from 'fs';
import path from 'path';

const SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'norla-admin-fallback');
async function isAdmin(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  try { await jwtVerify(auth.slice(7), SECRET); return true; } catch { return false; }
}

const KEYS_FILE = path.join(process.cwd(), '.norla-data', 'api-keys.json');

interface ApiKey {
  id: string;
  name: string;
  api_key: string;
  is_active: boolean;
  usage_count: number;
  last_used_at: string | null;
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
      last_used_at: null,
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

/** GET — list all Gemini keys */
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const keys = readKeys();
  // Mask the API key for display
  return NextResponse.json({
    keys: keys.map((k) => ({
      ...k,
      api_key: k.api_key.slice(0, 8) + '...' + k.api_key.slice(-4),
    })),
  });
}

/** POST — add a new key */
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name, api_key } = await req.json();
  if (!api_key) return NextResponse.json({ error: 'API key required' }, { status: 400 });

  const keys = readKeys();
  keys.push({
    id: `key-${Date.now()}`,
    name: name || 'API Key',
    api_key,
    is_active: true,
    usage_count: 0,
    last_used_at: null,
    created_at: new Date().toISOString(),
  });
  writeKeys(keys);
  return NextResponse.json({ success: true });
}

/** PUT — update key status */
export async function PUT(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, is_active } = await req.json();
  if (!id) return NextResponse.json({ error: 'Key ID required' }, { status: 400 });

  const keys = readKeys();
  const key = keys.find((k) => k.id === id);
  if (!key) return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  if (is_active !== undefined) key.is_active = is_active;
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
