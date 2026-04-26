/**
 * Run this script to create the ai_keys table in Supabase.
 * Usage: node create-ai-keys-table.js
 * 
 * Requires SUPABASE_SERVICE_ROLE_KEY or uses the anon key.
 */

const SUPABASE_URL = 'https://arecxxembfpahzgzbipb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyZWN4eGVtYmZwYWh6Z3piaXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI2MjcsImV4cCI6MjA5MTE0ODYyN30.wMbxfBdH7NjNj-tte0N5VNzGEqeTg4d4xSYoOvzlCXQ';

const SQL = `
CREATE TABLE IF NOT EXISTS ai_keys (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'API Key',
  api_key TEXT NOT NULL,
  provider TEXT DEFAULT 'openrouter',
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_keys DISABLE ROW LEVEL SECURITY;
`;

async function main() {
  console.log('Creating ai_keys table in Supabase...');
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: SQL }),
  });

  if (res.ok) {
    console.log('✅ Table created successfully!');
  } else {
    const err = await res.text();
    console.log('Note: RPC method may not exist. Please create the table manually.');
    console.log('');
    console.log('Go to: https://supabase.com/dashboard/project/arecxxembfpahzgzbipb/sql/new');
    console.log('Paste and run this SQL:');
    console.log('');
    console.log(SQL);
  }
}

main().catch(console.error);
