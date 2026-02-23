'use client';

import dynamic from 'next/dynamic';
import type { MapPickerProps } from './MapPicker.types';

const MapPickerInner = dynamic(() => import('./MapPickerInner'), {
  ssr: false,
  loading: () => (
    <div
      className="h-full min-h-[220px] rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-muted)] text-sm"
    >
      Cargando mapa…
    </div>
  ),
});

export default function MapPicker({ lat, lng, onSelect, className = '' }: MapPickerProps) {
  return (
    <div className={`rounded-lg overflow-hidden border border-[var(--border)] ${className}`} style={{ height: 220 }}>
      <MapPickerInner lat={lat} lng={lng} onSelect={onSelect} />
    </div>
  );
}
