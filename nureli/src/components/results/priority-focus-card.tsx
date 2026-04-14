'use client';

import { motion } from '@/lib/motion';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { FocusArea } from '@/types/scores';

interface PriorityFocusCardProps {
  area: FocusArea;
  index?: number;
}

const priorityStyles = {
  high: {
    icon: AlertTriangle,
    bg: 'rgba(254, 242, 242, 0.7)',
    border: 'rgba(220, 38, 38, 0.1)',
    text: 'text-red-700',
    iconBg: 'rgba(254, 226, 226, 0.8)',
  },
  medium: {
    icon: AlertCircle,
    bg: 'rgba(255, 251, 235, 0.7)',
    border: 'rgba(217, 119, 6, 0.1)',
    text: 'text-amber-700',
    iconBg: 'rgba(254, 243, 199, 0.8)',
  },
  low: {
    icon: Info,
    bg: 'rgba(245, 247, 249, 0.8)',
    border: 'rgba(0, 0, 0, 0.05)',
    text: 'text-neutral-600',
    iconBg: 'rgba(235, 238, 242, 0.8)',
  },
};

export function PriorityFocusCard({ area, index = 0 }: PriorityFocusCardProps) {
  const style = priorityStyles[area.priority];
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.08, duration: 0.3 }}
      className="rounded-2xl p-5 hover-lift"
      style={{ backgroundColor: style.bg, border: `1px solid ${style.border}` }}
    >
      <div className="flex items-start gap-3.5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: style.iconBg }}
        >
          <Icon className={`h-[18px] w-[18px] ${style.text}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-[14px] font-semibold text-neutral-900 mb-1">{area.title}</h4>
          <p className="text-[12px] leading-[1.65] text-neutral-500">{area.description}</p>
        </div>
      </div>
    </motion.div>
  );
}
