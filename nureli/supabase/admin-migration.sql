-- Norla Admin Panel Database Schema
-- Run this in your Supabase SQL Editor AFTER the base migration

-- ── OTP Codes ──
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_codes(phone, code);

-- ── Admin Settings (key-value store) ──
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Gemini API Keys ──
CREATE TABLE IF NOT EXISTS public.gemini_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'API Key',
  api_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Activity Log ──
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  user_phone TEXT,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity_log(user_id);

-- ── RLS Policies ──
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gemini_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Allow all operations via service role (API routes use service key)
CREATE POLICY "Service full access otp" ON public.otp_codes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full access settings" ON public.admin_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full access keys" ON public.gemini_api_keys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full access activity" ON public.activity_log FOR ALL USING (true) WITH CHECK (true);

-- Insert default WhatsApp settings
INSERT INTO public.admin_settings (key, value) VALUES
  ('whatsapp_phone_number_id', ''),
  ('whatsapp_access_token', ''),
  ('whatsapp_business_id', ''),
  ('admin_whatsapp_number', '')
ON CONFLICT (key) DO NOTHING;
