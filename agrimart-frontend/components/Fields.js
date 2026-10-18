'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export function Field({ label, required, children, hint }) {
  return (
    <div className="mb-5 space-y-2">
      {label && (
        <Label className="block text-sm text-foreground">
          {label} {required && <span className="text-destructive" aria-hidden>*</span>}
        </Label>
      )}
      {children}
      {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextInput({ className = '', ...rest }) {
  return (
    <Input className={cn('h-11 bg-card', className)} {...rest} />
  );
}

export function TextArea({ className = '', ...rest }) {
  return (
    <Textarea className={cn('min-h-[112px] bg-card', className)} {...rest} />
  );
}

export function Select({ className = '', children, ...rest }) {
  return (
    <select
      className={cn('flex h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', className)}
      {...rest}
    >
      {children}
    </select>
  );
}
