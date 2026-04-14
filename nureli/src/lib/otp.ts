import { createClient } from './supabase-server';

/**
 * In-memory OTP store using globalThis — survives across module re-evaluations
 * and hot reloads in Next.js dev mode.
 */
const globalForOTP = globalThis as typeof globalThis & {
  __norlaOtpStore?: Map<string, { code: string; expiresAt: number }>;
};

if (!globalForOTP.__norlaOtpStore) {
  globalForOTP.__norlaOtpStore = new Map();
}

const otpStore = globalForOTP.__norlaOtpStore;

/**
 * Generate a 6-digit OTP
 */
export async function generateOTP(phone: string): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  // Store in global memory (RELIABLE — works across all API routes)
  otpStore.set(phone, { code, expiresAt });
  console.log(`[OTP] Generated for ${phone}: ${code} (store size: ${otpStore.size})`);

  // Also try to store in DB (optional, for persistence across server restarts)
  try {
    const supabase = createClient();
    if (supabase) {
      await supabase
        .from('otp_codes')
        .delete()
        .eq('phone', phone);

      const { error } = await supabase.from('otp_codes').insert({
        phone,
        code,
        expires_at: new Date(expiresAt).toISOString(),
        verified: false,
      });

      if (error) {
        console.log('[OTP] DB insert skipped (table may not exist):', error.message);
      }
    }
  } catch {
    // DB not available — that's fine, memory store is primary
  }

  return code;
}

/**
 * Verify OTP code — checks global memory first, then DB
 */
export async function verifyOTPCode(phone: string, code: string): Promise<boolean> {
  console.log(`[OTP] Verifying ${phone}: ${code} (store size: ${otpStore.size})`);

  // Check global memory store (PRIMARY)
  const entry = otpStore.get(phone);
  if (entry) {
    console.log(`[OTP] Found in memory: stored=${entry.code}, provided=${code}, expired=${entry.expiresAt < Date.now()}`);
    if (entry.code === code && entry.expiresAt > Date.now()) {
      otpStore.delete(phone); // One-time use
      console.log('[OTP] Verified via memory store');
      return true;
    }
  } else {
    console.log(`[OTP] Not found in memory for ${phone}. Store keys:`, [...otpStore.keys()]);
  }

  // Fallback: check DB
  try {
    const supabase = createClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('phone', phone)
        .eq('code', code)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        await supabase
          .from('otp_codes')
          .update({ verified: true })
          .eq('id', data.id);
        otpStore.delete(phone);
        console.log('[OTP] Verified via DB');
        return true;
      }
    }
  } catch {
    // DB not available
  }

  console.log('[OTP] Verification FAILED');
  return false;
}
