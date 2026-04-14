import { createClient } from './supabase';
import type { User } from '@/types/user';
import type { Scan } from '@/types/scan';
import type { ScanResult } from '@/types/scores';
import { isDemoMode } from './constants';
import { MOCK_SCAN_HISTORY } from './mock-data';

function getClient() {
  const client = createClient();
  if (!client) return null;
  return client;
}

// ──── Local Storage Helpers ────

function getLocalScans(): Scan[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('norla_scans');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveLocalScans(scans: Scan[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('norla_scans', JSON.stringify(scans));
}

function getLocalUsers(): Record<string, { name: string; phone: string; dob: string; sex: string }> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('norla_users_db');
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function saveLocalUsers(users: Record<string, { name: string; phone: string; dob: string; sex: string }>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('norla_users_db', JSON.stringify(users));
}

/**
 * Save user profile for future logins (so we don't re-ask name/dob/sex)
 */
export function saveUserProfile(phone: string, profile: { name: string; dob: string; sex: string }): void {
  const users = getLocalUsers();
  users[phone] = { phone, ...profile };
  saveLocalUsers(users);
}

/**
 * Get saved user profile by phone number (for returning users)
 */
export function getUserProfile(phone: string): { name: string; phone: string; dob: string; sex: string } | null {
  const users = getLocalUsers();
  return users[phone] || null;
}

// ──── Users ────

export async function createUserDoc(user: User): Promise<void> {
  if (isDemoMode()) return;
  const supabase = getClient();
  if (!supabase) return;
  try {
    await supabase.from('users').upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: new Date().toISOString(),
      onboarding_completed: false,
      preferences: user.preferences,
    });
  } catch { /* table may not exist */ }
}

export async function getUserDoc(userId: string): Promise<User | null> {
  if (isDemoMode()) {
    return {
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@norla.app',
      createdAt: new Date().toISOString(),
      onboardingCompleted: true,
      preferences: { darkMode: false, notifications: true },
    };
  }
  const supabase = getClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      createdAt: data.created_at,
      onboardingCompleted: data.onboarding_completed,
      preferences: data.preferences,
    };
  } catch { return null; }
}

// ──── Scans ────

export async function createScan(scan: Partial<Scan> & { id: string; userId: string }): Promise<void> {
  if (isDemoMode()) return;

  // Always save to local storage
  const localScans = getLocalScans();
  const newScan: Scan = {
    id: scan.id,
    userId: scan.userId,
    createdAt: new Date().toISOString(),
    status: (scan.status as 'processing' | 'completed' | 'failed') ?? 'processing',
    images: { faceImageUrl: '', eyeImageUrl: '', handImageUrl: '' },
    questionnaire: scan.questionnaire ?? {} as Scan['questionnaire'],
    overallBalanceScore: undefined,
    nutrientScores: undefined,
    focusAreas: undefined,
    recommendations: undefined,
    confidenceNote: undefined,
  };
  localScans.unshift(newScan);
  saveLocalScans(localScans);

  // Also try DB
  const supabase = getClient();
  if (!supabase) return;
  try {
    await supabase.from('scans').insert({
      id: scan.id,
      user_id: scan.userId,
      status: scan.status ?? 'processing',
      questionnaire: scan.questionnaire ?? null,
      created_at: new Date().toISOString(),
    });
  } catch { /* table may not exist */ }
}

export async function getScan(scanId: string): Promise<Scan | null> {
  if (isDemoMode()) {
    return MOCK_SCAN_HISTORY.find((s) => s.id === scanId) ?? null;
  }

  // Check local storage
  const localScans = getLocalScans();
  const local = localScans.find((s) => s.id === scanId);
  return local || null;
}

export async function updateScanResults(
  scanId: string,
  result: ScanResult
): Promise<void> {
  if (isDemoMode()) return;

  // Update in local storage
  const localScans = getLocalScans();
  const idx = localScans.findIndex((s) => s.id === scanId);
  if (idx >= 0) {
    localScans[idx] = {
      ...localScans[idx],
      status: 'completed',
      overallBalanceScore: result.overallBalanceScore,
      nutrientScores: result.nutrientScores,
      focusAreas: result.focusAreas,
      recommendations: result.recommendations,
      confidenceNote: result.confidenceNote,
    };
    saveLocalScans(localScans);
  }

  // Also try DB
  const supabase = getClient();
  if (!supabase) return;
  try {
    await supabase.from('scans').update({
      status: 'completed',
      overall_balance_score: result.overallBalanceScore,
      nutrient_scores: result.nutrientScores,
      focus_areas: result.focusAreas,
      recommendations: result.recommendations,
      confidence_note: result.confidenceNote,
    }).eq('id', scanId);
  } catch { /* table may not exist */ }
}

export async function getUserScans(userId: string): Promise<Scan[]> {
  if (isDemoMode()) return MOCK_SCAN_HISTORY;

  // Get ALL scans from local storage (single user per device)
  const localScans = getLocalScans();

  // Sort by date descending
  localScans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return localScans;
}

// ──── Storage (signed URLs for biometric privacy) ────

export async function uploadImage(
  file: File,
  path: string
): Promise<string> {
  if (isDemoMode()) return `demo://images/${path}`;
  const supabase = getClient();
  if (!supabase) return `local://images/${path}`;
  try {
    const { error } = await supabase.storage
      .from('scan-images')
      .upload(path, file, { upsert: true });
    if (error) throw error;

    const { data: signedData, error: signedError } = await supabase.storage
      .from('scan-images')
      .createSignedUrl(path, 3600);
    if (signedError || !signedData) {
      const { data: urlData } = supabase.storage
        .from('scan-images')
        .getPublicUrl(path);
      return urlData.publicUrl;
    }
    return signedData.signedUrl;
  } catch {
    return `local://images/${path}`;
  }
}

// ──── Helpers ────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapScanRow(row: any): Scan {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    status: row.status,
    images: {
      faceImageUrl: row.face_image_url ?? '',
      eyeImageUrl: row.eye_image_url ?? '',
      handImageUrl: row.hand_image_url ?? '',
    },
    questionnaire: row.questionnaire,
    overallBalanceScore: row.overall_balance_score,
    nutrientScores: row.nutrient_scores,
    focusAreas: row.focus_areas,
    recommendations: row.recommendations,
    confidenceNote: row.confidence_note,
  };
}
