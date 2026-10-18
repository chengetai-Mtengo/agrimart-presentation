'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Spinner from './Spinner';
import { LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LocationPicker = dynamic(() => import('./LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <Spinner />
    </div>
  ),
});

// Used on Add/Edit Product so a farmer can pin exactly where this listing
// is — either by tapping the map, dragging the pin, or using the device's
// GPS. Saved as the product's latitude/longitude (columns the backend
// already accepts), which is what powers the Nearby Farms map for buyers.
export default function LocationPinField({ value, onChange, center }) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setError('Location is not supported on this device.');
      return;
    }
    setError('');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location — tap the map to pin it manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {value ? 'Drag the pin to fine-tune it.' : 'Tap the map to pin your farm location.'}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={useMyLocation}
          disabled={locating}
          className="shrink-0"
        >
          <LocateFixed className={locating ? 'animate-pulse' : ''} />
          {locating ? 'Locating…' : 'Use my location'}
        </Button>
      </div>
      <div className="h-56 w-full overflow-hidden rounded-lg border">
        <LocationPicker value={value} onChange={onChange} center={center} />
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {value && (
        <p className="mt-2 text-xs text-muted-foreground">
          Pinned at {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
        </p>
      )}
    </div>
  );
}
