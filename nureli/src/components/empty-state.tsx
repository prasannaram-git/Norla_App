'use client';

import { motion } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Inbox, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
        <Inbox className="h-7 w-7 text-neutral-300" />
      </div>
      <h3
        className="mb-2 text-[17px] font-bold text-neutral-900 tracking-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h3>
      <p className="mb-8 max-w-[280px] text-[14px] text-neutral-500 leading-[1.65]">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" className="gap-2">
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </motion.div>
  );
}
