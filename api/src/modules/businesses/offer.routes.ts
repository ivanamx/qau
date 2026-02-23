import type { FastifyInstance } from 'fastify';
import { requireRoles } from '../auth/auth.middleware.js';
import {
  listOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
} from './offer.service.js';
import {
  listOffersQuerySchema,
  createOfferSchema,
  updateOfferSchema,
} from './offer.schemas.js';

const DASHBOARD_ROLES = ['superadmin', 'admin', 'operator'] as const;

export async function offerRoutes(app: FastifyInstance) {
  const requireDashboard = requireRoles(...DASHBOARD_ROLES);

  // GET / — listar ofertas (público; activeOnly por defecto)
  app.get('/', async (request, reply) => {
    const parsed = listOffersQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'ValidationError',
        message: parsed.error.flatten().fieldErrors,
      });
    }
    try {
      const result = await listOffers(parsed.data);
      return reply.send(result);
    } catch (e) {
      request.log.error(e);
      return reply.status(500).send({ error: 'InternalError', message: 'Error al listar ofertas' });
    }
  });

  // GET /:id — detalle oferta (público)
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const offer = await getOfferById(id);
    if (!offer) {
      return reply.status(404).send({ error: 'NotFound', message: 'Oferta no encontrada' });
    }
    return reply.send({ data: offer });
  });

  // POST / — crear oferta (solo dashboard)
  app.post(
    '/',
    {
      preHandler: [requireDashboard],
    },
    async (request, reply) => {
      const parsed = createOfferSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'ValidationError',
          message: parsed.error.flatten().fieldErrors,
        });
      }
      try {
        const offer = await createOffer(parsed.data);
        return reply.status(201).send({ data: offer });
      } catch (e) {
        request.log.error(e);
        return reply.status(500).send({ error: 'InternalError', message: 'Error al crear oferta' });
      }
    }
  );

  // PATCH /:id — actualizar oferta (solo dashboard)
  app.patch<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [requireDashboard],
    },
    async (request, reply) => {
      const { id } = request.params;
      const parsed = updateOfferSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'ValidationError',
          message: parsed.error.flatten().fieldErrors,
        });
      }
      try {
        const offer = await updateOffer(id, parsed.data);
        return reply.send({ data: offer });
      } catch (e) {
        if (e && typeof e === 'object' && 'code' in e && e.code === 'P2025') {
          return reply.status(404).send({ error: 'NotFound', message: 'Oferta no encontrada' });
        }
        request.log.error(e);
        return reply.status(500).send({ error: 'InternalError', message: 'Error al actualizar oferta' });
      }
    }
  );

  // DELETE /:id — eliminar oferta (solo dashboard)
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [requireDashboard],
    },
    async (request, reply) => {
      const { id } = request.params;
      try {
        await deleteOffer(id);
        return reply.send({ data: { deleted: true } });
      } catch (e) {
        if (e && typeof e === 'object' && 'code' in e && e.code === 'P2025') {
          return reply.status(404).send({ error: 'NotFound', message: 'Oferta no encontrada' });
        }
        request.log.error(e);
        return reply.status(500).send({ error: 'InternalError', message: 'Error al eliminar oferta' });
      }
    }
  );
}
