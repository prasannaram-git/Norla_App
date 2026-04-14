# Norla — Production Deployment Guide

## Overview

Norla is a Production-Ready **Progressive Web App (PWA)** that can be installed on any phone like a native app.

---

## Quick Start: Install on Phone

### Step 1: Start Production Server
```bash
cd nureli
npm run build
npm run start
```
The app runs at `http://localhost:3000` or your network IP.

### Step 2: Open on Phone
1. Connect your phone to the same WiFi network
2. Open Chrome/Safari on your phone
3. Navigate to `http://<YOUR-PC-IP>:3000`
4. **Chrome (Android)**: Tap ⋮ menu → "Add to Home Screen" → "Install"
5. **Safari (iOS)**: Tap Share → "Add to Home Screen"

The app now appears on your home screen like a native app!

### Step 3: Auto-Updates
When you change code and restart the server:
1. The service worker detects the new version
2. Downloads it in the background
3. Auto-refreshes the app within 60 seconds
4. **No need to reinstall** — updates happen automatically

---

## Production Deployment Options

### Option 1: Railway (Recommended — Free Tier)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway init
railway up
```
Railway will give you a public URL like `https://norla-xyz.up.railway.app`

### Option 2: Vercel
```bash
npx vercel --prod
```
Note: Server-side file store (.norla-data/) won't persist on Vercel.
Use Supabase (run migration SQL) for persistent data on Vercel.

### Option 3: VPS (DigitalOcean, AWS EC2)
```bash
# On your VPS:
git clone <your-repo>
cd nureli
npm install
npm run build
npm run start
```

---

## Environment Variables (Required)

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `GEMINI_API_KEY` | Google Gemini API key for AI analysis | Yes |
| `ADMIN_USERNAME` | Admin panel login username | Yes |
| `ADMIN_PASSWORD` | Admin panel login password | Yes |
| `ADMIN_JWT_SECRET` | Secret for admin JWT tokens | Yes |
| `NEXT_PUBLIC_APP_URL` | Your production URL | Yes |

---

## Database Setup (Optional — For Cloud Persistence)

If deploying to platforms without persistent storage, run the Supabase migration:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor**
4. Paste contents of `supabase-migration.sql`
5. Click **Run**

This creates: `users`, `scans`, `otp_codes`, `activity_log`, `gemini_api_keys`

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Mobile     │────▶│  Next.js     │────▶│  Gemini AI  │
│   PWA App    │◀────│  Server      │◀────│  (Vision)   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │ .norla-data  │
                    │ (File Store) │
                    └─────────────┘
```

- **Client**: PWA with localStorage for instant access
- **Server**: File-based store for admin panel & data persistence
- **AI**: Google Gemini for image analysis (face, eye, hand)
- **Auth**: Phone + OTP via WhatsApp or dev codes
