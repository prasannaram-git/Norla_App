import { createBrowserClient } from '@supabase/ssr';

/**
 * Server-side Supabase client for API routes.
 * Uses the same credentials but can access auth from request cookies.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === 'https://your-project.supabase.co') {
    return null;
  }

  try {
    return createBrowserClient(url, key);
  } catch {
    return null;
  }
}
