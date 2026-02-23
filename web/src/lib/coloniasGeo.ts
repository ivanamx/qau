import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

const GEOJSON_URL = '/geojson/cuauhtemoc_colonias.json';

export type ColoniasFeature = {
  type: 'Feature';
  properties: { nom_asen?: string; [key: string]: unknown };
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown };
};

export type ColoniasGeoJSON = {
  type: 'FeatureCollection';
  features: ColoniasFeature[];
};

let cached: ColoniasGeoJSON | null = null;

export async function fetchColoniasGeoJSON(): Promise<ColoniasGeoJSON | null> {
  if (cached) return cached;
  try {
    const res = await fetch(GEOJSON_URL);
    if (!res.ok) return null;
    const data: ColoniasGeoJSON = await res.json();
    cached = data;
    return data;
  } catch {
    return null;
  }
}

/** Lista de nombres de colonias (nom_asen) ordenados alfabéticamente */
export function getColoniaNames(geojson: ColoniasGeoJSON | null): string[] {
  if (!geojson?.features?.length) return [];
  const names = geojson.features
    .map((f) => f.properties?.nom_asen)
    .filter((n): n is string => typeof n === 'string' && n.length > 0);
  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}

/** Devuelve el nombre de la colonia (nom_asen) que contiene el punto (lat, lng), o null */
export function getColoniaForPoint(
  lat: number,
  lng: number,
  geojson: ColoniasGeoJSON | null
): string | null {
  if (!geojson?.features?.length) return null;
  for (const feature of geojson.features) {
    const geom = feature.geometry;
    if (geom?.type !== 'Polygon' && geom?.type !== 'MultiPolygon') continue;
    const name = feature.properties?.nom_asen;
    if (!name) continue;
    const inside = booleanPointInPolygon(
      [lng, lat],
      feature as Parameters<typeof booleanPointInPolygon>[1]
    );
    if (inside) return name;
  }
  return null;
}
