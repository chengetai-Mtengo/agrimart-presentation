'use client';

import { availabilityLabel, availabilityStyle } from '@/lib/categories';
import { Badge as UiBadge } from '@/components/ui/badge';

export default function Badge({ status }) {
  const style = availabilityStyle(status);
  return (
    <UiBadge
      variant="outline"
      className="gap-1.5 border-transparent px-2.5 py-1 text-[11px]"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: style.dot }} />
      {availabilityLabel(status)}
    </UiBadge>
  );
}
