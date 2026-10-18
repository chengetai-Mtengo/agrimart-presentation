'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useCategories } from '@/context/CategoriesContext';
import { useSupplierMap } from '@/lib/hooks';
import { formatPrice, formatDateLong, phoneToTel, phoneToWhatsApp } from '@/lib/format';
import AppShell from '@/components/AppShell';
import TopBar from '@/components/TopBar';
import Badge from '@/components/Badge';
import ProductImage from '@/components/ProductImage';
import Avatar from '@/components/Avatar';
import Spinner from '@/components/Spinner';
import { ErrorNote } from '@/components/Spinner';
import { Check, ChevronRight, Heart, MapPin, MessageCircle, Pencil, Phone, Scale, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CategoryIcon from '@/components/CategoryIcon';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { categoryById } = useCategories();
  const { suppliers } = useSupplierMap();
  const [product, setProduct] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api
      .getProduct(id)
      .then(async (p) => {
        setProduct(p);
        api.getUser(p.supplierId).then(setSupplier).catch(() => {});
        api.compareProduct(id).then(setComparison).catch(() => {});
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    api
      .listSaved()
      .then((items) => setSaved(items.some((i) => i.id === id)))
      .catch(() => {});
  }, [user, id]);

  // Keep the client-side match strict as a defensive check for older backend
  // deployments: only the same product name and unit are meaningful prices
  // to compare.
  const tightComparable = useMemo(() => {
    if (!product || !comparison?.comparable) return [];
    const name = product.name.trim().toLowerCase();
    const unit = product.unit.trim().toLowerCase();
    return comparison.comparable.filter(
      (item) => item.name?.trim().toLowerCase() === name && item.unit?.trim().toLowerCase() === unit
    );
  }, [product, comparison]);

  async function toggleSave() {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      const result = await api.toggleSaved(id);
      setSaved(result.saved);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <AppShell nav={false} width="default">
        <TopBar title="Product Details" />
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      </AppShell>
    );
  }

  if (!product) {
    return (
      <AppShell nav={false} width="default">
        <TopBar title="Product Details" />
        <div className="px-5 py-8">
          <ErrorNote message={error || 'Product not found.'} />
        </div>
      </AppShell>
    );
  }

  const category = categoryById(product.categoryId);
  const isOwner = user && user.id === product.supplierId;

  return (
    <AppShell nav={false} width="default">
      <TopBar title="Product Details" />

      <ProductImage
        src={product.imageUrl}
        categoryId={product.categoryId}
        alt={product.name}
        className="h-72 w-full object-cover md:rounded-xl md:border"
      />

      <div className="px-4 py-5 md:px-0">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{product.name}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              {category && <><CategoryIcon id={category.id} className="h-4 w-4" /> {category.name}</>}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSave}
            aria-label="Save product"
            className="rounded-full"
          >
            <Heart className={saved ? 'fill-destructive text-destructive' : ''} />
          </Button>
        </div>

        <p className="mt-3 text-3xl font-semibold tracking-tight text-primary">
          {formatPrice(product.price)}{' '}
          <span className="text-[14px] font-medium text-muted-foreground">per {product.unit}</span>
        </p>

        <div className="mt-2 flex items-center gap-3">
          <Badge status={product.availability} />
          <span className="text-[13px] text-muted-foreground">
            Qty: {product.quantity} {product.unit}
            {Number(product.quantity) === 1 ? '' : 's'}
          </span>
        </div>

        {product.description && (
          <div className="mt-5 rounded-xl border bg-card p-4 shadow-sm">
            <p className="mb-1 text-sm font-semibold">Description</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          </div>
        )}

        {product.location && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <p className="text-[14px] font-semibold text-ink">{product.location}</p>
              {product.province && <p className="text-[12px] text-muted-foreground">{product.province} Province</p>}
            </div>
          </div>
        )}

        <Link
          href={`/predictions?commodity=${encodeURIComponent(product.name)}&province=${encodeURIComponent(product.province || '')}&unit=${encodeURIComponent(product.unit || '')}&auto=1`}
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-accent/40 bg-accent-bg px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent/20"
        >
          <TrendingUp className="h-4 w-4 text-accent" /> Forecast this product
        </Link>

        <Link
          href={`/compare?productId=${encodeURIComponent(product.id)}`}
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border bg-card px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/40"
        >
          <Scale className="h-4 w-4 text-primary" /> Compare supplier prices
        </Link>

        {supplier && (
          <Link
            href={`/suppliers/${supplier.id}`}
            className="mt-3 flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40"
          >
            <span className="flex items-center gap-3">
              <Avatar src={supplier.profilePicture} name={supplier.name} size={40} className="text-[13px]" />
              <span>
                <span className="block text-[14px] font-semibold text-ink">{supplier.name}</span>
                <span className="block text-[12px] text-muted-foreground">
                  {supplier.location} - Joined {formatDateLong(supplier.joinedDate)}
                </span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        )}

        {!isOwner && supplier && (
          <div className="mt-3 flex gap-3">
            <a
              href={phoneToTel(supplier.phone)}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
            >
              <Phone className="h-4 w-4" /> Call
            </a>
            <a
              href={phoneToWhatsApp(supplier.phone)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        )}

        {isOwner && (
          <Link
            href={`/products/${product.id}/edit`}
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Pencil className="h-4 w-4" /> Edit this listing
          </Link>
        )}

        {tightComparable.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-1 text-base font-semibold">Price Comparison</h3>
            <p className="mb-3 text-sm text-muted-foreground">
              Other suppliers selling {product.name} ({product.unit})
            </p>
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="flex items-center justify-between border-l-4 border-primary bg-primary-light px-4 py-3">
                <span>
                  <span className="block text-[14px] font-semibold text-ink">
                    {supplier?.name || 'This supplier'} <Check className="ml-1 inline h-3.5 w-3.5 text-primary" />
                  </span>
                  <span className="block text-[12px] text-muted-foreground">{product.location}</span>
                </span>
                <span className="text-[15px] font-bold text-primary">{formatPrice(product.price)}</span>
              </div>
              {tightComparable.map((item) => (
                <Link
                  key={item.id}
                  href={`/products/${item.id}`}
                  className="flex items-center justify-between border-t border-line bg-surface px-4 py-3"
                >
                  <span>
                    <span className="block text-[14px] font-semibold text-ink">
                      {suppliers[item.supplierId]?.name || 'Other supplier'}
                    </span>
                    <span className="block text-[12px] text-muted-foreground">{item.location}</span>
                  </span>
                  <span
                    className={`text-[15px] font-bold ${
                      Number(item.price) < Number(product.price) ? 'text-primary' : 'text-danger'
                    }`}
                  >
                    {formatPrice(item.price)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
