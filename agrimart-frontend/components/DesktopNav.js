'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, Home, LayoutList, LogOut, MapPin, PackageSearch, Settings, Store } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Avatar from './Avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DesktopNav() {
  const { user, isFarmer, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  if (!user) return null;

  const tabs = isFarmer
    ? [
        { href: '/home', label: 'Home', icon: Home },
        { href: '/my-farm', label: 'My Farm', icon: Store },
        { href: '/listings', label: 'Listings', icon: LayoutList },
        { href: '/nearby', label: 'Nearby Farms', icon: MapPin },
        { href: '/compare', label: 'Compare', icon: BarChart3 },
      ]
    : [
        { href: '/home', label: 'Home', icon: Home },
        { href: '/products', label: 'Products', icon: PackageSearch },
        { href: '/saved', label: 'Saved', icon: LayoutList },
        { href: '/nearby', label: 'Nearby Farms', icon: MapPin },
        { href: '/compare', label: 'Compare', icon: BarChart3 },
      ];

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <header className="sticky top-0 z-30 hidden border-b bg-background/95 backdrop-blur-xl md:block">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-8 lg:px-10">
        <Link href="/home" className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.png" alt="" className="h-9 w-9 object-contain" />
          <span className="text-lg font-semibold tracking-tight">AgriMart</span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center gap-1" aria-label="Primary navigation">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/home' && pathname.startsWith(`${href}/`));
            return (
              <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={cn('inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', active && 'bg-primary-light text-primary')}>
                <Icon className="h-4 w-4" />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <Link href="/settings" className="flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-muted" aria-label="Open settings">
          <Avatar src={user.profilePicture} name={user.name} size={34} />
          <span className="hidden max-w-28 truncate text-sm font-medium xl:block">{user.name}</span>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out" title="Log out">
          <LogOut />
        </Button>
      </div>
    </header>
  );
}
