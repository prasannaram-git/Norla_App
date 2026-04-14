# Norla — Zero Cost Deployment & Play Store Launch Guide
## Complete Step-by-Step Instructions

---

## OVERVIEW: What We're Setting Up

```
Your PC (Admin Panel) ──→ Render.com (Free Server 24/7) ──→ Users Worldwide
                                  │
                          WhatsApp Baileys (OTP)
                          Supabase (Database)
                          Google Gemini AI
```

**Total cost: ₹0 / $0** (everything on free tiers)

---

## STEP 1: Set Up Supabase (Free Database)

1. Go to **https://supabase.com** → Sign Up (free)
2. Create new project → Give it a name (e.g., "norla")
3. Choose a strong database password → Save it
4. Wait 2-3 minutes for project to initialize
5. Go to **SQL Editor** (left sidebar)
6. Copy the entire contents of `nureli/supabase-migration.sql`
7. Paste it in the SQL Editor → Click **Run**
8. Verify tables are created: Users, Scans, OTP Codes, Activity Log, Gemini API Keys
9. Go to **Settings → API** → Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## STEP 2: Get Google Gemini API Key (Free)

1. Go to **https://aistudio.google.com/app/apikey**
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key → `GEMINI_API_KEY`
5. Free tier: 60 requests/minute, 1500 requests/day — more than enough to start

---

## STEP 3: Deploy to Render.com (Free 24/7 Server)

### 3.1 Push Code to GitHub
```bash
# In the root Nureli V1.00 folder — open PowerShell/Terminal
git init
git add .
git commit -m "Initial Norla deployment"

# Create a repo on github.com → push to it
git remote add origin https://github.com/YOUR_USERNAME/norla.git
git push -u origin main
```

### 3.2 Create Render Service
1. Go to **https://render.com** → Sign Up (free, use GitHub login)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Render will auto-detect `render.yaml` — select it
5. If not auto-detected, set manually:
   - **Root Directory**: `nureli`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Runtime**: Node
   - **Region**: Singapore (closest to India)

### 3.3 Set Environment Variables in Render
Go to your service → **Environment** tab → Add these:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | (from Step 1) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (from Step 1) |
| `GEMINI_API_KEY` | (from Step 2) |
| `ADMIN_USERNAME` | your_admin_username |
| `ADMIN_PASSWORD` | your_strong_password |
| `ADMIN_JWT_SECRET` | (generate below) |
| `NEXT_PUBLIC_APP_URL` | https://norla-server.onrender.com |
| `NEXT_PUBLIC_CONTACT_EMAIL` | your@email.com |
| `NEXT_PUBLIC_DEMO_MODE` | false |

**Generate JWT Secret** (run in PowerShell):
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.4 Deploy
- Click **Deploy** → Wait 5-10 minutes for first build
- Your app will be live at: `https://norla-server.onrender.com`
- Test it: Open that URL in your phone browser — Norla should load!

---

## STEP 4: Keep Server Awake (Free — Prevents WhatsApp Disconnect)

Render free tier sleeps after 15 minutes. Fix this with UptimeRobot (free):

1. Go to **https://uptimerobot.com** → Sign Up (free)
2. Click **Add New Monitor**
3. Monitor Type: **HTTP(s)**
4. Friendly Name: `Norla Server`
5. URL: `https://norla-server.onrender.com/api/health`
6. Monitoring Interval: **5 minutes**
7. Click **Create Monitor**

✅ **Done!** Your server now stays awake 24/7. WhatsApp will stay connected.

---

## STEP 5: Connect WhatsApp for OTP (FREE)

**You need a WhatsApp number for this. Use a spare/cheap SIM card.**

1. Open your Admin Panel: `https://norla-server.onrender.com/admin`
2. Login with your `ADMIN_USERNAME` and `ADMIN_PASSWORD`
3. Go to **Settings** (left sidebar)
4. Click **Connect** next to "Number 1"
5. A QR code will appear
6. On your spare phone: **WhatsApp → Settings → Linked Devices → Link a Device**
7. Scan the QR code
8. ✅ **"Connected"** status should appear with your phone number
9. Test it: Enter any phone number → Click "Send Test" → Receive OTP on WhatsApp

**For redundancy (recommended):** Connect Number 2 with a second WhatsApp number.
The system automatically round-robins between connected numbers.

---

## STEP 6: Generate Android App Icons

```powershell
# In the nureli/ folder:
node scripts/generate-android-icons.js
```

This creates:
- All required Android icon sizes in `android/app/src/main/res/mipmap-*/`
- `play-store-icon-512.png` for Play Store listing
- `play-store-feature-graphic.png` (1024x500) for Play Store listing

---

## STEP 7: Generate Android Signing Keystore (ONE TIME ONLY)

⚠️ **Do this once. Back up the keystore file. Never lose it.**

```powershell
# In the nureli/ folder:
node scripts/generate-keystore.js
```

Follow the prompts. After generating, add the signing config to `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('../../../norla-release.keystore')
            storePassword 'YOUR_STORE_PASSWORD'
            keyAlias 'norla'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            // ... rest of existing config
        }
    }
}
```

---

## STEP 8: Build the Android App

### 8.1 Update Production URL
Edit `capacitor.config.ts` line ~19:
```typescript
const PRODUCTION_URL = 'https://norla-server.onrender.com'; // Your actual URL
```

### 8.2 Sync and Build
```powershell
# In the nureli/ folder:
npx cap sync android

# Build the release AAB (required for Play Store)
cd android
./gradlew bundleRelease

# Output file (upload this to Play Store):
# android/app/build/outputs/bundle/release/app-release.aab
```

### 8.3 Test on Real Device
```powershell
# Build debug APK to test on your phone first
cd android
./gradlew assembleDebug

# APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
# Transfer to your phone and install
```

---

## STEP 9: Register Google Play Developer Account ($25 One-Time)

1. Go to **https://play.google.com/console**
2. Sign in → Create developer account ($25 registration fee)
3. Complete identity verification (takes 1-2 days)

---

## STEP 10: Submit to Play Store

### 10.1 Create Store Listing
1. Play Console → **Create App**
2. App name: **Norla**
3. Default language: English
4. App type: **App**
5. Category: **Health & Fitness**

### 10.2 Fill Store Listing (use PLAY_STORE_LISTING.md content)
- Short description (80 chars)
- Full description (4000 chars)
- Screenshots (take on your phone with the app loaded)
- Feature graphic: use `play-store-feature-graphic.png`
- Icon: use `play-store-icon-512.png`

### 10.3 Complete Required Sections
- **Privacy Policy URL**: `https://norla-server.onrender.com/privacy`
- **Data Safety**: Camera, phone number (see PLAY_STORE_LISTING.md)
- **Content Rating**: Fill the questionnaire → Should get PEGI 3 / Everyone
- **Target Audience**: 13 and older

### 10.4 Upload the AAB
- Go to **Production** → **Create New Release**
- Upload: `android/app/build/outputs/bundle/release/app-release.aab`
- Release notes: "Initial release of Norla — AI nutrition insight app"

### 10.5 Submit for Review
- Review usually takes **1-7 days** for new apps
- Monitor your email for feedback from Google

---

## QUICK REFERENCE: All URLs After Deployment

| Resource | URL |
|----------|-----|
| **User App** | https://norla-server.onrender.com |
| **Admin Panel** | https://norla-server.onrender.com/admin |
| **Privacy Policy** | https://norla-server.onrender.com/privacy |
| **Terms of Service** | https://norla-server.onrender.com/terms |
| **Health Check** | https://norla-server.onrender.com/api/health |

---

## TROUBLESHOOTING

### WhatsApp disconnects after server restart
→ Go to Admin Panel → Settings → Reconnect the slot(s) → Scan QR again
→ Make sure UptimeRobot is running (prevents server sleep)

### Build fails with "keytool not found"
→ Find Android Studio's Java: `C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe`
→ Add it to PATH or use the full path in the keytool command

### Render deployment fails
→ Check Render dashboard → Logs → Look for npm install errors
→ Most common issue: node version mismatch. Add `engines` to package.json:
```json
"engines": { "node": ">=20.0.0" }
```

### App shows white screen on phone
→ Check if the Render server is awake: visit `/api/health`
→ Check WhatsApp connection in admin panel
→ Check browser console for errors (Chrome → DevTools → Console)
