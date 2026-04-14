'use client';

import { motion } from '@/lib/motion';
import { ShieldCheck } from 'lucide-react';

interface ConfidenceNoteCardProps {
  note: string;
}

export function ConfidenceNoteCard({ note }: ConfidenceNoteCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-2xl bg-neutral-50 p-5"
      style={{ border: '1px solid rgba(0,0,0,0.04)' }}
    >
      <div className="flex gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
          <ShieldCheck className="h-[18px] w-[18px] text-neutral-500" />
        </div>
        <div>
          <h4 className="mb-1.5 text-[13px] font-semibold text-neutral-900">
            About this insight
          </h4>
          <p className="text-[12px] leading-[1.65] text-neutral-500">
            {note}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
