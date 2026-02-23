import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

const GEOJSON_URL = '/geojson/alcaldia-cuauhtemoc.json';

export type GeoJSONFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: { type: string; coordinates: unknown };
    properties?: Record<string, unknown>;
  }>;
};

let cached: GeoJSONFeatureCollection | null = null;

export async function fetchAlcaldiaGeoJSON(): Promise<GeoJSONFeatureCollection | null> {
  if (cached) return cached;
  try {
    const res = await fetch(GEOJSON_URL);
    if (!res.ok) return null;
    const data: GeoJSONFeatureCollection = await res.json();
    cached = data;
    return data;
  } catch {
    return null;
  }
}

/**
 * Indica si el punto (lat, lng) está dentro del polígono de la alcaldía.
 * Requiere el GeoJSON de la alcaldía (FeatureCollection con al menos un Feature con geometría Polygon/MultiPolygon).
 */
export function isPointInAlcaldia(
  lat: number,
  lng: number,
  geojson: GeoJSONFeatureCollection | null
): boolean {
  if (!geojson?.features?.length) return false;
  const feature = geojson.features[0];
  if (!feature?.geometry || (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon'))
    return false;
  // Turf espera [longitude, latitude]
  // Turf acepta Feature<Polygon | MultiPolygon>
  return booleanPointInPolygon([lng, lat], feature as Parameters<typeof booleanPointInPolygon>[1]);
}

/** Bounds para Google Maps (south, north, west, east) desde el primer feature del GeoJSON */
export function getAlcaldiaBounds(geojson: GeoJSONFeatureCollection | null): { south: number; north: number; west: number; east: number } | null {
  if (!geojson?.features?.length) return null;
  const geom = geojson.features[0]?.geometry;
  if (!geom || (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon')) return null;
  const coords = geom.coordinates as number[][][][] | number[][][];
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  const flatten = (ring: number[][]) => {
    for (const [lng, lat] of ring) {
      minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
    }
  };
  if (geom.type === 'MultiPolygon') {
    for (const poly of coords as number[][][][]) for (const ring of poly) flatten(ring);
  } else {
    for (const ring of coords as number[][][]) flatten(ring);
  }
  if (minLng === Infinity) return null;
  return { south: minLat, north: maxLat, west: minLng, east: maxLng };
}
