import { config } from '../../shared/config.js';

const PLACES_NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType';

export type PlaceFromApi = {
  id?: string;
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  primaryType?: string;
};

export type NormalizedPlace = {
  placeId: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  category: string | null;
};

function extractPlaceId(idOrName: string | undefined): string {
  if (!idOrName) return '';
  return idOrName.replace(/^places\//, '');
}

export function normalizePlace(place: PlaceFromApi): NormalizedPlace {
  const placeId = extractPlaceId(place.id);
  return {
    placeId,
    name: place.displayName?.text ?? 'Sin nombre',
    address: place.formattedAddress ?? null,
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,
    category: place.primaryType ?? place.types?.[0] ?? null,
  };
}

export async function searchNearby(params: {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  includedTypes?: string[];
  maxResultCount?: number;
}): Promise<NormalizedPlace[]> {
  const apiKey = config.googlePlacesApiKey;
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY no configurada');
  }

  const body: Record<string, unknown> = {
    locationRestriction: {
      circle: {
        center: { latitude: params.latitude, longitude: params.longitude },
        radius: params.radiusMeters,
      },
    },
    maxResultCount: params.maxResultCount ?? 20,
  };
  if (params.includedTypes?.length) {
    body.includedTypes = params.includedTypes;
  }

  const res = await fetch(PLACES_NEARBY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { places?: PlaceFromApi[] };
  const places = data.places ?? [];
  return places.map(normalizePlace);
}
