'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { ColoniasGeoJSON } from '@/lib/coloniasGeo';

/** Pane por debajo de los marcadores para que estos reciban siempre el clic. */
const BELOW_MARKERS_PANE = 'belowMarkers';
function ensureBelowMarkersPane(map: L.Map) {
  if (map.getPane(BELOW_MARKERS_PANE)) return;
  const pane = map.createPane(BELOW_MARKERS_PANE);
  pane.style.zIndex = '350';
}

/** Estilo del contorno de la colonia seleccionada (línea delgada y atenuada) */
const COLONIA_STYLE = {
  color: 'rgba(245, 158, 11, 0.6)',
  weight: 1.2,
  fillColor: '#f59e0b',
  fillOpacity: 0,
};

type ColoniaHighlightProps = {
  selectedColonia: string | null;
  coloniasGeojson: ColoniasGeoJSON | null;
};

/**
 * Dibuja el contorno de la colonia seleccionada en el mapa cuando hay filtro por colonia.
 * Usar dentro de <MapContainer>. El nombre debe coincidir con properties.nom_asen del GeoJSON.
 */
export default function ColoniaHighlight({ selectedColonia, coloniasGeojson }: ColoniaHighlightProps) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (!selectedColonia?.trim() || !coloniasGeojson?.features?.length) return;

    const feature = coloniasGeojson.features.find(
      (f) => f.properties?.nom_asen === selectedColonia
    );
    if (!feature?.geometry) return;

    const geojson = {
      type: 'FeatureCollection' as const,
      features: [feature],
    };

    ensureBelowMarkersPane(map);
    const layer = L.geoJSON(geojson, {
      style: () => ({ ...COLONIA_STYLE, pane: BELOW_MARKERS_PANE }),
    });
    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, selectedColonia, coloniasGeojson]);

  return null;
}
