import { z } from 'zod';

const reportStatusEnum = z.enum([
  'PENDING',
  'CHANNELED',
  'IN_PROGRESS',
  'RESOLVED',
]);

export const dashboardListReportsQuerySchema = z.object({
  status: reportStatusEnum.optional(),
  category: z.string().optional(),
  colonia: z.string().optional(),
  since: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  orderBy: z.enum(['createdAt', 'voteCount']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const dashboardPatchReportSchema = z.object({
  status: reportStatusEnum,
  comment: z.string().max(500).optional(),
});

export type DashboardListQuery = z.infer<typeof dashboardListReportsQuerySchema>;
export type DashboardPatchReportBody = z.infer<typeof dashboardPatchReportSchema>;
