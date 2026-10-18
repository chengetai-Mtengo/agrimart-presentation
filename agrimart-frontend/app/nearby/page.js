'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { distanceKm } from '@/lib/geo';
import { useSupplierMap } from '@/lib/hooks';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import PageHeading from '@/components/PageHeading';
import BottomNav from '@/components/BottomNav';
import Spinner from '@/components/Spinner';
import { ErrorNote } from '@/components/Spinner';
import Avatar from '@/components/Avatar';
import { ChevronRight, MapPin } from 'lucide-react';

const FarmsMap = dynamic(() => import('@/components/FarmsMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <Spinner />
    </div>
  ),
});

const LUSAKA = [-15.4167, 28.2833];

function NearbyContent() {
  const router = useRouter();
  const { suppliers } = useSupplierMap();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myLocation, setMyLocation] = useState(null);
  const [locStatus, setLocStatus] = useState('idle'); // idle | locating | granted | denied | unsupported

  useEffect(() => {
    let active = true;
    api
      .listProducts({ limit: 100 })
      .then((data) => active && setProducts(data))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Ask the browser for the buyer's own position so we can show which farms
  // are actually nearby, not just a static list — this is what makes
  // "Nearby Farms" mean something rather than just being a map of everyone.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setLocStatus('unsupported');
      return;
    }
    setLocStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus('granted');
      },
      () => setLocStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const points = useMemo(() => {
    const bySupplier = new Map();
    products.forEach((p) => {
      if (p.latitude == null || p.longitude == null) return;
      if (!bySupplier.has(p.supplierId)) {
        bySupplier.set(p.supplierId, {
          id: p.supplierId,
          name: suppliers[p.supplierId]?.name || p.location || 'Farmer',
          photo: suppliers[p.supplierId]?.profilePicture || null,
          location: `${p.location || ''}${p.province ? `, ${p.province}` : ''}`,
          lat: p.latitude,
          lng: p.longitude,
        });
      }
    });

    let list = Array.from(bySupplier.values());
    if (myLocation) {
      list = list
        .map((pt) => ({ ...pt, distanceKm: distanceKm(myLocation, pt) }))
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }
    return list;
  }, [products, myLocation, suppliers]);

  const banner = myLocation
    ? { title: 'Using your current location', sub: `${points.length} farms nearby` }
    : locStatus === 'locating'
    ? { title: 'Finding your location…', sub: `${points.length} farms on the map` }
    : locStatus === 'denied'
    ? { title: 'Location access denied', sub: `Showing all ${points.length} farms` }
    : { title: 'Showing all farms', sub: `${points.length} farms on the map` };

  return (
    <AppShell width="wide">
      <div className="px-4 pb-4 pt-6 md:px-0 md:pt-8">
        <PageHeading>Nearby Farms</PageHeading>
      </div>

      <div className="relative mx-4 h-[420px] overflow-hidden rounded-xl border bg-card shadow-sm md:mx-0 md:h-[520px]">
        <div className="absolute left-3 top-3 z-[400] rounded-lg border bg-background/95 px-4 py-3 shadow-md backdrop-blur">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {banner.title}</p>
          <p className="mt-0.5 text-sm font-semibold text-primary">{banner.sub}</p>
        </div>
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center px-8">
            <ErrorNote message={`Couldn't load farms: ${error}`} />
          </div>
        ) : points.length === 0 ? (
          <div className="flex h-full items-center justify-center px-8 text-center text-[13px] text-muted-foreground">
            No farms have pinned their location yet.
          </div>
        ) : (
          <FarmsMap
            center={myLocation ? [myLocation.lat, myLocation.lng] : LUSAKA}
            points={points}
            myLocation={myLocation}
            onSelect={(point) => router.push(`/suppliers/${point.id}`)}
          />
        )}
      </div>

      {points.length > 0 && (
        <div className="mt-4 space-y-2 px-4 md:px-0">
          {points.map((point) => (
            <Link
              key={point.id}
              href={`/suppliers/${point.id}`}
              className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-muted/40"
            >
              <span className="flex items-center gap-3">
                <Avatar src={point.photo} name={point.name} size={36} />
                <span className="text-[14px] font-semibold text-ink">{point.name}</span>
              </span>
              <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                {point.distanceKm != null ? `${point.distanceKm.toFixed(1)} km away` : point.location}
                <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      )}

      <BottomNav />
    </AppShell>
  );
}

export default function NearbyPage() {
  return (
    <ProtectedRoute>
      <NearbyContent />
    </ProtectedRoute>
  );
}
