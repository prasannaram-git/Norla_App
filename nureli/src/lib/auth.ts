/**
 * Authentication utilities.
 * 
 * Norla uses custom OTP-based auth (phone + WhatsApp OTP).
 * This file is kept for potential future Supabase auth integration.
 * The actual OTP flow uses /api/otp/send and /api/otp/verify routes.
 */

import { createClient } from './supabase';

function getClient() {
  const client = createClient();
  if (!client) throw new Error('Supabase is not configured. Check your environment variables.');
  return client;
}

/** Update user profile metadata (for Supabase auth users only) */
export async function updateUserProfile(profile: {
  full_name: string;
  date_of_birth: string;
  sex: string;
}) {
  const supabase = getClient();
  const { error } = await supabase.auth.updateUser({
    data: profile,
  });
  if (error) throw error;
}

export async function logOut() {
  const supabase = getClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
