'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import PageHeading from '@/components/PageHeading';
import BottomNav from '@/components/BottomNav';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';
import Spinner from '@/components/Spinner';
import { ErrorNote } from '@/components/Spinner';
import { formatPrice } from '@/lib/format';
import { ChevronRight, LayoutList, Plus } from 'lucide-react';

function MyFarmContent() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .listProducts({ supplier: user.id, limit: 100 })
      .then((data) => active && setProducts(data))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user.id]);

  const stats = useMemo(() => {
    const total = products.length;
    const soldOut = products.filter((p) => p.availability === 'sold_out').length;
    const active = total - soldOut;
    return { total, active, soldOut };
  }, [products]);

  return (
    <AppShell width="default">
      <div className="px-4 pb-4 pt-6 md:px-0 md:pt-8">
        <PageHeading>My Farm</PageHeading>
      </div>

      <div className="flex gap-3 px-4 md:px-0">
        <StatCard value={stats.total} label="Total" />
        <StatCard value={stats.active} label="Active" tone="primary" />
        <StatCard value={stats.soldOut} label="Sold Out" tone="danger" />
      </div>

      <div className="mt-4 space-y-3 px-4 md:px-0">
        <Link
          href="/products/new"
          className="flex items-center gap-3 rounded-xl bg-primary px-4 py-4 text-primary-foreground shadow-sm"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg">
            <Plus className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-[15px] font-bold">Add New Product</span>
            <span className="block text-[12px] text-white/85">List your produce for buyers</span>
          </span>
        </Link>

        <Link
          href="/listings"
          className="flex items-center justify-between rounded-xl border bg-card px-4 py-4 shadow-sm transition-colors hover:bg-muted/40"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-light text-primary"><LayoutList className="h-4 w-4" /></span>
            <span>
              <span className="block text-[15px] font-semibold text-ink">Manage Listings</span>
              <span className="block text-[12px] text-muted-foreground">Edit, delete, or update stock</span>
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>

      <div className="mt-6 px-4 md:px-0">
        <h2 className="mb-3 text-base font-semibold">Recent Listings</h2>
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : error ? (
          <ErrorNote message={`Couldn't load your listings: ${error}`} />
        ) : products.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">
            You haven&rsquo;t listed any produce yet.
          </p>
        ) : (
          <div className="space-y-3">
            {products.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="flex items-center justify-between rounded-xl border bg-card px-4 py-4 shadow-sm transition-colors hover:bg-muted/40"
              >
                <span>
                  <span className="block text-[15px] font-bold text-ink">{p.name}</span>
                  <span className="block text-[13px] text-muted-foreground">
                    {formatPrice(p.price)} / {p.unit} - Qty: {p.quantity}
                  </span>
                </span>
                <Badge status={p.availability} />
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </AppShell>
  );
}

export default function MyFarmPage() {
  return (
    <ProtectedRoute>
      <MyFarmContent />
    </ProtectedRoute>
  );
}
