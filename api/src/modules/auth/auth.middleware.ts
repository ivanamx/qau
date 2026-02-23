import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from './auth.service.js';

export type AuthPayload = { userId: string; role: string };

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<AuthPayload | null> {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Unauthorized', message: 'Falta token' });
    return null;
  }
  const token = header.slice(7);
  try {
    const payload = await verifyAccessToken(token);
    (request as FastifyRequest & { auth?: AuthPayload }).auth = payload;
    return payload;
  } catch {
    reply.status(401).send({ error: 'Unauthorized', message: 'Token inválido o expirado' });
    return null;
  }
}

export function requireRoles(...allowed: string[]) {
  return async (request: FastifyRequest & { auth?: AuthPayload }, reply: FastifyReply) => {
    const payload = await requireAuth(request, reply);
    if (!payload) return null;
    if (!allowed.includes(payload.role)) {
      reply.status(403).send({ error: 'Forbidden', message: 'Sin permiso para esta acción' });
      return null;
    }
    return payload;
  };
}
