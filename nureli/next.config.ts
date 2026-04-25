import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Allow large request bodies for image uploads (base64 from mobile camera)
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },

  // Allow mobile devices on local network to load dev JS/CSS bundles
  // Without this, Next.js 16 blocks cross-origin dev resources → blank pages on mobile
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*', '172.16.*.*', '127.0.0.1'],

  // Server-side packages that use native bindings — must NOT be bundled
  serverExternalPackages: [
    '@whiskeysockets/baileys',
    '@hapi/boom',
    'sharp',
    'jimp',
    'qrcode',
  ],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'supabase.co' },
    ],
    unoptimized: false,
  },

  async headers() {
    return [
      {
        // CORS for API routes (React Native app calls from any origin)
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
      {
        // Service Worker must not be cached by the browser
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript' },
        ],
      },
      {
        // Security headers for all routes
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
