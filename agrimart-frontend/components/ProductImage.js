'use client';

import { useEffect, useState } from 'react';
import { resolveImageUrl } from '@/lib/api';
import CategoryIcon from './CategoryIcon';

// Renders a product/profile image cleanly and full-bleed: resolves relative
// backend paths to full URLs, and falls back to a plain category-icon tile
// only when the URL is missing or genuinely fails to load — no translucent
// overlay ever sits on top of a loaded image, so pictures stay crisp.
export default function ProductImage({ src, categoryId, className = '', alt = '' }) {
  const resolved = resolveImageUrl(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (!resolved || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-primary-light text-primary ${className}`}
        aria-hidden
      >
        <CategoryIcon id={categoryId} className="h-9 w-9" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
