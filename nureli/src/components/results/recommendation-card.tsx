'use client';

import { motion } from '@/lib/motion';
import { Leaf, Sun, Clock } from 'lucide-react';
import type { Recommendation } from '@/types/scores';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  food: Leaf,
  habit: Clock,
  lifestyle: Sun,
};

const CATEGORY_COLORS: Record<string, string> = {
  food: '#10B981',
  habit: '#6366F1',
  lifestyle: '#F59E0B',
};

interface RecommendationCardProps {
  rec: Recommendation;
  index?: number;
}

export function RecommendationCard({ rec, index = 0 }: RecommendationCardProps) {
  const CategoryIcon = CATEGORY_ICONS[rec.category] ?? Leaf;
  const color = CATEGORY_COLORS[rec.category] ?? '#10B981';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.06, duration: 0.3 }}
      className="rounded-2xl bg-white p-5 shadow-card hover-lift"
      style={{ border: '1px solid rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-start gap-3.5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}0D` }}
        >
          <CategoryIcon className="h-[18px] w-[18px]" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[14px] font-semibold text-neutral-900">{rec.title}</h4>
          <p className="mt-1 text-[12px] leading-[1.65] text-neutral-500">{rec.description}</p>
          <span
            className="mt-2.5 inline-block rounded-full px-2.5 py-[3px] text-[10px] font-bold capitalize tracking-wider"
            style={{ backgroundColor: `${color}0D`, color }}
          >
            {rec.category}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
