import { z } from 'zod';
import { REPORT_CATEGORY_IDS } from './report.constants.js';

export const createReportSchema = z.object({
  category: z.enum(REPORT_CATEGORY_IDS as unknown as [string, ...string[]]),
  description: z.string().min(10).max(2000),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  colonia: z.string().max(200).optional(),
});

export const listReportsQuerySchema = z.object({
  status: z.enum(['PENDING', 'CHANNELED', 'IN_PROGRESS', 'RESOLVED']).optional(),
  category: z.string().optional(),
  since: z.string().optional(), // Fecha desde (ISO o YYYY-MM-DD)
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;
