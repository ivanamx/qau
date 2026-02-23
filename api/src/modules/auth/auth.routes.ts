import type { FastifyInstance } from 'fastify';
import { register, login, refresh, forgotPassword } from './auth.service.js';
import { registerSchema, loginSchema, refreshSchema, forgotPasswordSchema } from './auth.schemas.js';

export async function authRoutes(app: FastifyInstance) {
  app.post(
    '/register',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            phone: { type: 'string' },
            password: { type: 'string' },
            colonia: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = registerSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'ValidationError',
          message: parsed.error.flatten().fieldErrors,
        });
      }
      try {
        const result = await register(parsed.data);
        return reply.status(201).send({ data: result });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error al registrar';
        return reply.status(400).send({ error: 'BadRequest', message: msg });
      }
    }
  );

  app.post(
    '/login',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            phone: { type: 'string' },
            password: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'ValidationError',
          message: parsed.error.flatten().fieldErrors,
        });
      }
      try {
        const result = await login(parsed.data);
        return reply.send({ data: result });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Credenciales inválidas';
        return reply.status(401).send({ error: 'Unauthorized', message: msg });
      }
    }
  );

  app.post(
    '/refresh',
    {
      schema: {
        body: {
          type: 'object',
          properties: { refreshToken: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      const parsed = refreshSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'ValidationError',
          message: parsed.error.flatten().fieldErrors,
        });
      }
      try {
        const result = await refresh(parsed.data.refreshToken);
        return reply.send({ data: result });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Token inválido o expirado';
        return reply.status(401).send({ error: 'Unauthorized', message: msg });
      }
    }
  );

  app.post(
    '/forgot-password',
    {
      schema: {
        body: {
          type: 'object',
          properties: { email: { type: 'string' }, phone: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      const parsed = forgotPasswordSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'ValidationError',
          message: parsed.error.flatten().fieldErrors,
        });
      }
      try {
        await forgotPassword(parsed.data);
        return reply.send({ data: { ok: true }, message: 'Si existe una cuenta, recibirás instrucciones.' });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error al procesar';
        return reply.status(400).send({ error: 'BadRequest', message: msg });
      }
    }
  );
}
