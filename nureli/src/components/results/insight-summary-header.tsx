'use client';

import { motion } from '@/lib/motion';
import { Activity } from 'lucide-react';

interface InsightSummaryHeaderProps {
  score: number;
  date: string;
}

export function InsightSummaryHeader({ score, date }: InsightSummaryHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-neutral-900 p-7 relative overflow-hidden"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-[0.12em]">
            Your Norla Insight
          </span>
        </div>
        <h1
          className="text-[22px] font-bold text-white mt-1 tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Nutrition Balance Score
        </h1>
        <p className="text-[12px] text-neutral-400 mt-1.5 font-medium">
          Based on visual analysis and lifestyle data &middot; {date}
        </p>
      </div>
    </motion.div>
  );
}
