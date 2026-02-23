import type { FastifyInstance } from 'fastify';
import { prisma } from './shared/prisma.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { reportRoutes } from './modules/reports/report.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { businessRoutes } from './modules/businesses/business.routes.js';
import { offerRoutes } from './modules/businesses/offer.routes.js';

export async function registerRoutes(app: FastifyInstance) {
  app.get('/api/health', async () => {
    let database: 'connected' | 'unavailable' = 'unavailable';
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = 'connected';
    } catch {
      // Sin DATABASE_URL o DB no disponible: API sigue operativa para desarrollo
    }
    return { status: 'ok', timestamp: new Date().toISOString(), database };
  });

  // Calidad del aire: simular el POST del formulario (delegaciones=13 = Cuauhtémoc).
  // En servidores con OpenSSL estricto, SEDEMA falla con "dh key too small"; usamos proxy CORS como fallback.
  const CDMX_URL_POST = "https://www.aire.cdmx.gob.mx/default.php?opc=%27YqBhnmI=%27";
  const CDMX_URL_GET = CDMX_URL_POST + "&delegaciones=13";
  const PROXIES: ((url: string) => string)[] = [
    (url) => "https://corsproxy.io/?" + encodeURIComponent(url),
    (url) => "https://api.allorigins.win/raw?url=" + encodeURIComponent(url),
  ];

  app.get('/api/v1/air-quality', async (request, reply) => {
    async function fetchHtml(): Promise<string> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch(CDMX_URL_POST, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml',
            'Accept-Language': 'es-MX,es;q=0.9',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'delegaciones=13',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      } finally {
        clearTimeout(timeout);
      }
    }

    async function fetchHtmlViaProxy(proxyFn: (url: string) => string): Promise<string> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const proxyUrl = proxyFn(CDMX_URL_GET);
        const res = await fetch(proxyUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml',
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      } finally {
        clearTimeout(timeout);
      }
    }

    try {
      let html: string;
      try {
        html = await fetchHtml();
      } catch (directErr) {
        request.log.info({ err: directErr }, 'air-quality direct fetch failed, trying CORS proxy');
        let proxyHtml: string | null = null;
        for (const proxyFn of PROXIES) {
          try {
            proxyHtml = await fetchHtmlViaProxy(proxyFn);
            break;
          } catch (e) {
            request.log.warn({ err: e }, 'air-quality proxy fetch failed');
          }
        }
        if (proxyHtml === null) throw new Error('All air-quality proxies failed');
        html = proxyHtml;
      }
      const rawHtml = html.replace(/\s+/g, ' ');

      const lateralStart = html.search(/id=["']lateral_renglondosdatoscalidadaireahora["']/i);
      const lateralFragment =
        lateralStart >= 0 ? html.slice(lateralStart, lateralStart + 2500) : '';

      let index: string | null = null;
      const exactMatch = html.match(
        /lateral_renglondosdatoscalidadaireahora["'][^>]*>[\s\S]*?<strong>[^<]*[IÍ]ndice[^<]*<\/strong>\s*<br\s*\/?>\s*<strong>([^<]+)<\/strong>/i
      );
      if (exactMatch?.[1]) {
        index = exactMatch[1].trim();
      } else if (lateralFragment) {
        const strongs = lateralFragment.match(/<strong>([^<]*)<\/strong>/g);
        if (strongs && strongs.length >= 2) {
          const value = strongs[1].replace(/<\/?strong>/gi, '').trim();
          if (value && value !== 'Índice AIRE Y SALUD:' && !value.startsWith('Recomendaciones') && !value.startsWith('-')) index = value;
        }
      }

      const contaminanteMatch = lateralFragment.match(/Contaminante\(s\):\s*([^<\n]+)/i);
      const riesgoMatch = lateralFragment.match(/Riesgo:\s*([^<\n]+)/i);
      const contaminante = contaminanteMatch
        ? contaminanteMatch[1].trim().replace(/<[^>]+>/g, '')
        : null;
      const riesgo = riesgoMatch
        ? riesgoMatch[1].trim().replace(/<[^>]+>/g, '')
        : null;

      // Temperatura: "28 °C" o "28&deg;C" en la página
      let temperature: number | null = null;
      const tempPatterns = [
        /(\d{1,2})\s*°\s*C/i,
        /(\d{1,2})\s*&deg;\s*C/i,
        /temperatura[^0-9]*(\d{1,2})/i,
        /(\d{1,2})\s*°C/,
      ];
      for (const re of tempPatterns) {
        const m = rawHtml.match(re);
        if (m && parseInt(m[1], 10) >= 0 && parseInt(m[1], 10) <= 50) {
          temperature = parseInt(m[1], 10);
          break;
        }
      }

      return {
        index: index ?? undefined,
        contaminante: contaminante ?? undefined,
        riesgo: riesgo ?? undefined,
        temperature: temperature ?? undefined,
        source: 'SEDEMA',
        alcaldia: 'Cuauhtémoc',
      };
    } catch (err) {
      request.log.warn({ err }, 'air-quality fetch failed (SEDEMA no disponible)');
      // 200 con datos vacíos: la UI muestra "--" sin 502 ni fallback a proxy CORS (evita 403)
      return reply.code(200).send({
        source: 'SEDEMA',
        alcaldia: 'Cuauhtémoc',
      });
    }
  });

  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(reportRoutes, { prefix: '/api/v1/reports' });
  await app.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });
  await app.register(businessRoutes, { prefix: '/api/v1/businesses' });
  await app.register(offerRoutes, { prefix: '/api/v1/offers' });
}
