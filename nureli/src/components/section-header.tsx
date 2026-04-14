'use client';

import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({ title, subtitle, className }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn('mb-5', className)}
    >
      <h2
        className="text-[19px] font-bold tracking-[-0.025em] text-neutral-900"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1 text-[13px] text-neutral-400 font-medium">{subtitle}</p>
      )}
    </motion.div>
  );
}
