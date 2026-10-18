'use client';

import { AlertCircle, Leaf, LoaderCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Spinner({ size = 24 }) {
  return (
    <LoaderCircle
      className="animate-spin text-primary"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-primary">
        {typeof icon === 'object' ? icon : <Leaf className="h-5 w-5" />}
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {message && <p className="max-w-sm text-sm text-muted-foreground">{message}</p>}
      {action}
    </div>
  );
}

export function ErrorNote({ message }) {
  if (!message) return null;
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
