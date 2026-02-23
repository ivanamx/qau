import type { FastifyInstance } from 'fastify';
import { listReports, getReportById, createReport, voteReport } from './report.service.js';
import { listReportsQuerySchema, createReportSchema } from './report.schemas.js';
import { REPORT_CATEGORIES } from './report.constants.js';
import { requireAuth } from '../auth/auth.middleware.js';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export async function reportRoutes(app: FastifyInstance) {
  // GET /categories — listar categorías (público)
  app.get('/categories', async (_request, reply) => {
    return reply.send({ data: REPORT_CATEGORIES });
  });

  // GET / — listar reportes con filtros (público)
  app.get('/', async (request, reply) => {
    const parsed = listReportsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'ValidationError',
        message: parsed.error.flatten().fieldErrors,
      });
    }
    try {
      const result = await listReports(parsed.data);
      return reply.send(result);
    } catch (e) {
      request.log.error(e);
      return reply.status(500).send({ error: 'InternalError', message: 'Error al listar reportes' });
    }
  });

  // GET /:id — detalle de un reporte (público)
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const report = await getReportById(id);
    if (!report) {
      return reply.status(404).send({ error: 'NotFound', message: 'Reporte no encontrado' });
    }
    return reply.send({ data: report });
  });

  // POST / — crear reporte (auth requerido, multipart: photo + fields)
  app.post(
    '/',
    {
      preHandler: async (request, reply) => {
        const payload = await requireAuth(request, reply);
        if (!payload) return;
        (request as unknown as { auth: { userId: string; role: string } }).auth = payload;
      },
    },
    async (request, reply) => {
      const auth = (request as unknown as { auth: { userId: string; role: string } }).auth;
      if (!auth?.userId) return;
      const author = auth.role === 'citizen' ? { type: 'citizen' as const, id: auth.userId } : { type: 'user' as const, id: auth.userId };

      const fields: Record<string, string> = {};
      let fileBuf: Buffer | null = null;
      let fileMime = '';

      try {
        for await (const part of request.parts()) {
          if (part.type === 'field') {
            fields[part.fieldname] = part.value as string;
          } else if (part.type === 'file' && part.fieldname === 'photo') {
            fileBuf = await part.toBuffer();
            fileMime = part.mimetype;
          }
        }
      } catch (e) {
        request.log.error(e);
        return reply.status(400).send({ error: 'BadRequest', message: 'Error al procesar el formulario' });
      }

      if (!fileBuf || fileBuf.length === 0) {
        return reply.status(400).send({ error: 'BadRequest', message: 'Se requiere una foto' });
      }
      if (fileBuf.length > MAX_FILE_SIZE) {
        return reply.status(400).send({ error: 'BadRequest', message: 'La foto no debe superar 5 MB' });
      }
      if (!ALLOWED_TYPES.includes(fileMime)) {
        return reply.status(400).send({ error: 'BadRequest', message: 'Solo se permiten imágenes JPEG o PNG' });
      }

      const parsed = createReportSchema.safeParse({
        category: fields.category ?? undefined,
        description: fields.description ?? undefined,
        latitude: fields.latitude != null ? Number(fields.latitude) : undefined,
        longitude: fields.longitude != null ? Number(fields.longitude) : undefined,
        colonia: fields.colonia && fields.colonia.trim() ? fields.colonia.trim() : undefined,
      });
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'ValidationError',
          message: parsed.error.flatten().fieldErrors,
        });
      }

      const ext = fileMime === 'image/png' ? '.png' : '.jpg';
      ensureUploadDir();
      const filename = `${randomUUID()}${ext}`;
      const filepath = path.join(UPLOAD_DIR, filename);
      fs.writeFileSync(filepath, fileBuf);
      const photoUrl = `uploads/${filename}`;

      try {
        const report = await createReport(author, parsed.data, photoUrl);
        return reply.status(201).send({ data: report });
      } catch (e) {
        try {
          fs.unlinkSync(filepath);
        } catch {
          /* ignore */
        }
        request.log.error(e);
        return reply.status(500).send({ error: 'InternalError', message: 'Error al crear reporte' });
      }
    }
  );

  // POST /:id/vote — +1 Apoyar (auth requerido)
  app.post<{ Params: { id: string } }>(
    '/:id/vote',
    {
      preHandler: async (request, reply) => {
        const payload = await requireAuth(request, reply);
        if (!payload) return;
        (request as unknown as { auth: { userId: string; role: string } }).auth = payload;
      },
    },
    async (request, reply) => {
      const auth = (request as unknown as { auth: { userId: string; role: string } }).auth;
      if (!auth?.userId) return;
      const { id: reportId } = request.params;
      const author = auth.role === 'citizen' ? { type: 'citizen' as const, id: auth.userId } : { type: 'user' as const, id: auth.userId };

      try {
        const result = await voteReport(reportId, author);
        if (!result) {
          return reply.status(404).send({ error: 'NotFound', message: 'Reporte no encontrado' });
        }
        return reply.send({ data: result });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error al votar';
        if (msg.includes('Ya apoyaste') || msg.includes('Solo se puede votar')) {
          return reply.status(400).send({ error: 'BadRequest', message: msg });
        }
        request.log.error(e);
        return reply.status(500).send({ error: 'InternalError', message: msg });
      }
    }
  );
}
