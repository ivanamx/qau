import { z } from 'zod';

export const listBusinessesQuerySchema = z.object({
  category: z.string().optional(),
  hasOffer: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListBusinessesQuery = z.infer<typeof listBusinessesQuerySchema>;

export const syncBusinessesBodySchema = z.object({
  latitude: z.number().min(-90).max(90).default(19.4326),
  longitude: z.number().min(-180).max(180).default(-99.1332),
  radiusMeters: z.number().min(100).max(50000).default(3000),
  includedTypes: z.array(z.string()).max(20).optional(),
  maxResultCount: z.number().int().min(1).max(20).default(20),
});

export type SyncBusinessesBody = z.infer<typeof syncBusinessesBodySchema>;
