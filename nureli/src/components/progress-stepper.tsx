'use client';

import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface ProgressStepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function ProgressStepper({ steps, currentStep, className }: ProgressStepperProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar */}
      <div className="relative h-[4px] rounded-full bg-neutral-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Step info */}
      <div className="mt-3.5 flex items-center justify-between">
        <span className="text-[12px] text-neutral-400 tabular-nums font-semibold">
          {currentStep + 1} of {steps.length}
        </span>
        <span
          className="text-[13px] font-bold text-neutral-900 tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {steps[currentStep]}
        </span>
      </div>
    </div>
  );
}
