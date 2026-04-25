'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/section-header';
import { ScanHistoryCard } from '@/components/scan-history-card';
import { EmptyState } from '@/components/empty-state';
import { useAuth } from '@/contexts/auth-context';
import { getUserScans } from '@/lib/db';
import type { Scan } from '@/types/scan';
import { ScanLine, BarChart3, TrendingUp, Activity, ArrowRight, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const { user, norlaUser } = useAuth();
  const userId = user?.id || 'anonymous';

  const [mounted, setMounted] = useState(false);
  const [scans, setScans] = useState<Scan[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // SINGLE useEffect — loads EVERYTHING on client mount
  // This guarantees server HTML === client HTML (both render skeleton)
  useEffect(() => {
    setScans(getUserScans(userId));
    setMounted(true);
  }, [userId]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setScans(getUserScans(userId));
      setRefreshing(false);
    }, 500);
  };

  const latestScore = scans[0]?.overallBalanceScore ?? null;
  const userName = norlaUser?.name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  const greeting = useMemo(() => {
    if (!mounted) return '';
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }, [mounted]);

  // SKELETON — rendered on BOTH server and initial client render
  // This guarantees zero hydration mismatch
  if (!mounted) {
    return (
      <div className="px-5 py-6 max-w-lg mx-auto">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="h-9 w-9 rounded-xl bg-neutral-100 animate-pulse" />
          <div className="h-5 w-16 rounded bg-neutral-100 animate-pulse" />
        </div>
        <div className="h-4 w-24 rounded bg-neutral-100 animate-pulse mb-2" />
        <div className="h-8 w-40 rounded bg-neutral-100 animate-pulse mb-8" />
        <div className="grid grid-cols-3 gap-2.5 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-neutral-50 h-[110px] animate-pulse" />
          ))}
        </div>
        <div className="rounded-2xl bg-neutral-100 h-[120px] animate-pulse mb-8" />
        <div className="h-5 w-32 rounded bg-neutral-100 animate-pulse mb-4" />
        <div className="space-y-2.5">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl bg-neutral-50 h-[80px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 max-w-lg mx-auto">
      {/* Brand Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Norla" className="h-9 w-9 object-contain" />
          <span className="text-[18px] font-bold tracking-[-0.02em] text-neutral-900" style={{ fontFamily: 'var(--font-display)' }}>Norla</span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex h-8 items-center gap-1.5 rounded-full bg-neutral-50 px-3 text-[11px] font-semibold text-neutral-400 tracking-wide hover:bg-neutral-100 transition-all disabled:opacity-50"
          style={{ border: '1px solid rgba(0,0,0,0.04)' }}
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Syncing...' : 'Refresh'}
        </button>
      </div>

      {/* Welcome */}
      <div className="mb-8">
        <span className="text-[13px] text-neutral-400 font-medium">
          {greeting}{greeting ? ',' : ''}
        </span>
        <h1 className="text-[26px] font-bold tracking-[-0.035em] text-neutral-900" style={{ fontFamily: 'var(--font-display)' }}>
          {userName}
        </h1>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2.5 mb-8">
        {[
          { label: 'Total Scans', value: scans.length, icon: BarChart3, color: '#059669' },
          { label: 'Latest Score', value: latestScore ?? '--', icon: TrendingUp, color: '#6366F1' },
          { label: 'Status', value: scans.length > 0 ? 'Active' : 'New', icon: Activity, color: '#0EA5E9' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-white p-4 shadow-card hover-lift" style={{ border: '1px solid rgba(0,0,0,0.04)' }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl mb-3" style={{ backgroundColor: `${stat.color}0D` }}>
              <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
            </div>
            <p className="text-[20px] font-bold text-neutral-900 tabular-nums tracking-tight leading-none mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              {stat.value}
            </p>
            <p className="text-[10px] text-neutral-400 uppercase tracking-[0.12em] font-semibold">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* New Scan CTA */}
      <div className="mb-8">
        <Link href="/scan/new">
          <div className="rounded-2xl bg-neutral-900 p-6 active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden shadow-premium">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-brand-400 uppercase tracking-[0.1em]">AI Powered</span>
                <h3 className="text-[17px] font-bold text-white mt-1" style={{ fontFamily: 'var(--font-display)' }}>Start New Scan</h3>
                <p className="text-[12px] text-neutral-400 mt-1">Upload images and answer questions</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                <ScanLine className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Scans */}
      <SectionHeader title="Recent Insights" />

      {scans.length === 0 ? (
        <EmptyState
          title="No scans yet"
          description="Complete your first nutrition scan to see your predicted pattern."
          actionLabel="Start Scan"
          onAction={() => { window.location.href = '/scan/new'; }}
        />
      ) : (
        <div className="space-y-2.5">
          {scans.slice(0, 5).map((scan, i) => (
            <ScanHistoryCard key={scan.id} scan={scan} index={i} />
          ))}
          {scans.length > 5 && (
            <div className="text-center pt-3">
              <Link href="/history">
                <Button variant="ghost" size="sm" className="text-[12px] gap-1 text-brand-600 font-semibold">
                  View all insights <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
