import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { ClientErrorBoundary } from '@/components/client-error-boundary';
import { PWARegister } from '@/components/pwa-register';

export const metadata: Metadata = {
  title: 'Norla — Smarter Nutrition Insight',
  description:
    'AI-powered nutrition insight that helps you understand your predicted nutrition pattern through image analysis and lifestyle inputs.',
  keywords: ['nutrition', 'AI', 'wellness', 'health insight', 'nutrition analysis', 'Norla'],
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Norla',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#0D9488',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Non-blocking font loading — Inter + DM Sans for premium typography */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Apple PWA meta */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Norla" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body suppressHydrationWarning>
        <ClientErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
        </ClientErrorBoundary>
        <PWARegister />
      </body>
    </html>
  );
}
