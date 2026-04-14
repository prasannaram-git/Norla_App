/**
 * Server-side data store for Norla.
 * Uses Supabase as primary store (works on Vercel).
 * Falls back to file-based store for local development.
 */

import { createClient } from './supabase-server';

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
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((u: Record<string, string>) => ({
      phone: u.phone,
      name: u.name || '',
      dob: u.dob || '',
      sex: u.sex || '',
      createdAt: u.created_at,
      lastLoginAt: u.last_login_at || u.created_at,
    }));
  } catch {
    return [];
  }
}

export async function upsertUser(user: { phone: string; name: string; dob: string; sex: string }): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('users').upsert({
      phone: user.phone,
      name: user.name,
      dob: user.dob,
      sex: user.sex,
      last_login_at: new Date().toISOString(),
    }, { onConflict: 'phone' });
  } catch (e) {
    console.error('[Store] upsertUser error:', e);
  }
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
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(mapScanRow);
  } catch {
    return [];
  }
}

export async function addScan(scan: StoredScan): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

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
    console.error('[Store] addScan error:', e);
  }
}

export async function syncScans(clientScans: StoredScan[]): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  for (const scan of clientScans) {
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

// ─── Activity Log ───

export interface ActivityEntry {
  id: string;
  action: string;
  user_phone: string;
  details: Record<string, string>;
  created_at: string;
}

export async function getActivityLog(): Promise<ActivityEntry[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error || !data) return [];
    return data.map((a: Record<string, unknown>) => ({
      id: a.id as string,
      action: a.action as string,
      user_phone: a.user_phone as string || '',
      details: (a.details as Record<string, string>) || {},
      created_at: a.created_at as string,
    }));
  } catch {
    return [];
  }
}

export async function logActivity(action: string, userPhone: string, details: Record<string, string> = {}): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

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

  return {
    totalUsers: users.length,
    totalScans: scans.length,
    scansToday,
    otpsToday,
    activeKeys: 0,
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
