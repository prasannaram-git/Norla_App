'use client';

import { MobileNav } from './mobile-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col" style={{ minHeight: '100dvh' }}>
      <main className="flex-1 pb-20">{children}</main>
      <MobileNav />
    </div>
  );
}
