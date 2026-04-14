import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor Config — Norla
 *
 * IMPORTANT: Before building the Android APK/AAB for Play Store,
 * set PRODUCTION_URL to your Render.com / Railway server URL.
 *
 * Steps:
 *   1. Deploy nureli/ to Render.com (see ../render.yaml)
 *   2. Get your production URL e.g. https://norla-server.onrender.com
 *   3. Replace the server.url below with that URL
 *   4. Run: npx cap sync android
 *   5. Build: cd android && ./gradlew bundleRelease
 */

// ── Set your production URL here after deploying ──────────────────
const PRODUCTION_URL = process.env.CAPACITOR_SERVER_URL || 'https://norla-server.onrender.com';

// Use local server in development only
const isDev = process.env.NODE_ENV !== 'production';

const config: CapacitorConfig = {
  appId: 'com.norla.app',
  appName: 'Norla',
  webDir: 'out',

  server: {
    // In development: point to local server
    // In production (Play Store build): point to your deployed server
    url: isDev ? 'http://10.0.2.2:3000' : PRODUCTION_URL,
    cleartext: isDev, // Only allow HTTP in dev; production must use HTTPS
  },

  android: {
    allowMixedContent: false,       // ❌ No mixed HTTP/HTTPS in production
    captureInput: true,             // Better keyboard handling
    webContentsDebuggingEnabled: false, // ❌ Disable in production
    backgroundColor: '#ffffff',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0D9488',   // Norla teal brand color
      showSpinner: false,
      androidSplashResourceName: 'splash',
      launchAutoHide: true,
    },
    StatusBar: {
      style: 'DARK',               // Dark icons on light background
      backgroundColor: '#ffffff',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
    },
  },
};

export default config;
