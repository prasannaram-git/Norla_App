import { createClient } from './supabase';

function getClient() {
  const client = createClient();
  if (!client) throw new Error('Supabase is not configured. Check your environment variables.');
  return client;
}

/** Send OTP to phone number */
export async function sendOTP(phone: string) {
  const supabase = getClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw error;
}

/** Verify OTP code */
export async function verifyOTP(phone: string, token: string) {
  const supabase = getClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });
  if (error) throw error;
  return data.user;
}

/** Update user profile metadata after onboarding */
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
