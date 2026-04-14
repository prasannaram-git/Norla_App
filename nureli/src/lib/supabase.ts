import { createBrowserClient } from '@supabase/ssr';

let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // Return cached client if available (prevents multiple instances on mobile)
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === 'https://your-project.supabase.co') {
    return null;
  }

  try {
    cachedClient = createBrowserClient(url, key);
    return cachedClient;
  } catch (error) {
    console.warn('[Supabase] Failed to create client:', error);
    return null;
  }
}
