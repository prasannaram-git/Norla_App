import * as React from 'react';
import { cn } from '@/lib/utils';

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('block text-[13px] font-semibold text-neutral-700 tracking-[-0.01em]', className)}
      {...props}
    />
  )
);
Label.displayName = 'Label';

export { Label };
