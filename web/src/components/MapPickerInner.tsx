'use client';

import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import { MAP_CENTER, MAP_ZOOM } from '@/lib/constants';
import 'leaflet/dist/leaflet.css';

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png';

type MapPickerInnerProps = {
  lat: number | null;
  lng: number | null;
  onSelect: (lat: number, lng: number) => void;
};

function ClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPickerInner({ lat, lng, onSelect }: MapPickerInnerProps) {
  const hasPosition = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);
  const center: [number, number] = hasPosition ? [lat, lng] : MAP_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={MAP_ZOOM}
      zoomControl={false}
      className="h-full w-full rounded-lg"
      scrollWheelZoom={true}
    >
      <TileLayer url={DARK_TILES} maxZoom={19} />
      <ClickHandler onSelect={onSelect} />
      {hasPosition && (
        <CircleMarker
          center={[lat, lng]}
          radius={10}
          pathOptions={{
            fillColor: 'var(--accent)',
            color: 'rgba(255,255,255,0.9)',
            weight: 2,
            fillOpacity: 0.95,
          }}
        />
      )}
    </MapContainer>
  );
}
