import type { FastifyInstance } from 'fastify';
import { requireRoles } from '../auth/auth.middleware.js';
import {
  listBusinesses,
  getBusinessById,
  syncBusinessesFromPlaces,
  getBusinessCategories,
} from './business.service.js';
import { listOffersByBusiness } from './offer.service.js';
import { listBusinessesQuerySchema, syncBusinessesBodySchema } from './business.schemas.js';

const DASHBOARD_ROLES = ['superadmin', 'admin', 'operator'] as const;

export async function businessRoutes(app: FastifyInstance) {
  const requireDashboard = requireRoles(...DASHBOARD_ROLES);

  // GET / — listar negocios (público)
  app.get('/', async (request, reply) => {
    const parsed = listBusinessesQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'ValidationError',
        message: parsed.error.flatten().fieldErrors,
      });
    }
    try {
      const result = await listBusinesses(parsed.data);
      return reply.send(result);
    } catch (e) {
      request.log.error(e);
      return reply.status(500).send({ error: 'InternalError', message: 'Error al listar negocios' });
    }
  });

  // GET /categories — categorías de negocios (público)
  app.get('/categories', async (_request, reply) => {
    try {
      const categories = await getBusinessCategories();
      return reply.send({ data: categories });
    } catch (e) {
      return reply.status(500).send({ error: 'InternalError', message: 'Error al listar categorías' });
    }
  });

  // POST /sync — sincronizar desde Google Places (solo dashboard)
  app.post(
    '/sync',
    {
      preHandler: [requireDashboard],
    },
    async (request, reply) => {
      const parsed = syncBusinessesBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'ValidationError',
          message: parsed.error.flatten().fieldErrors,
        });
      }
      try {
        const result = await syncBusinessesFromPlaces(parsed.data);
        return reply.send({ data: result });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error al sincronizar';
        request.log.error(e);
        return reply.status(500).send({ error: 'InternalError', message: msg });
      }
    }
  );

  // GET /:id — detalle negocio (público)
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const business = await getBusinessById(id);
    if (!business) {
      return reply.status(404).send({ error: 'NotFound', message: 'Negocio no encontrado' });
    }
    return reply.send({ data: business });
  });

  // GET /:id/offers — ofertas del negocio (público)
  app.get<{ Params: { id: string } }>('/:id/offers', async (request, reply) => {
    const { id } = request.params;
    const offers = await listOffersByBusiness(id, true);
    return reply.send({ data: offers });
  });
}
