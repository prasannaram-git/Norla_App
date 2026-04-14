import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client for API routes.
 * 
 * Uses @supabase/supabase-js directly (NOT the SSR browser client)
 * because API routes run on the server and don't have browser cookies.
 * 
 * Uses the service_role key if available (bypasses RLS),
 * otherwise falls back to anon key.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Prefer service_role key (bypasses RLS) → fall back to anon key
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === 'https://your-project.supabase.co') {
    console.warn('[Supabase] Missing URL or key — database operations will be skipped');
    return null;
  }

  try {
    return createSupabaseClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (err) {
    console.error('[Supabase] Failed to create client:', err);
    return null;
  }
}
