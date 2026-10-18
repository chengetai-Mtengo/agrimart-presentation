'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useCategories } from '@/context/CategoriesContext';
import { useSupplierMap, withSupplierNames } from '@/lib/hooks';
import ProductCard from '@/components/ProductCard';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import PageHeading from '@/components/PageHeading';
import BottomNav from '@/components/BottomNav';
import Spinner from '@/components/Spinner';
import { EmptyState, ErrorNote } from '@/components/Spinner';
import { PackageSearch, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import CategoryPill from '@/components/CategoryPill';
import CategoryIcon from '@/components/CategoryIcon';

function ProductsContent() {
  const searchParams = useSearchParams();
  const { categories } = useCategories();
  const initialCategory = searchParams.get('category') || 'all';
  const { suppliers } = useSupplierMap();
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const timer = setTimeout(() => {
      api
        .listProducts({
          category: category === 'all' ? undefined : category,
          search: search || undefined,
          limit: 50,
        })
        .then(setProducts)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [category, search]);

  const enriched = useMemo(() => withSupplierNames(products, suppliers), [products, suppliers]);

  return (
    <AppShell width="wide">
      <div className="px-4 pb-4 pt-6 md:px-0 md:pt-8">
        <PageHeading>Products</PageHeading>
      </div>

      <div className="px-4 md:px-0">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products, suppliers, locations..."
            className="h-11 bg-card pl-9"
          />
        </div>
      </div>

      <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto px-4 pb-1 md:px-0">
        <CategoryPill label="All" active={category === 'all'} onClick={() => setCategory('all')} />
        {categories.map((cat) => (
          <CategoryPill
            key={cat.id}
            icon={<CategoryIcon id={cat.id} className="h-3.5 w-3.5" />}
            label={cat.name}
            active={category === cat.id}
            onClick={() => setCategory(cat.id)}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between px-4 md:px-0">
        <p className="text-sm text-muted-foreground">{products.length} products</p>
        <p className="text-xs font-medium text-muted-foreground">Newest first</p>
      </div>

      <div className="mt-3 px-4 md:px-0">
        {loading ? (
          <div className="flex justify-center py-14">
            <Spinner />
          </div>
        ) : error ? (
          <ErrorNote message={`Couldn't load products: ${error}`} />
        ) : enriched.length === 0 ? (
          <EmptyState icon={<PackageSearch className="h-5 w-5" />} title="No products found" message="Try a different search or category." />
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

export default function ProductsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <ProductsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
