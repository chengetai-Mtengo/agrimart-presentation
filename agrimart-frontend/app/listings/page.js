'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import TopBar from '@/components/TopBar';
import Badge from '@/components/Badge';
import Spinner from '@/components/Spinner';
import { EmptyState, ErrorNote } from '@/components/Spinner';
import { formatPrice } from '@/lib/format';
import { Ban, ClipboardList, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

function ListingsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .listProducts({ supplier: user.id, limit: 100 })
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSoldOut(id) {
    setBusyId(id);
    try {
      await api.markSoldOut(id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id) {
    setBusyId(id);
    try {
      await api.deleteProduct(id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
      setDeleteId(null);
    }
  }

  return (
    <AppShell nav={false} width="default">
      <TopBar title="My Listings" />
      <div className="px-4 pb-6 md:px-0">
        <p className="mb-4 text-sm text-muted-foreground">{products.length} listings</p>
        <ErrorNote message={error} />

        {loading ? (
          <div className="flex justify-center py-14">
            <Spinner />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-5 w-5" />}
            title="No listings yet"
            message="Add your first product to start selling."
          />
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl border bg-card shadow-sm">
                <div className="flex items-start justify-between p-4">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm font-semibold text-primary">
                      {formatPrice(p.price)} / {p.unit}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Qty: {p.quantity} - {p.location}
                    </p>
                  </div>
                  <Badge status={p.availability} />
                </div>
                <div className="grid grid-cols-3 border-t p-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/products/${p.id}/edit`)}
                    className="text-primary"
                  >
                    <Pencil /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSoldOut(p.id)}
                    disabled={busyId === p.id || p.availability === 'sold_out'}
                    className="text-amber-700"
                  >
                    <Ban /> Sold Out
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(p.id)}
                    disabled={busyId === p.id}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <AlertDialog open={deleteId != null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The product will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(deleteId)}>Delete listing</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

export default function ListingsPage() {
  return (
    <ProtectedRoute>
      <ListingsContent />
    </ProtectedRoute>
  );
}
