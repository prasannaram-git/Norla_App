'use client';

import { useEffect, useState } from 'react';
import { Loader2, ScanLine, Brain, BarChart3, Sparkles } from 'lucide-react';

export function LoadingAnalysisState() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 2500);
    const t2 = setTimeout(() => setStep(2), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const steps = [
    { text: 'Processing images', icon: ScanLine },
    { text: 'Evaluating responses', icon: Brain },
    { text: 'Generating insight', icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-8 text-center">
      <div className="relative mb-16">
        <div className="relative flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow-brand" style={{ width: 72, height: 72 }}>
          <Loader2 className="h-7 w-7 text-white animate-spin" />
        </div>
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-2xl animate-glow-pulse" style={{ width: 72, height: 72 }} />
      </div>

      <h2
        className="mb-2 text-[22px] font-bold tracking-tight text-neutral-900"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Analyzing your pattern
      </h2>
      <p className="max-w-[280px] text-[14px] leading-[1.65] text-neutral-500 font-medium">
        Our AI is processing your images and responses to generate personalized insight.
      </p>

      <div className="mt-16 space-y-4">
        {steps.map((item, i) => {
          const Icon = item.icon;
          const isActive = i <= step;
          return (
            <div
              key={item.text}
              className="flex items-center justify-center gap-3 text-[13px]"
              style={{
                opacity: isActive ? 1 : 0.25,
                transition: 'opacity 0.5s ease',
              }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: isActive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.03)',
                }}
              >
                <Icon className="h-4 w-4" style={{ color: isActive ? '#10B981' : '#8D96A0' }} />
              </div>
              <span className="text-neutral-600 font-semibold">{item.text}</span>
              {i < step && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className ?? ''}`}>
      <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        <span className="text-[12px] text-neutral-400 font-medium">Loading...</span>
      </div>
    </div>
  );
}
