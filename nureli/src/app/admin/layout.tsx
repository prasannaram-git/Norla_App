'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, ScanLine, Settings, Activity, LogOut, Key } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/scans', label: 'Scans', icon: ScanLine },
  { href: '/admin/keys', label: 'API Keys', icon: Key },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/activity', label: 'Activity', icon: Activity },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    if (!t && pathname !== '/admin/login') {
      router.push('/admin/login');
    } else {
      setToken(t);
    }
  }, [pathname, router]);

  // Login page — no sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <div className="h-5 w-5 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  };

  return (
    <div className="flex h-screen bg-neutral-50" style={{ fontFamily: "'DM Sans', Inter, -apple-system, sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-[240px] bg-white border-r border-neutral-200/60 flex flex-col">
        <div className="flex items-center gap-2.5 px-6 h-16 border-b border-neutral-200/60">
          <img src="/logo.png" alt="Norla" className="h-8 w-8 object-contain" />
          <div>
            <span className="text-[15px] font-bold text-neutral-900 tracking-tight">Norla</span>
            <span className="text-[10px] text-neutral-400 font-semibold ml-1.5 uppercase tracking-wider">Admin</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            const isExactDashboard = item.href === '/admin' && pathname === '/admin';
            const active = isActive || isExactDashboard;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                  active
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <item.icon className="h-4 w-4" strokeWidth={active ? 2.2 : 1.6} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
