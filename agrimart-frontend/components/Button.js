'use client';

import { LoaderCircle } from 'lucide-react';
import { Button as ShadcnButton } from '@/components/ui/button';

export default function Button({
  children,
  variant = 'primary',
  className = '',
  disabled,
  loading,
  ...rest
}) {
  const variants = {
    primary: 'default',
    outline: 'outline',
    danger: 'destructive',
    ghost: 'ghost',
  };

  return (
    <ShadcnButton
      variant={variants[variant] || 'default'}
      size="lg"
      className={`w-full ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <><LoaderCircle className="animate-spin" /> Please wait…</> : children}
    </ShadcnButton>
  );
}
