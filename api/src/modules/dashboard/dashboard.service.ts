import { Prisma, ReportStatus } from '../../../generated/prisma-client/index.js';
import { prisma } from '../../shared/prisma.js';
import type { DashboardListQuery, DashboardPatchReportBody } from './dashboard.schemas.js';

export async function listReportsForDashboard(query: DashboardListQuery) {
  const where: Prisma.ReportWhereInput = {};
  if (query.status) where.status = query.status as ReportStatus;
  if (query.category) where.category = query.category;
  if (query.colonia) where.colonia = query.colonia;
  if (query.since) {
    const sinceDate = new Date(query.since);
    if (!Number.isNaN(sinceDate.getTime())) where.createdAt = { gte: sinceDate };
  }

  const orderBy: Prisma.ReportOrderByWithRelationInput =
    query.orderBy === 'voteCount'
      ? { votes: { _count: query.order } }
      : { createdAt: query.order };

  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy,
      take: query.limit,
      skip: query.offset,
      include: {
        user: { select: { id: true, email: true, phone: true, colonia: true } },
        _count: { select: { votes: true } },
      },
    }),
    prisma.report.count({ where }),
  ]);

  return {
    data: items.map((r) => ({
      id: r.id,
      category: r.category,
      description: r.description,
      photoUrl: r.photoUrl,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      colonia: r.colonia ?? undefined,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      voteCount: r._count.votes,
      user: r.user,
    })),
    meta: { total, limit: query.limit, offset: query.offset },
  };
}

export async function updateReportStatus(
  reportId: string,
  userId: string,
  body: DashboardPatchReportBody
) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return null;

  const fromStatus = report.status;
  const toStatus = body.status as ReportStatus;

  await prisma.$transaction([
    prisma.report.update({
      where: { id: reportId },
      data: { status: toStatus },
    }),
    prisma.reportStatusHistory.create({
      data: {
        reportId,
        fromStatus,
        toStatus,
        changedById: userId,
        comment: body.comment ?? null,
      },
    }),
  ]);

  const updated = await prisma.report.findUnique({
    where: { id: reportId },
    include: { _count: { select: { votes: true } } },
  });
  if (!updated) return null;
  return {
    id: updated.id,
    status: updated.status,
    updatedAt: updated.updatedAt.toISOString(),
    voteCount: updated._count.votes,
  };
}

export async function getReportHistory(reportId: string) {
  const history = await prisma.reportStatusHistory.findMany({
    where: { reportId },
    orderBy: { createdAt: 'desc' },
    include: { changedBy: { select: { id: true, email: true } } },
  });
  return history.map((h) => ({
    id: h.id,
    fromStatus: h.fromStatus,
    toStatus: h.toStatus,
    comment: h.comment,
    createdAt: h.createdAt.toISOString(),
    changedBy: h.changedBy,
  }));
}

export async function getDashboardStats() {
  const [byStatus, byCategory, byColonia, topVoted] = await Promise.all([
    prisma.report.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.report.groupBy({
      by: ['category'],
      _count: { id: true },
    }),
    prisma.report.groupBy({
      by: ['colonia'],
      _count: { id: true },
    }),
    prisma.report.findMany({
      take: 10,
      orderBy: { votes: { _count: 'desc' } },
      include: { _count: { select: { votes: true } } },
    }),
  ]);

  const byColoniaRecord: Record<string, number> = {};
  for (const row of byColonia) {
    const key = row.colonia ?? 'Sin colonia';
    byColoniaRecord[key] = row._count.id;
  }

  return {
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.id])),
    byCategory: Object.fromEntries(byCategory.map((c) => [c.category, c._count.id])),
    byColonia: byColoniaRecord,
    topVoted: topVoted.map((r) => ({
      id: r.id,
      category: r.category,
      description: r.description.substring(0, 80),
      status: r.status,
      voteCount: r._count.votes,
      createdAt: r.createdAt.toISOString(),
    })),
    total: await prisma.report.count(),
  };
}
