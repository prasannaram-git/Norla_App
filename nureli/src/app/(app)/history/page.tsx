'use client';

import { useEffect, useState } from 'react';
import { motion } from '@/lib/motion';
import { SectionHeader } from '@/components/section-header';
import { ScanHistoryCard } from '@/components/scan-history-card';
import { EmptyState } from '@/components/empty-state';
import { LoadingSpinner } from '@/components/loading-states';
import { useAuth } from '@/contexts/auth-context';
import { getUserScans } from '@/lib/db';
import type { Scan } from '@/types/scan';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const userId = user?.id || 'anonymous';
        const data = await getUserScans(userId);
        setScans(data);
      } catch (e) {
        console.error('Failed to load scan history', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  return (
    <div className="px-5 py-6 max-w-lg mx-auto">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <img src="/logo.png" alt="Norla" className="h-8 w-8 object-contain" />
        <span className="text-[16px] font-bold tracking-[-0.02em] text-neutral-900" style={{ fontFamily: 'var(--font-display)' }}>Norla</span>
      </div>
      <SectionHeader
        title="History"
        subtitle={`${scans.length} insight${scans.length !== 1 ? 's' : ''} generated`}
      />

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : scans.length === 0 ? (
        <EmptyState
          title="No insights yet"
          description="Complete your first scan to start building your wellness history."
          actionLabel="Start Scan"
          onAction={() => router.push('/scan/new')}
        />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5">
          {scans.map((scan, i) => (
            <ScanHistoryCard key={scan.id} scan={scan} index={i} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
