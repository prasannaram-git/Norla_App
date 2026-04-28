import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SESSION_TOKEN: 'norla_session_token',
  USER_PHONE: 'norla_user_phone',
  USER_PROFILE: 'norla_user_profile',
  SCAN_CACHE: 'norla_scans',
};

// ── Session ──

export async function saveSession(token: string, phone: string): Promise<void> {
  if (!token || !phone) {
    console.warn('[Storage] saveSession called with empty token or phone');
    return;
  }
  await AsyncStorage.multiSet([
    [KEYS.SESSION_TOKEN, token],
    [KEYS.USER_PHONE, phone],
  ]);
}

export async function getSession(): Promise<{ token: string; phone: string } | null> {
  const values = await AsyncStorage.multiGet([KEYS.SESSION_TOKEN, KEYS.USER_PHONE]);
  const token = values[0][1];
  const phone = values[1][1];
  if (token && phone) return { token, phone };
  return null;
}

export async function clearSession(): Promise<void> {
  // Clear ALL user data — scans are restored from server on next login
  await AsyncStorage.multiRemove([
    KEYS.SESSION_TOKEN,
    KEYS.USER_PHONE,
    KEYS.USER_PROFILE,
    KEYS.SCAN_CACHE,
    'norla_intro_seen',
    'norla_nutrition_plan',
  ]);
}

// ── User Profile ──

export interface UserProfile {
  phone: string;
  name: string;
  dob: string;
  sex: string;
  height?: number;  // cm
  weight?: number;  // kg
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
}

export async function getProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(KEYS.USER_PROFILE);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ── Scans Cache ──

export interface ScanCache {
  id: string;
  overallBalanceScore: number;
  confidenceNote?: string;
  createdAt: string;
  nutrientScores?: Record<string, any>;
  focusAreas?: any[];
  recommendations?: any[];
}

export async function saveScans(scans: ScanCache[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.SCAN_CACHE, JSON.stringify(scans));
}

export async function getScans(): Promise<ScanCache[]> {
  const raw = await AsyncStorage.getItem(KEYS.SCAN_CACHE);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export async function addScanToCache(scan: ScanCache): Promise<void> {
  const scans = await getScans();
  scans.unshift(scan);
  await saveScans(scans);
}

// ── Daily Scan Limit ──

const DEV_PHONE = '+918050104296';

export function isDeveloper(phone: string): boolean {
  return phone === DEV_PHONE;
}

export async function canScanToday(): Promise<boolean> {
  const session = await getSession();
  if (session && isDeveloper(session.phone)) return true;

  const scans = await getScans();
  if (scans.length === 0) return true;

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const hasToday = scans.some(s => s.createdAt.slice(0, 10) === today);
  return !hasToday;
}
