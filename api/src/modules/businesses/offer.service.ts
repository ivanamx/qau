import { prisma } from '../../shared/prisma.js';
import type { CreateOfferInput, UpdateOfferInput, ListOffersQuery } from './offer.schemas.js';

export async function listOffers(query: ListOffersQuery) {
  const now = new Date();
  const where: { businessId?: string; validUntil?: { gte: Date } } = {};
  if (query.businessId) where.businessId = query.businessId;
  if (query.activeOnly === 'true') where.validUntil = { gte: now };

  const [items, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      orderBy: [{ validUntil: 'asc' }, { createdAt: 'desc' }],
      take: query.limit,
      skip: query.offset,
      include: {
        business: {
          select: { id: true, name: true, address: true, latitude: true, longitude: true },
        },
      },
    }),
    prisma.offer.count({ where }),
  ]);

  return {
    data: items.map((o) => ({
      id: o.id,
      businessId: o.businessId,
      title: o.title,
      description: o.description,
      imageUrl: o.imageUrl,
      validFrom: o.validFrom.toISOString(),
      validUntil: o.validUntil.toISOString(),
      conditions: o.conditions,
      createdAt: o.createdAt.toISOString(),
      business: {
        id: o.business.id,
        name: o.business.name,
        address: o.business.address,
        latitude: o.business.latitude != null ? Number(o.business.latitude) : null,
        longitude: o.business.longitude != null ? Number(o.business.longitude) : null,
      },
    })),
    meta: { total, limit: query.limit, offset: query.offset },
  };
}

export async function listOffersByBusiness(businessId: string, activeOnly = true) {
  const where: { businessId: string; validUntil?: { gte: Date } } = { businessId };
  if (activeOnly) where.validUntil = { gte: new Date() };

  const offers = await prisma.offer.findMany({
    where,
    orderBy: { validUntil: 'asc' },
  });
  return offers.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    imageUrl: o.imageUrl,
    validFrom: o.validFrom.toISOString(),
    validUntil: o.validUntil.toISOString(),
    conditions: o.conditions,
    createdAt: o.createdAt.toISOString(),
  }));
}

export async function getOfferById(id: string) {
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      business: true,
    },
  });
  if (!offer) return null;
  return {
    id: offer.id,
    businessId: offer.businessId,
    title: offer.title,
    description: offer.description,
    imageUrl: offer.imageUrl,
    validFrom: offer.validFrom.toISOString(),
    validUntil: offer.validUntil.toISOString(),
    conditions: offer.conditions,
    createdAt: offer.createdAt.toISOString(),
    business: {
      id: offer.business.id,
      name: offer.business.name,
      address: offer.business.address,
      latitude: offer.business.latitude != null ? Number(offer.business.latitude) : null,
      longitude: offer.business.longitude != null ? Number(offer.business.longitude) : null,
    },
  };
}

export async function createOffer(input: CreateOfferInput) {
  const validFrom = typeof input.validFrom === 'string' ? new Date(input.validFrom) : input.validFrom;
  const validUntil = typeof input.validUntil === 'string' ? new Date(input.validUntil) : input.validUntil;
  const offer = await prisma.offer.create({
    data: {
      businessId: input.businessId,
      title: input.title,
      description: input.description ?? null,
      imageUrl: input.imageUrl || null,
      validFrom,
      validUntil,
      conditions: input.conditions ?? null,
    },
    include: { business: { select: { id: true, name: true } } },
  });
  return {
    id: offer.id,
    businessId: offer.businessId,
    title: offer.title,
    description: offer.description,
    imageUrl: offer.imageUrl,
    validFrom: offer.validFrom.toISOString(),
    validUntil: offer.validUntil.toISOString(),
    conditions: offer.conditions,
    createdAt: offer.createdAt.toISOString(),
    business: offer.business,
  };
}

export async function updateOffer(id: string, input: UpdateOfferInput) {
  const data: Record<string, unknown> = {};
  if (input.title != null) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl || null;
  if (input.validFrom != null) data.validFrom = typeof input.validFrom === 'string' ? new Date(input.validFrom) : input.validFrom;
  if (input.validUntil != null) data.validUntil = typeof input.validUntil === 'string' ? new Date(input.validUntil) : input.validUntil;
  if (input.conditions !== undefined) data.conditions = input.conditions;

  const offer = await prisma.offer.update({
    where: { id },
    data: data as Parameters<typeof prisma.offer.update>[0]['data'],
    include: { business: { select: { id: true, name: true } } },
  });
  return {
    id: offer.id,
    businessId: offer.businessId,
    title: offer.title,
    description: offer.description,
    imageUrl: offer.imageUrl,
    validFrom: offer.validFrom.toISOString(),
    validUntil: offer.validUntil.toISOString(),
    conditions: offer.conditions,
    createdAt: offer.createdAt.toISOString(),
    business: offer.business,
  };
}

export async function deleteOffer(id: string) {
  await prisma.offer.delete({ where: { id } });
  return { deleted: true };
}
