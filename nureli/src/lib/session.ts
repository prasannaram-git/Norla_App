/**
 * Session management with HMAC-signed cookies.
 * 
 * Instead of storing phone numbers in plaintext, we create a signed token:
 *   token = phone + "." + HMAC-SHA256(phone, secret)
 * 
 * This ensures:
 * 1. Users cannot forge sessions by editing cookie values
 * 2. Phone is extractable for routing (e.g., redirect logged-in users)
 * 3. No external DB lookup needed for every request (fast middleware)
 */

const SECRET = process.env.ADMIN_JWT_SECRET || 'norla-session-hmac-key-2026';

// ── Web Crypto API (works in both Edge Runtime and Node.js) ──

async function hmacSign(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  // Convert to URL-safe base64
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function hmacVerify(data: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(data);
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

// ── Public API ──

/**
 * Create a signed session token from a phone number.
 * Format: "phone.signature"
 */
export async function createSessionToken(phone: string): Promise<string> {
  const sig = await hmacSign(phone);
  return `${phone}.${sig}`;
}

/**
 * Verify and extract phone number from a session token.
 * Returns the phone number if valid, null if tampered/invalid.
 */
export async function verifySessionToken(token: string): Promise<string | null> {
  if (!token || typeof token !== 'string') return null;

  const lastDot = token.lastIndexOf('.');
  if (lastDot === -1) return null;

  const phone = token.substring(0, lastDot);
  const sig = token.substring(lastDot + 1);

  if (!phone || !sig) return null;

  const valid = await hmacVerify(phone, sig);
  return valid ? phone : null;
}
