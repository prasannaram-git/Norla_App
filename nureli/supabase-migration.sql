-- ============================================================
-- NORLA — Complete Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. USERS TABLE — Stores all registered users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  dob TEXT,
  sex TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on users"
  ON public.users FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow anon to insert/select (needed for OTP login flow)
CREATE POLICY "Anon can insert users"
  ON public.users FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can select users"
  ON public.users FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can update users"
  ON public.users FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);


-- 2. SCANS TABLE — Stores all nutrition scan results
CREATE TABLE IF NOT EXISTS public.scans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_phone TEXT,
  status TEXT DEFAULT 'processing',
  questionnaire JSONB,
  overall_balance_score INTEGER,
  nutrient_scores JSONB,
  focus_areas JSONB,
  recommendations JSONB,
  confidence_note TEXT,
  ai_raw_response TEXT,
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on scans"
  ON public.scans FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can insert scans"
  ON public.scans FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can select scans"
  ON public.scans FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can update scans"
  ON public.scans FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);


-- 3. OTP CODES TABLE — Stores OTP verification codes
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on otp_codes"
  ON public.otp_codes FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can manage otp_codes"
  ON public.otp_codes FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);


-- 4. ACTIVITY LOG — Tracks all system events
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  user_id TEXT,
  user_phone TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on activity_log"
  ON public.activity_log FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can insert activity_log"
  ON public.activity_log FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can select activity_log"
  ON public.activity_log FOR SELECT
  TO anon
  USING (true);


-- 5. GEMINI API KEYS — For admin key rotation
CREATE TABLE IF NOT EXISTS public.gemini_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.gemini_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on gemini_api_keys"
  ON public.gemini_api_keys FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can select gemini_api_keys"
  ON public.gemini_api_keys FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can update gemini_api_keys"
  ON public.gemini_api_keys FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can insert gemini_api_keys"
  ON public.gemini_api_keys FOR INSERT
  TO anon
  WITH CHECK (true);


-- 6. INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_action ON public.activity_log(action);


-- DONE! All tables created with RLS policies.
-- Your Norla app is now fully database-ready.
