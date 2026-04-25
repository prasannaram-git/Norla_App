/**
 * Server-side data store for Norla.
 * 
 * DUAL STORAGE STRATEGY:
 * 1. Primary: Supabase (PostgreSQL) — works on Vercel, persistent
 * 2. Fallback: Local JSON files in .norla-data/ — works without Supabase
 * 
 * ALL data operations try Supabase first, then fall back to file storage.
 * This ensures the admin panel always shows data even when Supabase is unreachable.
 */

import { createClient } from './supabase-server';
import fs from 'fs';
import path from 'path';

// ─── Data Directory ───

const DATA_DIR = path.join(process.cwd(), '.norla-data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SCANS_FILE = path.join(DATA_DIR, 'scans.json');
const ACTIVITY_FILE = path.join(DATA_DIR, 'activity.json');
const KEYS_FILE = path.join(DATA_DIR, 'api-keys.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch { /* corrupt file */ }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    ensureDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`[Store] Failed to write ${filePath}:`, e);
  }
}

// ─── Supabase Helpers ───

function getSupabase() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

// ─── User Store ───

export interface StoredUser {
  phone: string;
  name: string;
  dob: string;
  sex: string;
  createdAt: string;
  lastLoginAt: string;
}

export async function getAllUsers(): Promise<StoredUser[]> {
  // Try Supabase first
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const users = data.map((u: Record<string, string>) => ({
          phone: u.phone,
          name: u.name || '',
          dob: u.dob || '',
          sex: u.sex || '',
          createdAt: u.created_at,
          lastLoginAt: u.last_login_at || u.created_at,
        }));
        // Sync to local file
        writeJsonFile(USERS_FILE, users);
        return users;
      }
    } catch (e) {
      console.warn('[Store] Supabase getAllUsers failed, falling back to file:', e);
    }
  }

  // Fallback: read from file
  return readJsonFile<StoredUser[]>(USERS_FILE, []);
}

export async function upsertUser(user: { phone: string; name: string; dob: string; sex: string }): Promise<void> {
  const now = new Date().toISOString();

  // Try Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('users').upsert({
        phone: user.phone,
        name: user.name,
        dob: user.dob,
        sex: user.sex,
        last_login_at: now,
      }, { onConflict: 'phone' });
      
      if (error) {
        console.error('[Store] upsertUser Supabase error:', error.message);
      }
    } catch (e) {
      console.error('[Store] upsertUser exception:', e);
    }
  }

  // Always write to file (ensures offline access)
  const users = readJsonFile<StoredUser[]>(USERS_FILE, []);
  const idx = users.findIndex((u) => u.phone === user.phone);
  const record: StoredUser = {
    phone: user.phone,
    name: user.name || (idx >= 0 ? users[idx].name : ''),
    dob: user.dob || (idx >= 0 ? users[idx].dob : ''),
    sex: user.sex || (idx >= 0 ? users[idx].sex : ''),
    createdAt: idx >= 0 ? users[idx].createdAt : now,
    lastLoginAt: now,
  };
  if (idx >= 0) {
    users[idx] = record;
  } else {
    users.unshift(record);
  }
  writeJsonFile(USERS_FILE, users);
}

// ─── Scan Store ───

export interface StoredScan {
  id: string;
  userId: string;
  userPhone?: string;
  status: string;
  overallBalanceScore?: number;
  nutrientScores?: Record<string, unknown>;
  focusAreas?: unknown[];
  recommendations?: unknown[];
  confidenceNote?: string;
  createdAt: string;
}

export async function getAllScans(): Promise<StoredScan[]> {
  // Try Supabase first
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const scans = data.map(mapScanRow);
        // Sync to local file
        writeJsonFile(SCANS_FILE, scans);
        return scans;
      }
    } catch (e) {
      console.warn('[Store] Supabase getAllScans failed, falling back to file:', e);
    }
  }

  // Fallback: read from file
  return readJsonFile<StoredScan[]>(SCANS_FILE, []);
}

export async function addScan(scan: StoredScan): Promise<void> {
  // Try Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('scans').upsert({
        id: scan.id,
        user_id: scan.userId,
        user_phone: scan.userPhone || null,
        status: scan.status,
        overall_balance_score: scan.overallBalanceScore || null,
        nutrient_scores: scan.nutrientScores || null,
        focus_areas: scan.focusAreas || null,
        recommendations: scan.recommendations || null,
        confidence_note: scan.confidenceNote || null,
        created_at: scan.createdAt,
      });
    } catch (e) {
      console.error('[Store] addScan Supabase error:', e);
    }
  }

  // Always write to file
  const scans = readJsonFile<StoredScan[]>(SCANS_FILE, []);
  const idx = scans.findIndex((s) => s.id === scan.id);
  if (idx >= 0) {
    scans[idx] = scan;
  } else {
    scans.unshift(scan);
  }
  writeJsonFile(SCANS_FILE, scans);
}

export async function syncScans(clientScans: StoredScan[]): Promise<void> {
  const supabase = getSupabase();

  for (const scan of clientScans) {
    if (supabase) {
      try {
        await supabase.from('scans').upsert({
          id: scan.id,
          user_id: scan.userId,
          user_phone: scan.userPhone || null,
          status: scan.status,
          overall_balance_score: scan.overallBalanceScore || null,
          nutrient_scores: scan.nutrientScores || null,
          focus_areas: scan.focusAreas || null,
          recommendations: scan.recommendations || null,
          confidence_note: scan.confidenceNote || null,
          created_at: scan.createdAt,
        });
      } catch { /* ignore individual failures */ }
    }
  }

  // Also persist to file
  const existing = readJsonFile<StoredScan[]>(SCANS_FILE, []);
  const existingIds = new Set(existing.map((s) => s.id));
  for (const scan of clientScans) {
    if (!existingIds.has(scan.id)) {
      existing.unshift(scan);
    }
  }
  writeJsonFile(SCANS_FILE, existing);
}

// ─── Activity Log ───

export interface ActivityEntry {
  id: string;
  action: string;
  user_phone: string;
  details: Record<string, string>;
  created_at: string;
}

export async function getActivityLog(): Promise<ActivityEntry[]> {
  // Try Supabase first
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data && data.length > 0) {
        const activity = data.map((a: Record<string, unknown>) => ({
          id: a.id as string,
          action: a.action as string,
          user_phone: a.user_phone as string || '',
          details: (a.details as Record<string, string>) || {},
          created_at: a.created_at as string,
        }));
        // Sync to local file
        writeJsonFile(ACTIVITY_FILE, activity);
        return activity;
      }
    } catch (e) {
      console.warn('[Store] Supabase getActivityLog failed, falling back to file:', e);
    }
  }

  // Fallback: read from file
  return readJsonFile<ActivityEntry[]>(ACTIVITY_FILE, []);
}

export async function logActivity(action: string, userPhone: string, details: Record<string, string> = {}): Promise<void> {
  const entry: ActivityEntry = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action,
    user_phone: userPhone,
    details,
    created_at: new Date().toISOString(),
  };

  // Try Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('activity_log').insert({
        action,
        user_phone: userPhone,
        details,
      });
    } catch {
      // Silent fail — activity logging shouldn't break the app
    }
  }

  // Always write to file
  const activity = readJsonFile<ActivityEntry[]>(ACTIVITY_FILE, []);
  activity.unshift(entry);
  // Keep only last 500 entries in file
  if (activity.length > 500) activity.length = 500;
  writeJsonFile(ACTIVITY_FILE, activity);
}

// ─── Stats ───

export async function getStats() {
  const users = await getAllUsers();
  const scans = await getAllScans();
  const activity = await getActivityLog();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const scansToday = scans.filter((s) => s.createdAt >= todayStr).length;
  const otpsToday = activity.filter(
    (a) => a.action === 'otp_sent' && a.created_at >= todayStr
  ).length;

  // Count active API keys
  let activeKeys = 0;
  try {
    if (fs.existsSync(KEYS_FILE)) {
      const keys = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf-8'));
      activeKeys = keys.filter((k: { is_active: boolean }) => k.is_active).length;
    }
  } catch { /* ignore */ }

  return {
    totalUsers: users.length,
    totalScans: scans.length,
    scansToday,
    otpsToday,
    activeKeys,
    recentActivity: activity.slice(0, 10),
    recentScans: scans.slice(0, 10).map((s) => ({
      id: s.id,
      user_id: s.userId,
      status: s.status,
      overall_balance_score: s.overallBalanceScore ?? null,
      created_at: s.createdAt,
    })),
  };
}

// ─── Helpers ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapScanRow(row: any): StoredScan {
  return {
    id: row.id,
    userId: row.user_id,
    userPhone: row.user_phone,
    status: row.status,
    overallBalanceScore: row.overall_balance_score,
    nutrientScores: row.nutrient_scores,
    focusAreas: row.focus_areas,
    recommendations: row.recommendations,
    confidenceNote: row.confidence_note,
    createdAt: row.created_at,
  };
}
