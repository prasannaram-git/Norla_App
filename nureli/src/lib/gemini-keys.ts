import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from './supabase-server';

interface GeminiKey {
  id: string;
  api_key: string;
  name: string;
  is_active: boolean;
  usage_count: number;
  error_count: number;
}

/**
 * Get all active Gemini API keys from DB, sorted by usage (least used first)
 * Falls back to env variable if no DB keys configured
 */
async function getApiKeys(): Promise<GeminiKey[]> {
  const supabase = createClient();
  if (supabase) {
    const { data } = await supabase
      .from('gemini_api_keys')
      .select('*')
      .eq('is_active', true)
      .order('usage_count', { ascending: true });

    if (data && data.length > 0) return data;
  }

  // Fallback to env variable
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey) {
    return [{
      id: 'env',
      api_key: envKey,
      name: 'Environment Key',
      is_active: true,
      usage_count: 0,
      error_count: 0,
    }];
  }

  return [];
}

/**
 * Record successful usage of a key
 */
async function recordUsage(keyId: string): Promise<void> {
  if (keyId === 'env') return;
  const supabase = createClient();
  if (!supabase) return;

  // Get current count, then increment
  const { data } = await supabase
    .from('gemini_api_keys')
    .select('usage_count')
    .eq('id', keyId)
    .single();

  await supabase
    .from('gemini_api_keys')
    .update({
      usage_count: (data?.usage_count || 0) + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', keyId);
}

/**
 * Record an error for a key
 */
async function recordError(keyId: string, error: string): Promise<void> {
  if (keyId === 'env') return;
  const supabase = createClient();
  if (!supabase) return;

  // Get current error count
  const { data } = await supabase
    .from('gemini_api_keys')
    .select('error_count')
    .eq('id', keyId)
    .single();

  const newCount = (data?.error_count || 0) + 1;

  await supabase
    .from('gemini_api_keys')
    .update({
      error_count: newCount,
      last_error: error,
      // Disable key after 10 consecutive errors
      is_active: newCount < 10,
    })
    .eq('id', keyId);
}

/**
 * Get a Gemini model with automatic key fallback.
 * Tries each active key in order until one succeeds.
 */
export async function getGeminiModelWithFallback(modelName = 'gemini-2.0-flash') {
  const keys = await getApiKeys();

  if (keys.length === 0) {
    throw new Error('No Gemini API keys configured');
  }

  // Return the model along with the key info for tracking
  for (const key of keys) {
    try {
      const genAI = new GoogleGenerativeAI(key.api_key);
      const model = genAI.getGenerativeModel({ model: modelName });

      return {
        model,
        keyId: key.id,
        onSuccess: () => recordUsage(key.id),
        onError: (err: string) => recordError(key.id, err),
      };
    } catch {
      await recordError(key.id, 'Failed to create client');
      continue;
    }
  }

  throw new Error('All Gemini API keys failed');
}
