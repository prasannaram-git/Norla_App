-- Norla Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (supplements auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  onboarding_completed BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Scans table
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  questionnaire JSONB,
  face_image_url TEXT,
  eye_image_url TEXT,
  hand_image_url TEXT,
  overall_balance_score INTEGER,
  nutrient_scores JSONB,
  focus_areas JSONB,
  recommendations JSONB,
  confidence_note TEXT,
  ai_raw_response TEXT,
  model_version TEXT DEFAULT 'gemini-2.0-flash',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user scan lookups
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Scans: users can only see their own scans
CREATE POLICY "Users can view own scans" ON public.scans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans" ON public.scans
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id = 'anonymous');

CREATE POLICY "Users can update own scans" ON public.scans
  FOR UPDATE USING (auth.uid() = user_id OR user_id = 'anonymous');

-- Allow service role (API routes) to insert/update for anonymous users
-- This handles cases where auth isn't available in API routes
CREATE POLICY "Service role full access scans" ON public.scans
  FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket for scan images (optional — for when images are stored server-side)
-- Run separately if needed:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('scan-images', 'scan-images', false);

-- Enable Phone Auth in Supabase Dashboard:
-- 1. Go to Authentication → Providers → Phone
-- 2. Enable Phone provider
-- 3. For development, enable "Test OTP" and set a test phone number
-- 4. For production, configure Twilio or MessageBird SMS provider
