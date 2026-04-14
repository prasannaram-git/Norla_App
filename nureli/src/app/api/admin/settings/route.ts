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

const SETTINGS_FILE = path.join(process.cwd(), '.norla-data', 'settings.json');

function readSettings(): Record<string, string> {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(SETTINGS_FILE)) return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
  } catch { /* ignore */ }
  return {};
}

function writeSettings(settings: Record<string, string>): void {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

/** GET — get all settings */
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const settings = readSettings();
  return NextResponse.json({
    settings: Object.entries(settings).map(([key, value]) => ({ key, value })),
  });
}

/** PUT — update a setting */
export async function PUT(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { key, value } = await req.json();
  if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 });

  const settings = readSettings();
  settings[key] = value;
  writeSettings(settings);
  return NextResponse.json({ success: true });
}
