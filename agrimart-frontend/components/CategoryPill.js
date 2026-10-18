'use client';

import { Button } from '@/components/ui/button';

export default function CategoryPill({ icon, label, active, onClick }) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className="shrink-0 rounded-full"
    >
      {icon && <span>{icon}</span>}
      {label}
    </Button>
  );
}
