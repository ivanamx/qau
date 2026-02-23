import { Prisma } from '../../../generated/prisma-client/index.js';
import { prisma } from '../../shared/prisma.js';
import type { ListBusinessesQuery, SyncBusinessesBody } from './business.schemas.js';
import { searchNearby } from './places.service.js';

export async function getBusinessCategories(): Promise<string[]> {
  const rows = await prisma.business.findMany({
    where: { category: { not: null } },
    select: { category: true },
    distinct: ['category'],
  });
  return rows.map((r) => r.category as string).filter(Boolean).sort();
}

export async function listBusinesses(query: ListBusinessesQuery) {
  const where: Prisma.BusinessWhereInput = {};
  if (query.category) where.category = query.category;
  if (query.hasOffer === 'true') {
    where.offers = { some: {} };
  } else if (query.hasOffer === 'false') {
    where.offers = { none: {} };
  }

  const [items, total] = await Promise.all([
    prisma.business.findMany({
      where,
      orderBy: { name: 'asc' },
      take: query.limit,
      skip: query.offset,
      include: {
        _count: { select: { offers: true } },
      },
    }),
    prisma.business.count({ where }),
  ]);

  return {
    data: items.map((b) => ({
      id: b.id,
      placeId: b.placeId,
      name: b.name,
      address: b.address,
      latitude: b.latitude != null ? Number(b.latitude) : null,
      longitude: b.longitude != null ? Number(b.longitude) : null,
      rating: b.rating != null ? Number(b.rating) : null,
      category: b.category,
      photoUrl: b.photoUrl,
      cachedAt: b.cachedAt.toISOString(),
      offerCount: b._count.offers,
    })),
    meta: { total, limit: query.limit, offset: query.offset },
  };
}

export async function getBusinessById(id: string) {
  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      offers: {
        where: { validUntil: { gte: new Date() } },
        orderBy: { validUntil: 'asc' },
      },
      _count: { select: { offers: true } },
    },
  });
  if (!business) return null;
  return {
    id: business.id,
    placeId: business.placeId,
    name: business.name,
    address: business.address,
    latitude: business.latitude != null ? Number(business.latitude) : null,
    longitude: business.longitude != null ? Number(business.longitude) : null,
    rating: business.rating != null ? Number(business.rating) : null,
    category: business.category,
    photoUrl: business.photoUrl,
    cachedAt: business.cachedAt.toISOString(),
    offers: business.offers.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      imageUrl: o.imageUrl,
      validFrom: o.validFrom.toISOString(),
      validUntil: o.validUntil.toISOString(),
      conditions: o.conditions,
    })),
    offerCount: business._count.offers,
  };
}

export async function syncBusinessesFromPlaces(body: SyncBusinessesBody) {
  const places = await searchNearby({
    latitude: body.latitude,
    longitude: body.longitude,
    radiusMeters: body.radiusMeters,
    includedTypes: body.includedTypes,
    maxResultCount: body.maxResultCount,
  });

  const now = new Date();
  const results: { placeId: string; created: boolean }[] = [];

  for (const place of places) {
    if (!place.placeId) continue;
    const existing = await prisma.business.findUnique({
      where: { placeId: place.placeId },
    });
    const data = {
      name: place.name,
      address: place.address,
      latitude: place.latitude != null ? new Prisma.Decimal(place.latitude) : null,
      longitude: place.longitude != null ? new Prisma.Decimal(place.longitude) : null,
      category: place.category,
      cachedAt: now,
    };
    if (existing) {
      await prisma.business.update({
        where: { id: existing.id },
        data,
      });
      results.push({ placeId: place.placeId, created: false });
    } else {
      await prisma.business.create({
        data: {
          placeId: place.placeId,
          ...data,
        },
      });
      results.push({ placeId: place.placeId, created: true });
    }
  }

  return { synced: results.length, results };
}
