import { Prisma, ReportStatus } from '../../../generated/prisma-client/index.js';
import { prisma } from '../../shared/prisma.js';
import type { CreateReportInput, ListReportsQuery } from './report.schemas.js';

function reportAuthorPayload(r: { user?: { id: string; email: string | null; phone: string | null; colonia: string | null } | null; citizen?: { id: string; email: string | null; phone: string | null; colonia: string | null; nombre: string | null; apellidos: string | null } | null }) {
  const c = r.citizen;
  if (c) {
    return { id: c.id, email: c.email ?? undefined, phone: c.phone ?? undefined, colonia: c.colonia ?? undefined, nombre: c.nombre ?? undefined, apellidos: c.apellidos ?? undefined };
  }
  const u = r.user;
  if (u) {
    return { id: u.id, email: u.email ?? undefined, phone: u.phone ?? undefined, colonia: u.colonia ?? undefined };
  }
  return undefined;
}

export async function listReports(query: ListReportsQuery) {
  const where: Prisma.ReportWhereInput = {};
  if (query.status) where.status = query.status as ReportStatus;
  if (query.category) where.category = query.category;
  if (query.since) {
    const sinceDate = new Date(query.since);
    if (!Number.isNaN(sinceDate.getTime())) where.createdAt = { gte: sinceDate };
  }

  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset,
      include: {
        user: { select: { id: true, email: true, phone: true, colonia: true } },
        citizen: { select: { id: true, email: true, phone: true, colonia: true, nombre: true, apellidos: true } },
        _count: { select: { votes: true, citizenVotes: true } },
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
      voteCount: r._count.votes + r._count.citizenVotes,
      user: reportAuthorPayload(r),
    })),
    meta: { total, limit: query.limit, offset: query.offset },
  };
}

export async function getReportById(id: string) {
  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, phone: true, colonia: true } },
      citizen: { select: { id: true, email: true, phone: true, colonia: true, nombre: true, apellidos: true } },
      _count: { select: { votes: true, citizenVotes: true } },
    },
  });
  if (!report) return null;
  return {
    id: report.id,
    category: report.category,
    description: report.description,
    photoUrl: report.photoUrl,
    latitude: Number(report.latitude),
    longitude: Number(report.longitude),
    colonia: report.colonia ?? undefined,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    voteCount: report._count.votes + report._count.citizenVotes,
    user: reportAuthorPayload(report),
  };
}

export type ReportAuthor = { type: 'citizen'; id: string } | { type: 'user'; id: string };

export async function createReport(
  author: ReportAuthor,
  input: CreateReportInput,
  photoUrl: string
) {
  const report = await prisma.report.create({
    data: {
      ...(author.type === 'citizen' ? { citizenId: author.id } : { userId: author.id }),
      category: input.category,
      description: input.description,
      photoUrl,
      latitude: new Prisma.Decimal(input.latitude),
      longitude: new Prisma.Decimal(input.longitude),
      colonia: input.colonia ?? null,
      status: ReportStatus.PENDING,
    },
    include: {
      _count: { select: { votes: true, citizenVotes: true } },
    },
  });
  return {
    id: report.id,
    category: report.category,
    description: report.description,
    photoUrl: report.photoUrl,
    latitude: Number(report.latitude),
    longitude: Number(report.longitude),
    colonia: report.colonia ?? undefined,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    voteCount: report._count.votes + report._count.citizenVotes,
  };
}

export async function voteReport(reportId: string, author: ReportAuthor) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return null;
  if (report.status !== ReportStatus.PENDING) {
    throw new Error('Solo se puede votar en reportes pendientes');
  }
  if (author.type === 'citizen') {
    const existing = await prisma.citizenReportVote.findUnique({
      where: { reportId_citizenId: { reportId, citizenId: author.id } },
    });
    if (existing) throw new Error('Ya apoyaste este reporte');
    await prisma.citizenReportVote.create({
      data: { reportId, citizenId: author.id },
    });
  } else {
    const existing = await prisma.reportVote.findUnique({
      where: { reportId_userId: { reportId, userId: author.id } },
    });
    if (existing) throw new Error('Ya apoyaste este reporte');
    await prisma.reportVote.create({
      data: { reportId, userId: author.id },
    });
  }
  const updated = await prisma.report.findUnique({
    where: { id: reportId },
    include: { _count: { select: { votes: true, citizenVotes: true } } },
  });
  return updated ? { voteCount: updated._count.votes + updated._count.citizenVotes } : null;
}
