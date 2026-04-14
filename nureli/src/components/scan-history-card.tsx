'use client';

import { motion } from '@/lib/motion';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { getStatusFromScore, getScoreRingColor } from '@/lib/score-utils';
import type { Scan } from '@/types/scan';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ScanHistoryCardProps {
  scan: Scan;
  index?: number;
}

export function ScanHistoryCard({ scan, index = 0 }: ScanHistoryCardProps) {
  const score = scan.overallBalanceScore ?? 0;
  const status = getStatusFromScore(score);
  const color = getScoreRingColor(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/scan/${scan.id}/results`}>
        <div
          className="flex items-center gap-4 p-4 rounded-2xl bg-white cursor-pointer active:scale-[0.98] transition-all duration-200 hover-lift shadow-card"
          style={{ border: '1px solid rgba(0,0,0,0.04)' }}
        >
          {/* Mini score ring */}
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="19" fill="none" stroke="#EBEEF2" strokeWidth="2.5" />
              <circle
                cx="24" cy="24" r="19"
                fill="none" stroke={color} strokeWidth="2.5"
                strokeDasharray={`${(score / 100) * 119.4} 119.4`}
                strokeLinecap="round"
              />
            </svg>
            <span
              className="absolute text-[13px] font-bold text-neutral-900 tabular-nums"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {score}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-[14px] font-semibold text-neutral-900 mb-1">
              Nutrition Insight
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-neutral-400 font-medium">{formatDate(scan.createdAt)}</span>
              <span
                className="rounded-full px-2 py-[2px] text-[10px] font-bold tracking-wide"
                style={{ backgroundColor: `${color}0D`, color }}
              >
                {status}
              </span>
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
        </div>
      </Link>
    </motion.div>
  );
}
