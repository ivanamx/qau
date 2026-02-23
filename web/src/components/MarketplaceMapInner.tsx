'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import type { Business } from '@/lib/api';
import { MAP_CENTER, MAP_ZOOM } from '@/lib/constants';
import Link from 'next/link';
import AlcaldiaBounds from '@/components/AlcaldiaBounds';
import 'leaflet/dist/leaflet.css';

function MapFlyTo({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 16, { duration: 0.8 });
  }, [map, center]);
  return null;
}

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png';

function BusinessMarkers({ businesses }: { businesses: Business[] }) {
  return (
    <>
      {businesses
        .filter((b) => b.latitude != null && b.longitude != null)
        .map((b) => (
          <CircleMarker
            key={b.id}
            center={[b.latitude!, b.longitude!]}
            radius={b.offerCount > 0 ? 10 : 7}
            pathOptions={{
              fillColor: b.offerCount > 0 ? '#22c55e' : 'var(--text-muted)',
              color: 'rgba(255,255,255,0.8)',
              weight: 1.5,
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <div className="min-w-[180px] text-left">
                <p className="font-semibold text-[var(--text-primary)]">{b.name}</p>
                {b.address && (
                  <p className="text-sm text-[var(--text-muted)] mt-1">{b.address}</p>
                )}
                {b.category && (
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{b.category}</p>
                )}
                {b.offerCount > 0 && (
                  <Link
                    href={`/marketplace?business=${b.id}`}
                    className="inline-block mt-2 text-sm text-[var(--accent)] hover:underline"
                  >
                    Ver {b.offerCount} oferta{b.offerCount !== 1 ? 's' : ''}
                  </Link>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
    </>
  );
}

type Props = { businesses: Business[]; centerOn: [number, number] | null };

function SetDefaultView() {
  const map = useMap();
  useEffect(() => {
    map.setView(MAP_CENTER, MAP_ZOOM);
  }, [map]);
  return null;
}

export default function MarketplaceMapInner({ businesses, centerOn }: Props) {
  return (
    <MapContainer
      key={`map-${MAP_CENTER[0]}-${MAP_CENTER[1]}`}
      center={MAP_CENTER}
      zoom={MAP_ZOOM}
      zoomControl={false}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer url={DARK_TILES} maxZoom={19} />
      <SetDefaultView />
      <AlcaldiaBounds center={MAP_CENTER} zoom={MAP_ZOOM} />
      <BusinessMarkers businesses={businesses} />
      <MapFlyTo center={centerOn} />
    </MapContainer>
  );
}
