'use client';

import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { QuestionConfig } from '@/lib/questionnaire-config';

interface QuestionCardProps {
  config: QuestionConfig;
  value: unknown;
  onChange: (field: string, value: unknown) => void;
  index: number;
}

export function QuestionCard({ config, value, onChange, index }: QuestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="mb-7"
    >
      <h4 className="mb-1.5 text-[14px] font-semibold text-neutral-900 tracking-tight">{config.question}</h4>
      {config.description && (
        <p className="mb-3.5 text-[12px] text-neutral-400 leading-relaxed">{config.description}</p>
      )}

      {config.type === 'slider' && (
        <SliderInput
          value={value as number}
          min={config.min ?? 1}
          max={config.max ?? 5}
          labels={config.labels}
          onChange={(v) => onChange(config.field, v)}
        />
      )}

      {config.type === 'pills' && config.options && (
        <PillInput
          options={config.options}
          value={value as string}
          onChange={(v) => onChange(config.field, v)}
        />
      )}

      {config.type === 'toggle' && (
        <ToggleInput
          value={value as boolean}
          onChange={(v) => onChange(config.field, v)}
        />
      )}
    </motion.div>
  );
}

function SliderInput({
  value, min, max, labels, onChange,
}: {
  value: number; min: number; max: number; labels?: [string, string]; onChange: (v: number) => void;
}) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  return (
    <div>
      <div className="flex gap-[7px]">
        {steps.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onChange(step)}
            className={cn(
              'flex-1 rounded-xl py-[11px] text-[14px] font-semibold transition-all duration-200 active:scale-95',
              step === value
                ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow-brand'
                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-150'
            )}
          >
            {step}
          </button>
        ))}
      </div>
      {labels && (
        <div className="mt-2.5 flex justify-between px-1">
          <span className="text-[11px] text-neutral-400 font-medium">{labels[0]}</span>
          <span className="text-[11px] text-neutral-400 font-medium">{labels[1]}</span>
        </div>
      )}
    </div>
  );
}

function PillInput({
  options, value, onChange,
}: {
  options: { value: string; label: string }[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-[8px]">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-full px-4.5 py-[10px] text-[13px] font-semibold transition-all duration-200 active:scale-95',
            opt.value === value
              ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow-brand'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-150'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ToggleInput({
  value, onChange,
}: {
  value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-[8px]">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          'flex-1 rounded-xl py-[11px] text-[14px] font-semibold transition-all duration-200 active:scale-95',
          !value
            ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow-brand'
            : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-150'
        )}
      >
        No
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          'flex-1 rounded-xl py-[11px] text-[14px] font-semibold transition-all duration-200 active:scale-95',
          value
            ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow-brand'
            : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-150'
        )}
      >
        Yes
      </button>
    </div>
  );
}
