'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, PackageSearch, Settings, Store } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Avatar from './Avatar';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const pathname = usePathname();
  const { isFarmer, user } = useAuth();
  if (!user) return null;

  const tabs = isFarmer
    ? [
        { href: '/home', label: 'Home', icon: Home },
        { href: '/my-farm', label: 'My Farm', icon: Store },
        { href: '/nearby', label: 'Nearby', icon: MapPin },
        { href: '/settings', label: 'Settings', icon: Settings },
      ]
    : [
        { href: '/home', label: 'Home', icon: Home },
        { href: '/products', label: 'Products', icon: PackageSearch },
        { href: '/nearby', label: 'Nearby', icon: MapPin },
        { href: '/settings', label: 'Settings', icon: Settings },
      ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.4rem)] pt-1.5 backdrop-blur-xl md:hidden" aria-label="Primary navigation">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/home' && pathname.startsWith(`${href}/`));
          return (
            <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={cn('flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-medium text-muted-foreground transition-colors', active && 'text-primary')}>
              {href === '/settings' ? (
                <Avatar src={user.profilePicture} name={user.name} size={22} className={active ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''} />
              ) : (
                <Icon className="h-5 w-5" strokeWidth={active ? 2.3 : 1.8} />
              )}
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
