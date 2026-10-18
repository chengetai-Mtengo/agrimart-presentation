'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TopBar({ title, back = true, right = null }) {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-xl md:static md:mb-6 md:border-0 md:bg-transparent md:px-0 md:pt-8 md:backdrop-blur-none">
      {back && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Go back"
          className="-ml-2"
        >
          <ArrowLeft />
        </Button>
      )}
      <h1 className="flex-1 truncate text-xl font-semibold tracking-tight">{title}</h1>
      {right}
    </div>
  );
}
