'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const GEOJSON_URL = '/geojson/alcaldia-cuauhtemoc.json';
const MIN_ZOOM = 13;
const POLYGON_STYLE = {
  color: '#0d9488',
  weight: 2,
  fillColor: '#0d9488',
  fillOpacity: 0,
};

type Props = {
  center: [number, number];
  zoom: number;
};

/**
 * Carga el GeoJSON de la alcaldía Cuauhtémoc, restringe el mapa a sus límites
 * (maxBounds + vista inicial) y opcionalmente dibuja el polígono.
 * Debe usarse dentro de <MapContainer>. Si el archivo no existe, el mapa no se modifica.
 */
export default function AlcaldiaBounds({ center, zoom }: Props) {
  const map = useMap();

  useEffect(() => {
    let layer: L.GeoJSON | null = null;

    const applyDefaultView = () => {
      map.invalidateSize();
      map.setView(center, zoom);
    };

    fetch(GEOJSON_URL)
      .then((res) => {
        if (!res.ok) throw new Error('GeoJSON no encontrado');
        return res.json() as Promise<Parameters<typeof L.geoJSON>[0]>;
      })
      .then((geojson) => {
        if (!geojson) return;
        layer = L.geoJSON(geojson, {
          style: () => POLYGON_STYLE,
        });
        const bounds = layer.getBounds();
        if (!bounds.isValid()) return;

        map.setMaxBounds(bounds.pad(2));
        map.setMaxZoom(19);
        map.setMinZoom(MIN_ZOOM);
        map.addLayer(layer);
        applyDefaultView();
        setTimeout(applyDefaultView, 150);
        setTimeout(applyDefaultView, 500);
      })
      .catch(() => {
        applyDefaultView();
      });

    return () => {
      if (layer) map.removeLayer(layer);
    };
  }, [map, center, zoom]);

  return null;
}
