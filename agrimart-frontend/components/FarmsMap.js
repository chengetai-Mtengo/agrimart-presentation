'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { resolveImageUrl } from '@/lib/api';
import { initialsOf } from '@/lib/format';
import { ChevronRight } from 'lucide-react';

const MARKER_COLORS = ['#DC2626', '#F59E0B', '#7C3AED', '#0B6E4F', '#DB2777', '#EA580C'];

function FitBounds({ points, myLocation }) {
  const map = useMap();
  useEffect(() => {
    if (myLocation) {
      // Center on the buyer so it's obvious which pins are actually close.
      map.setView([myLocation.lat, myLocation.lng], 11);
      return;
    }
    if (points.length > 1) {
      map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [40, 40] });
    } else if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 10);
    }
  }, [points, myLocation, map]);
  return null;
}

// Builds a round marker showing the farmer's actual profile photo (falling
// back to their initials on a solid color) so buyers see *who* a pin
// belongs to right on the map, not just an anonymous colored dot.
function avatarIcon(photoSrc, name, color) {
  const size = 44;
  const resolved = resolveImageUrl(photoSrc);
  const inner = resolved
    ? `<img src="${resolved}" style="width:100%;height:100%;object-fit:cover;display:block;" />`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${color};color:#fff;font-weight:700;font-size:15px;font-family:inherit;">${initialsOf(
        name
      )}</div>`;

  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(20,27,22,0.35);overflow:hidden;">${inner}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export default function FarmsMap({ center, points, myLocation, onSelect }) {
  return (
    <MapContainer
      center={center}
      zoom={7}
      scrollWheelZoom={false}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} myLocation={myLocation} />

      {myLocation && (
        <CircleMarker
          center={[myLocation.lat, myLocation.lng]}
          radius={9}
          pathOptions={{ color: '#fff', weight: 3, fillColor: '#2563EB', fillOpacity: 1 }}
        >
          <Popup>You are here</Popup>
        </CircleMarker>
      )}

      {points.map((point, idx) => (
        <Marker
          key={point.id}
          position={[point.lat, point.lng]}
          icon={avatarIcon(point.photo, point.name, MARKER_COLORS[idx % MARKER_COLORS.length])}
        >
          <Popup>
            <div className="min-w-[160px]">
              <strong>{point.name}</strong>
              <br />
              {point.location}
              {point.distanceKm != null && (
                <>
                  <br />
                  {point.distanceKm.toFixed(1)} km away
                </>
              )}
              <br />
              <button
                onClick={() => onSelect && onSelect(point)}
                className="mt-1.5 text-[13px] font-semibold text-primary underline"
              >
                View farmer <ChevronRight className="inline h-3.5 w-3.5" />
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
