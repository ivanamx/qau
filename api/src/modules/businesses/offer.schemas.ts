import { z } from 'zod';

export const createOfferSchema = z.object({
  businessId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  validFrom: z.union([z.string().datetime(), z.coerce.date()]),
  validUntil: z.union([z.string().datetime(), z.coerce.date()]),
  conditions: z.string().max(1000).optional(),
});

export const updateOfferSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  validFrom: z.union([z.string().datetime(), z.coerce.date()]).optional(),
  validUntil: z.union([z.string().datetime(), z.coerce.date()]).optional(),
  conditions: z.string().max(1000).optional().nullable(),
});

export const listOffersQuerySchema = z.object({
  businessId: z.string().uuid().optional(),
  activeOnly: z.enum(['true', 'false']).default('true'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;
export type ListOffersQuery = z.infer<typeof listOffersQuerySchema>;
