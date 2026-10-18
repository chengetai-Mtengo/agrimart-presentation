'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDateLong, phoneToTel, phoneToWhatsApp } from '@/lib/format';
import Avatar from '@/components/Avatar';
import AppShell from '@/components/AppShell';
import TopBar from '@/components/TopBar';
import ProductCard from '@/components/ProductCard';
import StatCard from '@/components/StatCard';
import Spinner from '@/components/Spinner';
import { EmptyState, ErrorNote } from '@/components/Spinner';
import { MapPin, MessageCircle, Phone, Wheat } from 'lucide-react';

export default function SupplierProfilePage() {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getUser(id), api.listProducts({ supplier: id, limit: 100 })])
      .then(([u, p]) => {
        setSupplier(u);
        setProducts(p);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppShell nav={false} width="default">
        <TopBar title="Supplier Profile" />
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      </AppShell>
    );
  }

  if (!supplier) {
    return (
      <AppShell nav={false} width="default">
        <TopBar title="Supplier Profile" />
        <div className="px-5 py-8">
          <ErrorNote message={error || 'Supplier not found.'} />
        </div>
      </AppShell>
    );
  }

  const active = products.filter((p) => p.availability !== 'sold_out' && p.availability !== 'hidden').length;

  return (
    <AppShell nav={false} width="default">
      <TopBar title="Supplier Profile" />

      <div className="mx-4 flex flex-col items-center rounded-xl border bg-card px-5 py-7 text-center shadow-sm md:mx-0">
        <Avatar src={supplier.profilePicture} name={supplier.name} size={80} className="text-[22px]" />
        <h2 className="mt-3 text-xl font-semibold tracking-tight">{supplier.name}</h2>
        {(supplier.location || supplier.province) && (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {supplier.location}
            {supplier.province ? `, ${supplier.province}` : ''}
          </p>
        )}
        {supplier.phone && <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {supplier.phone}</p>}
        {supplier.joinedDate && (
          <p className="mt-1 text-[12px] text-muted-foreground">Joined {formatDateLong(supplier.joinedDate)}</p>
        )}

        <div className="mt-4 flex w-full gap-3">
          <a
            href={phoneToTel(supplier.phone)}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-medium shadow-sm hover:bg-muted"
          >
            <Phone className="h-4 w-4" /> Call
          </a>
          <a
            href={phoneToWhatsApp(supplier.phone)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      </div>

      <div className="mt-5 flex gap-3 px-4 md:px-0">
        <StatCard value={products.length} label="Products" />
        <StatCard value={active} label="Active" tone="primary" />
      </div>

      <div className="mt-6 px-4 md:px-0">
        <h3 className="mb-3 text-base font-semibold">Products</h3>
        {products.length === 0 ? (
          <EmptyState icon={<Wheat className="h-5 w-5" />} title="No products listed" />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
