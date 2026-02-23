import type { FastifyInstance } from 'fastify';
import { requireRoles } from '../auth/auth.middleware.js';
import {
  listReportsForDashboard,
  updateReportStatus,
  getReportHistory,
  getDashboardStats,
} from './dashboard.service.js';
import {
  dashboardListReportsQuerySchema,
  dashboardPatchReportSchema,
} from './dashboard.schemas.js';

const DASHBOARD_ROLES = ['superadmin', 'admin', 'operator'] as const;

export async function dashboardRoutes(app: FastifyInstance) {
  const requireDashboard = requireRoles(...DASHBOARD_ROLES);

  // GET /reports — listado para dashboard (filtros avanzados)
  app.get(
    '/reports',
    {
      preHandler: [requireDashboard],
    },
    async (request, reply) => {
      const parsed = dashboardListReportsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'ValidationError',
          message: parsed.error.flatten().fieldErrors,
        });
      }
      try {
        const result = await listReportsForDashboard(parsed.data);
        return reply.send(result);
      } catch (e) {
        request.log.error(e);
        return reply.status(500).send({ error: 'InternalError', message: 'Error al listar reportes' });
      }
    }
  );

  // GET /reports/:id/history — historial de cambios de estado
  app.get<{ Params: { id: string } }>(
    '/reports/:id/history',
    {
      preHandler: [requireDashboard],
    },
    async (request, reply) => {
      const { id } = request.params;
      try {
        const history = await getReportHistory(id);
        return reply.send({ data: history });
      } catch (e) {
        request.log.error(e);
        return reply.status(500).send({ error: 'InternalError', message: 'Error al obtener historial' });
      }
    }
  );

  // PATCH /reports/:id — cambiar estado (validar, rechazar, etc.)
  app.patch<{
    Params: { id: string };
    Body: { status: string; comment?: string };
  }>(
    '/reports/:id',
    {
      preHandler: [requireDashboard],
    },
    async (request, reply) => {
      const auth = (request as { auth?: { userId: string } }).auth;
      if (!auth?.userId) return;
      const { id } = request.params;
      const parsed = dashboardPatchReportSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'ValidationError',
          message: parsed.error.flatten().fieldErrors,
        });
      }
      try {
        const result = await updateReportStatus(id, auth.userId, parsed.data);
        if (!result) {
          return reply.status(404).send({ error: 'NotFound', message: 'Reporte no encontrado' });
        }
        return reply.send({ data: result });
      } catch (e) {
        request.log.error(e);
        return reply.status(500).send({ error: 'InternalError', message: 'Error al actualizar estado' });
      }
    }
  );

  // GET /stats — métricas (por categoría, estado, más votados)
  app.get(
    '/stats',
    {
      preHandler: [requireDashboard],
    },
    async (request, reply) => {
      try {
        const stats = await getDashboardStats();
        return reply.send({ data: stats });
      } catch (e) {
        request.log.error(e);
        return reply.status(500).send({ error: 'InternalError', message: 'Error al obtener métricas' });
      }
    }
  );
}
