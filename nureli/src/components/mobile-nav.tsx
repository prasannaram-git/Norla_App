'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, ScanLine, Clock, User } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/scan/new', label: 'Scan', icon: ScanLine },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/profile', label: 'Profile', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleNav = (href: string) => {
    try {
      // Try Next.js client-side navigation first (instant, no reload)
      router.push(href);
    } catch {
      // Fallback: full page navigation (always works, even if React is broken)
      window.location.href = href;
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl"
      style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around h-[64px]">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => handleNav(item.href)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-[3px] w-16 h-full transition-all duration-200 bg-transparent border-none cursor-pointer',
                isActive ? 'text-brand-600' : 'text-neutral-400 hover:text-neutral-600'
              )}
            >
              {isActive && (
                <div className="absolute top-0 h-[2.5px] w-8 rounded-full bg-gradient-to-r from-brand-400 to-brand-600" />
              )}
              <div className={cn(
                'flex items-center justify-center h-8 w-8 rounded-xl transition-all duration-200',
                isActive ? 'bg-brand-50' : ''
              )}>
                <item.icon
                  className={cn(
                    'h-[20px] w-[20px]',
                    isActive ? 'text-brand-600' : 'text-neutral-400'
                  )}
                  strokeWidth={isActive ? 2.2 : 1.6}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] tracking-wide',
                  isActive ? 'font-bold text-brand-600' : 'font-medium text-neutral-400'
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
