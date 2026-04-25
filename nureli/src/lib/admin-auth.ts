/**
 * Shared admin authentication helper.
 * 
 * Centralizes the JWT verification logic that was previously duplicated
 * across 7 admin API routes with subtle inconsistencies.
 */

import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'norla-admin-fallback'
);

/**
 * Verify that the request has a valid admin JWT token.
 * Returns true if the token is valid, false otherwise.
 */
export async function isAdmin(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  try {
    await jwtVerify(auth.slice(7), SECRET);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the admin JWT signing secret (for token creation in auth route).
 */
export function getAdminSecret() {
  return SECRET;
}
