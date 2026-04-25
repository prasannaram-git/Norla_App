'use client';

import { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/section-header';
import { ScanHistoryCard } from '@/components/scan-history-card';
import { EmptyState } from '@/components/empty-state';
import { useAuth } from '@/contexts/auth-context';
import { getUserScans } from '@/lib/db';
import type { Scan } from '@/types/scan';
import { RefreshCw } from 'lucide-react';

export default function HistoryPage() {
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';

  const [mounted, setMounted] = useState(false);
  const [scans, setScans] = useState<Scan[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  // Skeleton — identical on server and client
  if (!mounted) {
    return (
      <div className="px-5 py-6 max-w-lg mx-auto">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-8 w-8 rounded-xl bg-neutral-100 animate-pulse" />
          <div className="h-4 w-14 rounded bg-neutral-100 animate-pulse" />
        </div>
        <div className="h-6 w-20 rounded bg-neutral-100 animate-pulse mb-2" />
        <div className="h-3 w-32 rounded bg-neutral-100 animate-pulse mb-6" />
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl bg-neutral-50 h-[80px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Norla" className="h-8 w-8 object-contain" />
          <span className="text-[16px] font-bold tracking-[-0.02em] text-neutral-900" style={{ fontFamily: 'var(--font-display)' }}>Norla</span>
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
      <SectionHeader
        title="History"
        subtitle={`${scans.length} insight${scans.length !== 1 ? 's' : ''} generated`}
      />

      {scans.length === 0 ? (
        <EmptyState
          title="No insights yet"
          description="Complete your first scan to start building your wellness history."
          actionLabel="Start Scan"
          onAction={() => { window.location.href = '/scan/new'; }}
        />
      ) : (
        <div className="space-y-2.5">
          {scans.map((scan, i) => (
            <ScanHistoryCard key={scan.id} scan={scan} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
