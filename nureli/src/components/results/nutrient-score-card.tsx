'use client';

import { motion } from '@/lib/motion';
import { NUTRIENT_CONFIG, STATUS_CONFIG } from '@/lib/constants';
import { Droplets, Zap, Sun, Leaf, Dumbbell, Droplet, Utensils } from 'lucide-react';
import type { NutrientKey, NutrientScore } from '@/types/scores';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  droplets: Droplets,
  zap: Zap,
  sun: Sun,
  leaf: Leaf,
  dumbbell: Dumbbell,
  droplet: Droplet,
  utensils: Utensils,
};

interface NutrientScoreCardProps {
  nutrientKey: NutrientKey;
  data: NutrientScore;
  index?: number;
}

export function NutrientScoreCard({ nutrientKey, data, index = 0 }: NutrientScoreCardProps) {
  const config = NUTRIENT_CONFIG[nutrientKey];
  const statusConfig = STATUS_CONFIG[data.status];
  const Icon = ICON_MAP[config.iconName] ?? Droplet;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.06, duration: 0.3 }}
      className="rounded-2xl bg-white p-5 shadow-card hover-lift"
      style={{ border: '1px solid rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${config.color}0D` }}
          >
            <Icon className="h-[18px] w-[18px]" style={{ color: config.color }} />
          </div>
          <div>
            <h4 className="text-[14px] font-semibold text-neutral-900">{config.label}</h4>
            <span
              className="text-[11px] font-bold"
              style={{ color: statusConfig.textColor }}
            >
              {data.status}
            </span>
          </div>
        </div>
        <span
          className="text-[22px] font-bold tabular-nums tracking-tight"
          style={{ color: statusConfig.color, fontFamily: 'var(--font-display)' }}
        >
          {data.score}
        </span>
      </div>

      <div className="mb-3.5 h-[5px] overflow-hidden rounded-full bg-neutral-100">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: statusConfig.color }}
          initial={{ width: 0 }}
          animate={{ width: `${data.score}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 + index * 0.06 }}
        />
      </div>

      <p className="text-[12px] leading-[1.65] text-neutral-500">{data.explanation}</p>
    </motion.div>
  );
}
