function extractIndexFromLateral(html: string): string | null {
  // Estructura exacta en la página: <div id="lateral_renglondosdatoscalidadaireahora"><strong>Índice AIRE Y SALUD:</strong><br><strong>ACEPTABLE</strong>
  const exact = html.match(
    /lateral_renglondosdatoscalidadaireahora["'][^>]*>[\s\S]*?<strong>[^<]*[IÍ]ndice[^<]*<\/strong>\s*<br\s*\/?>\s*<strong>([^<]+)<\/strong>/i
  );
  if (exact && exact[1]) {
    const v = exact[1].trim();
    if (v) return v;
  }
  // Respaldo: mismo div, segundo <strong>
  const start = html.indexOf('lateral_renglondosdatoscalidadaireahora');
  if (start < 0) return null;
  const fragment = html.slice(start, start + 1500);
  const strongs = fragment.match(/<strong>([^<]*)<\/strong>/g);
  if (strongs && strongs.length >= 2) {
    const value = strongs[1].replace(/<\/?strong>/gi, '').trim();
    if (value && value !== 'Índice AIRE Y SALUD:' && !value.startsWith('Recomendaciones') && !value.startsWith('-')) return value;
  }
  return null;
}

export function parseAirQualityFromHtml(html: string): {
  index: string | null;
  temperature: number | null;
} {
  const rawHtml = html.replace(/\s+/g, ' ');
  const index = extractIndexFromLateral(html);

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

  return { index, temperature };
}

// Página alcaldía (opc=...). El dropdown envía delegaciones=13 para Cuauhtémoc; sin eso no viene la card.
const CDMX_URL = "https://www.aire.cdmx.gob.mx/default.php?opc=%27YqBhnmI=%27&delegaciones=13";

async function fetchWithProxy(url: string, controller: AbortController): Promise<string> {
  // corsproxy.io: suele aceptar bien URLs largas (evita 400 de otros proxies)
  const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(url);
  const res = await fetch(proxyUrl, { signal: controller.signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/**
 * Obtiene calidad del aire y temperatura desde el navegador (vía proxy CORS).
 * Útil cuando el servidor no puede conectar a SEDEMA.
 */
export async function fetchAirQualityFromBrowser(): Promise<{
  index: string | null;
  temperature: number | null;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const html = await fetchWithProxy(CDMX_URL, controller);
    clearTimeout(timeout);
    return parseAirQualityFromHtml(html);
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}
