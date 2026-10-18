'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import PageHeading from '@/components/PageHeading';
import BottomNav from '@/components/BottomNav';
import Avatar from '@/components/Avatar';
import { Bell, Bookmark, ChartNoAxesCombined, ChevronRight, KeyRound, LogOut, MapPin, ShoppingBasket, Store, TrendingUp, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ACCOUNT_LINKS = [
  { href: '/settings/profile', icon: UserRound, label: 'Edit Profile' },
  { href: '/settings/password', icon: KeyRound, label: 'Change Password' },
  { href: '/settings/location', icon: MapPin, label: 'Manage Location' },
  { href: '/settings/notifications', icon: Bell, label: 'Notifications' },
];

const QUICK_LINKS = [
  { href: '/saved', icon: Bookmark, label: 'Saved Products' },
  { href: '/compare', icon: ChartNoAxesCombined, label: 'Price Comparison' },
  { href: '/predictions', icon: TrendingUp, label: 'Price Predictions' },
];

function Row({ href, icon, label }) {
  const Icon = icon;
  return (
    <Link href={href} className="flex items-center justify-between rounded-md px-4 py-3.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-light text-primary"><Icon className="h-4 w-4" /></span>
        <span className="text-sm font-medium">{label}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function SettingsContent() {
  const { user, isFarmer, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <AppShell width="default">
      <div className="px-4 pb-4 pt-6 md:px-0 md:pt-8">
        <PageHeading>Settings</PageHeading>
      </div>

      <div className="px-4 md:px-0">
        <div className="flex flex-col items-center rounded-xl border bg-card px-5 py-7 text-center shadow-sm">
          <Avatar src={user?.profilePicture} name={user?.name} size={72} className="text-[22px]" />
          <p className="mt-3 font-semibold">{user?.name}</p>
          {user?.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
          {user?.location && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {user.location}
              {user.province ? `, ${user.province}` : ''}
            </p>
          )}
          <Badge variant="secondary" className="mt-3 gap-1.5">
            {isFarmer ? <Store className="h-3 w-3" /> : <ShoppingBasket className="h-3 w-3" />}
            {isFarmer ? 'Farmer / Supplier' : 'Buyer / Consumer'}
          </Badge>
        </div>
      </div>

      <div className="mt-6 px-4 md:px-0">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</p>
        <div className="divide-y rounded-xl border bg-card p-1 shadow-sm">
          {ACCOUNT_LINKS.map((link) => (
            <Row key={link.href} {...link} />
          ))}
        </div>
      </div>

      <div className="mt-6 px-4 md:px-0">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Links</p>
        <div className="divide-y rounded-xl border bg-card p-1 shadow-sm">
          {QUICK_LINKS.map((link) => (
            <Row key={link.href} {...link} />
          ))}
        </div>
      </div>

      <div className="mt-6 px-4 md:px-0">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full text-destructive hover:bg-destructive/5 hover:text-destructive"
        >
          <LogOut /> Log Out
        </Button>
        <p className="mt-4 text-center text-xs text-muted-foreground">AgriMart v1.0.0</p>
      </div>

      <BottomNav />
    </AppShell>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
