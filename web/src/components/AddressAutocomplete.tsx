'use client';

/**
 * Autocompletado de direcciones con Google Places.
 * Requiere en Google Cloud: "Maps JavaScript API" y "Places API" (clásica, no "Places API (New)").
 */
import { useEffect, useRef } from 'react';
import { fetchAlcaldiaGeoJSON, getAlcaldiaBounds } from '@/lib/alcaldiaGeo';

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: { bounds?: unknown; strictBounds?: boolean; componentRestrictions?: object; fields?: string[] }
          ) => { getPlace: () => { formatted_address?: string; geometry?: { location: { lat: () => number; lng: () => number } } } };
        };
        event: { addListener: (instance: unknown, event: string, fn: () => void) => void };
        LatLngBounds: new (sw: { lat: () => number; lng: () => number }, ne: { lat: () => number; lng: () => number }) => unknown;
        LatLng: new (lat: number, lng: number) => { lat: () => number; lng: () => number };
      };
    };
  }
}

type AddressAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (address: string, lat: number, lng: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
};

const GOOGLE_SCRIPT_URL = 'https://maps.googleapis.com/maps/api/js';

function getScriptSrc(): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) return null;
  return `${GOOGLE_SCRIPT_URL}?key=${key}&loading=async&libraries=places`;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Buscar dirección en Cuauhtémoc…',
  disabled,
  className = '',
  id = 'report-address-input',
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<unknown>(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const onChangeRef = useRef(onChange);
  onPlaceSelectRef.current = onPlaceSelect;
  onChangeRef.current = onChange;

  useEffect(() => {
    const src = getScriptSrc();
    if (!src) return;

    let cancelled = false;

    const initAutocomplete = () => {
      if (cancelled || typeof window === 'undefined' || !window.google?.maps?.places) return;
      const input = inputRef.current;
      if (!input) return;
      if (autocompleteRef.current) return;

      fetchAlcaldiaGeoJSON().then((geojson) => {
        if (cancelled || !inputRef.current) return;
        const g = window.google!.maps;
        const Autocomplete = g.places.Autocomplete;
        const bounds = getAlcaldiaBounds(geojson ?? null);
        const options: { bounds?: unknown; strictBounds: boolean; componentRestrictions: { country: string }; fields: string[] } = {
          strictBounds: false,
          componentRestrictions: { country: 'mx' },
          fields: ['formatted_address', 'geometry'],
        };
        if (bounds) {
          const sw = new g.LatLng(bounds.south, bounds.west);
          const ne = new g.LatLng(bounds.north, bounds.east);
          options.bounds = new g.LatLngBounds(sw, ne);
        }
        const autocomplete = new Autocomplete(inputRef.current!, options);
        g.event.addListener(autocomplete, 'place_changed', () => {
          const place = autocomplete.getPlace();
          const loc = place.geometry?.location;
          const addr = place.formatted_address ?? '';
          if (loc && addr) {
            onChangeRef.current(addr);
            onPlaceSelectRef.current(addr, loc.lat(), loc.lng());
          }
        });
        autocompleteRef.current = autocomplete;
      });
    };

    let intervalId: ReturnType<typeof setInterval> | null = null;

    requestAnimationFrame(() => {
      if (cancelled || !inputRef.current) return;
      if (window.google?.maps?.places) {
        initAutocomplete();
        return;
      }
      if (document.querySelector(`script[src^="${GOOGLE_SCRIPT_URL}"]`)) {
        intervalId = setInterval(() => {
          if (cancelled) return;
          if (window.google?.maps?.places) {
            if (intervalId) clearInterval(intervalId);
            intervalId = null;
            initAutocomplete();
          }
        }, 100);
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (!cancelled && window.google?.maps?.places) initAutocomplete();
      };
      document.head.appendChild(script);
    });

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      autocompleteRef.current = null;
    };
  }, []);

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete="off"
      className={className}
    />
  );
}
