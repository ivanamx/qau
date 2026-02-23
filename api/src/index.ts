import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { config } from './shared/config.js';
import { registerRoutes } from './routes.js';

const app = Fastify({ logger: true });
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

async function start() {
  await app.register(cors, { origin: config.corsOrigin });
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });
  await app.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/uploads/',
    decorateReply: false,
  });
  await registerRoutes(app);

  try {
    await app.listen({ port: config.port, host: config.host });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
