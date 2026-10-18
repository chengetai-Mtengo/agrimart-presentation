'use client';

import { useEffect, useState } from 'react';
import { resolveImageUrl } from '@/lib/api';
import { initialsOf } from '@/lib/format';
import { Avatar as UiAvatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Always prefers a real, resolved photo — rendered full-bleed and cropped
// (object-cover) so it looks sharp, never stretched or washed out. Only
// falls back to initials-on-a-solid-color when no picture exists at all.
export default function Avatar({ src, name, size = 40, className = '' }) {
  const resolved = resolveImageUrl(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  const dim = { width: size, height: size, minWidth: size, minHeight: size };

  return (
    <UiAvatar style={dim} className={`ring-1 ring-border ${className}`}>
      {resolved && !failed && (
        <AvatarImage
          src={resolved}
          alt={name ? `${name}'s profile picture` : 'Profile picture'}
          onLoadingStatusChange={(status) => status === 'error' && setFailed(true)}
        />
      )}
      <AvatarFallback
        style={{ fontSize: Math.max(11, Math.round(size * 0.34)) }}
        aria-label={name ? `${name}'s initials` : 'Profile'}
        className="font-semibold"
      >
        {initialsOf(name)}
      </AvatarFallback>
    </UiAvatar>
  );
}
