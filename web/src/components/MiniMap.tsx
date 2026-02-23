'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png';

type MiniMapProps = {
  lat: number;
  lng: number;
  zoom?: number;
  className?: string;
};

export default function MiniMap({ lat, lng, zoom = 17, className = '' }: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom,
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    });
    L.tileLayer(DARK_TILES, { maxZoom: 19 }).addTo(map);
    const marker = L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: 'var(--accent)',
      color: 'rgba(255,255,255,0.9)',
      weight: 1.5,
      fillOpacity: 0.95,
    }).addTo(map);
    mapRef.current = map;
    markerRef.current = marker;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init map once; second effect updates view
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    map.setView([lat, lng], zoom);
    marker.setLatLng([lat, lng]);
  }, [lat, lng, zoom]);

  return (
    <div
      ref={containerRef}
      className={`rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-base)] ${className}`}
      style={{ height: 180 }}
    />
  );
}
