'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useCategories } from '@/context/CategoriesContext';
import { useSupplierMap } from '@/lib/hooks';
import { formatPrice } from '@/lib/format';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import TopBar from '@/components/TopBar';
import Spinner, { EmptyState, ErrorNote } from '@/components/Spinner';
import CategoryIcon from '@/components/CategoryIcon';
import Badge from '@/components/Badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowRight,
  Check,
  MapPin,
  RefreshCw,
  Scale,
  Search,
  TrendingDown,
} from 'lucide-react';

function productKey(product) {
  return product.name?.trim().toLowerCase() || '';
}

function CompareContent() {
  const searchParams = useSearchParams();
  const { categoryById } = useCategories();
  const requestedProductId = searchParams.get('productId');
  const { suppliers } = useSupplierMap();
  const [products, setProducts] = useState([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setProducts(await api.listProducts({ limit: 100 }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Match the mobile comparison screen: listings are grouped by normalized
  // product name and only groups with at least two offers are displayed.
  const productGroups = useMemo(() => {
    const groups = new Map();
    products
      .filter((product) => product.availability !== 'hidden')
      .forEach((product) => {
        const key = productKey(product);
        if (!key) return;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(product);
      });

    return Array.from(groups.entries())
      .filter(([, items]) => items.length >= 2)
      .map(([key, items]) => [key, items.slice().sort((a, b) => Number(a.price) - Number(b.price))])
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);

  useEffect(() => {
    if (loading || selectedKey || productGroups.length === 0) return;
    const requestedProduct = products.find((product) => product.id === requestedProductId);
    const requestedKey = requestedProduct ? productKey(requestedProduct) : '';
    const requestedGroupExists = productGroups.some(([key]) => key === requestedKey);
    setSelectedKey(requestedGroupExists ? requestedKey : productGroups[0][0]);
  }, [loading, productGroups, products, requestedProductId, selectedKey]);

  const visibleGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return productGroups;

    return productGroups.filter(([, items]) => {
      const categoryNames = items.map((item) => categoryById(item.categoryId)?.name || '').join(' ');
      const supplierNames = items.map((item) => suppliers[item.supplierId]?.name || '').join(' ');
      const locations = items.map((item) => `${item.location || ''} ${item.province || ''}`).join(' ');
      return `${items[0].name} ${categoryNames} ${supplierNames} ${locations}`
        .toLowerCase()
        .includes(query);
    });
  }, [categoryById, productGroups, search, suppliers]);

  const selectedGroup = productGroups.find(([key]) => key === selectedKey);
  const rankedListings = selectedGroup?.[1] || [];
  const units = new Set(rankedListings.map((item) => item.unit?.trim().toLowerCase()));
  const sameUnit = units.size === 1;
  const bestPrice = rankedListings.length ? Number(rankedListings[0].price) : 0;
  const highestPrice = rankedListings.length
    ? Number(rankedListings[rankedListings.length - 1].price)
    : 0;
  const savings = Math.max(0, highestPrice - bestPrice);
  const supplierCount = new Set(rankedListings.map((item) => item.supplierId)).size;

  return (
    <AppShell nav={false} width="wide">
      <TopBar title="Price Comparison" />
      <div className="px-4 pb-8 md:px-0">
        <div className="mb-6 max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">Compare marketplace prices</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            See every supplier listing for the same product name, ranked from the lowest advertised
            price. Always check the unit before comparing offers.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : error ? (
          <div>
            <ErrorNote message={`Couldn't load price comparisons: ${error}`} />
            <Button variant="outline" onClick={loadProducts}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </div>
        ) : productGroups.length === 0 ? (
          <EmptyState
            icon={<Scale className="h-5 w-5" />}
            title="Nothing to compare yet"
            message="Two or more listings with the same product name are needed before a comparison appears."
            action={<Button asChild variant="outline"><Link href="/products">Browse products</Link></Button>}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.6fr)]">
            <aside className="lg:sticky lg:top-5 lg:self-start">
              <label htmlFor="comparison-search" className="mb-2 block text-sm font-semibold">
                Products with multiple offers
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="comparison-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search product or location"
                  className="bg-card pl-9"
                />
              </div>

              <div className="mt-3 max-h-[58vh] space-y-2 overflow-y-auto pr-1">
                {visibleGroups.length === 0 ? (
                  <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                    No comparisons match your search.
                  </p>
                ) : visibleGroups.map(([key, items]) => {
                  const product = items[0];
                  const category = categoryById(product.categoryId);
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setSelectedKey(key)}
                      className={`w-full rounded-xl border p-3 text-left transition-colors ${
                        key === selectedKey
                          ? 'border-primary bg-primary-light shadow-sm'
                          : 'bg-card hover:border-primary/40 hover:bg-muted/30'
                      }`}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-primary">
                            <CategoryIcon id={product.categoryId} className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{product.name}</span>
                            <span className="block text-xs text-muted-foreground">
                              {category?.name || product.categoryId}
                            </span>
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
                          {items.length} offers
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section aria-live="polite">
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Live marketplace comparison</p>
                    <h2 className="mt-1 text-xl font-semibold">{rankedListings[0]?.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {rankedListings.length} offers from {supplierCount} {supplierCount === 1 ? 'seller' : 'sellers'}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={loadProducts} aria-label="Refresh comparison">
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                  </Button>
                </div>

                {sameUnit ? (
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-primary-light p-3">
                      <p className="text-xs text-muted-foreground">Best price</p>
                      <p className="mt-1 text-xl font-bold text-primary">{formatPrice(bestPrice)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Highest price</p>
                      <p className="mt-1 text-xl font-bold">{formatPrice(highestPrice)}</p>
                    </div>
                    <div className="col-span-2 rounded-lg bg-accent-bg p-3 sm:col-span-1">
                      <p className="text-xs text-muted-foreground">Potential saving</p>
                      <p className="mt-1 flex items-center gap-1 text-xl font-bold text-accent">
                        <TrendingDown className="h-5 w-5" /> {formatPrice(savings)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-lg border border-accent/30 bg-accent-bg p-3 text-sm text-foreground">
                    These listings use different pricing units. Compare the unit shown beside each
                    price; a lower number is not necessarily a cheaper equivalent quantity.
                  </div>
                )}
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border bg-card shadow-sm">
                {rankedListings.map((item, index) => {
                  const supplier = suppliers[item.supplierId];
                  const isBest = sameUnit && index === 0;
                  return (
                    <Link
                      key={item.id}
                      href={`/products/${item.id}`}
                      className={`group flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-muted/40 ${
                        index > 0 ? 'border-t' : ''
                      } ${isBest ? 'border-l-4 border-l-primary bg-primary-light/40' : ''}`}
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-semibold">{supplier?.name || 'Supplier'}</span>
                          {isBest && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                              <Check className="h-3 w-3" /> Best price
                            </span>
                          )}
                          {item.availability !== 'available' && <Badge status={item.availability} />}
                        </span>
                        <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {item.location || supplier?.location || 'Location unavailable'}
                          {item.province ? `, ${item.province}` : ''}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        <span className="text-right">
                          <span className={`block text-lg font-bold ${isBest ? 'text-primary' : ''}`}>
                            {formatPrice(item.price)}
                          </span>
                          <span className="block text-[11px] text-muted-foreground">per {item.unit}</span>
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  );
                })}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Prices are supplied by individual sellers. Confirm availability, quantity, quality,
                and delivery terms before purchasing.
              </p>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function ComparePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex justify-center py-16"><Spinner /></div>}>
        <CompareContent />
      </Suspense>
    </ProtectedRoute>
  );
}
