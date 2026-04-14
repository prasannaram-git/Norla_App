import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-12 w-full rounded-xl bg-neutral-50 px-4 text-[14px] text-neutral-900 placeholder:text-neutral-400 transition-all duration-200 focus:bg-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/12 focus:shadow-glow-brand disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      style={{ border: '1px solid rgba(0,0,0,0.08)' }}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
