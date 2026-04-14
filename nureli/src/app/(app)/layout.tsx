import { AppShell } from '@/components/app-shell';

// Prevent static prerendering for all authenticated pages
export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
