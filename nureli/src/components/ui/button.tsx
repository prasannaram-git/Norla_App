import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-out active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 cursor-pointer select-none',
  {
    variants: {
      variant: {
        default:
          'bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl shadow-elevated hover:shadow-premium',
        primary:
          'bg-gradient-to-br from-brand-500 to-brand-700 text-white hover:from-brand-600 hover:to-brand-800 rounded-xl shadow-glow-brand',
        outline:
          'border border-neutral-200/80 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-900 rounded-xl shadow-soft',
        ghost:
          'text-neutral-500 hover:bg-neutral-100/80 hover:text-neutral-900 rounded-xl',
        secondary:
          'bg-neutral-100 text-neutral-700 hover:bg-neutral-150 rounded-xl',
        destructive:
          'bg-error text-white hover:opacity-90 rounded-xl shadow-soft',
        soft:
          'bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-xl',
      },
      size: {
        default: 'h-11 px-5 text-[13px]',
        sm: 'h-9 px-3.5 text-[12px]',
        lg: 'h-[52px] px-7 text-[15px]',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };
