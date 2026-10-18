'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useCategories } from '@/context/CategoriesContext';
import { useSupplierMap, withSupplierNames } from '@/lib/hooks';
import ProductCard from '@/components/ProductCard';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import PageHeading from '@/components/PageHeading';
import BottomNav from '@/components/BottomNav';
import Spinner from '@/components/Spinner';
import { ErrorNote } from '@/components/Spinner';
import { ArrowRight, Heart, LayoutList, MapPin, PackageSearch, Plus, Sparkles } from 'lucide-react';
import CategoryIcon from '@/components/CategoryIcon';

function QuickAction({ href, icon: Icon, label }) {
  return (
    <Link
      href={href}
      className="flex flex-1 flex-col items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-2 py-3 text-center transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-[12px] font-semibold text-white">{label}</span>
    </Link>
  );
}

function HomeContent() {
  const { user, isFarmer } = useAuth();
  const { categories } = useCategories();
  const { suppliers } = useSupplierMap();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .listProducts({ limit: 4 })
      .then((data) => active && setProducts(data))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const enriched = withSupplierNames(products, suppliers);

  return (
    <AppShell width="wide">
      <div className="flex items-center justify-between px-4 pb-4 pt-6 md:px-0 md:pt-8">
        <PageHeading>AgriMart</PageHeading>
      </div>

      <div className="px-4 md:px-0">
        <div className="rounded-xl bg-primary p-5 text-primary-foreground shadow-sm md:p-6">
          <p className="text-[13px] text-white/80">Welcome back,</p>
          <p className="flex items-center gap-2 text-xl font-semibold">
            {user?.name} <Sparkles className="h-4 w-4 text-amber-300" />
          </p>
          <p className="mt-1 text-[13px] leading-snug text-white/85">
            {isFarmer
              ? 'Manage your produce listings and connect with buyers across Zambia.'
              : 'Discover fresh produce from verified farmers near you.'}
          </p>

          <div className="mt-4 flex gap-2">
            {isFarmer ? (
              <>
                <QuickAction href="/products/new" icon={Plus} label="Add Product" />
                <QuickAction href="/nearby" icon={MapPin} label="Nearby" />
                <QuickAction href="/listings" icon={LayoutList} label="Listings" />
              </>
            ) : (
              <>
                <QuickAction href="/products" icon={PackageSearch} label="Browse" />
                <QuickAction href="/nearby" icon={MapPin} label="Nearby" />
                <QuickAction href="/saved" icon={Heart} label="Saved" />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-7 px-4 md:px-0">
        <h2 className="mb-3 text-base font-semibold">Categories</h2>
        <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.id}`}
              className="flex w-24 shrink-0 flex-col items-center gap-2 rounded-xl border bg-card py-4 text-sm transition-colors hover:border-primary/30 hover:bg-primary-light/40"
            >
              <CategoryIcon id={cat.id} className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-7 px-4 md:px-0">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Featured Products</h2>
          <Link href="/products" className="text-[13px] font-semibold text-primary">
            <span className="inline-flex items-center gap-1">View all <ArrowRight className="h-3.5 w-3.5" /></span>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : error ? (
          <ErrorNote message={`Couldn't load products: ${error}`} />
        ) : enriched.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">
            No products listed yet. Be the first!
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {enriched.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </AppShell>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}
