import { SERVER_URL } from './constants';
import { getSession } from './storage';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  timeout?: number;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, timeout = 30000 } = options;

  const session = await getSession();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    // Send session token as Authorization header for React Native
    if (session?.token) {
      headers['Authorization'] = `Bearer ${session.token}`;
    }

    const res = await fetch(`${SERVER_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timer);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. Server may be starting up — please try again.', 408);
    }
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || 'Network error', 0);
  }
}

// ── Auth ──

export async function sendOTP(phone: string) {
  return request<{ success: boolean; method: string; dev_code?: string }>('/api/otp/send', {
    method: 'POST',
    body: { phone },
  });
}

export async function verifyOTP(phone: string, code: string) {
  return request<{
    success: boolean;
    phone: string;
    sessionToken: string;
    profile: { phone: string; name: string; dob: string; sex: string } | null;
  }>('/api/otp/verify', {
    method: 'POST',
    body: { phone, code },
  });
}

// ── Scan ──

export async function submitScan(payload: {
  faceImage: string;
  eyeImage: string;
  leftHandImage: string;
  rightHandImage: string;
  questionnaire: Record<string, any>;
}) {
  return request<{
    scanId: string;
    overallBalanceScore: number;
    nutrientScores: Record<string, any>;
    focusAreas: any[];
    recommendations: any[];
    confidenceNote: string;
    aiUsed: boolean;
    processingTime: number;
  }>('/api/analyze', {
    method: 'POST',
    body: {
      faceImage: payload.faceImage,
      eyeImage: payload.eyeImage,
      handImage: payload.leftHandImage,
      leftHandImage: payload.leftHandImage,
      rightHandImage: payload.rightHandImage,
      questionnaire: payload.questionnaire,
    },
    timeout: 150000,
  });
}

// ── Sync (matches /api/sync endpoint format) ──

export async function syncProfile(profile: { phone: string; name: string; dob: string; sex: string }) {
  return request('/api/sync', {
    method: 'POST',
    body: { type: 'user', data: profile },
    timeout: 10000,
  }).catch(() => {}); // fire-and-forget
}

export async function syncScanToServer(scanData: {
  id: string;
  overallBalanceScore: number;
  nutrientScores?: Record<string, any>;
  focusAreas?: any[];
  recommendations?: any[];
  confidenceNote?: string;
  createdAt: string;
}, userPhone: string) {
  return request('/api/sync', {
    method: 'POST',
    body: {
      type: 'scan',
      data: {
        ...scanData,
        userId: `phone-${userPhone}`,
        userPhone,
        status: 'completed',
      },
    },
    timeout: 10000,
  }).catch(() => {}); // fire-and-forget
}

// ── Account ──

export async function deleteAccount() {
  return request('/api/user/delete', { method: 'DELETE' });
}

// ── Scan History Restore ──

export async function fetchScansFromServer(): Promise<{
  id: string;
  overallBalanceScore: number;
  nutrientScores?: Record<string, any>;
  focusAreas?: any[];
  recommendations?: any[];
  confidenceNote?: string;
  createdAt: string;
}[]> {
  try {
    const res = await request<{ scans: any[] }>('/api/scans', { timeout: 15000 });
    if (!res.scans || !Array.isArray(res.scans)) return [];
    return res.scans.map((s: any) => ({
      id: s.id || s.scan_id || `server-${Date.now()}`,
      overallBalanceScore: s.overall_balance_score ?? s.overallBalanceScore ?? 0,
      nutrientScores: s.nutrient_scores ?? s.nutrientScores,
      focusAreas: s.focus_areas ?? s.focusAreas,
      recommendations: s.recommendations,
      confidenceNote: s.confidence_note ?? s.confidenceNote,
      createdAt: s.created_at ?? s.createdAt ?? new Date().toISOString(),
    }));
  } catch {
    return []; // Silently fail — local cache still works
  }
}

// ── Health ──

export async function checkHealth() {
  return request<{ status: string }>('/api/health', { timeout: 10000 });
}

export { ApiError };
