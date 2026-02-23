import { NextResponse } from 'next/server';

const CDMX_URL = "https://www.aire.cdmx.gob.mx/default.php?opc=%27YqBhnmI=%27";

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const res = await fetch(CDMX_URL, {
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
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
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

    return NextResponse.json(
      {
        index: index ?? undefined,
        contaminante: contaminante ?? undefined,
        riesgo: riesgo ?? undefined,
        temperature: temperature ?? undefined,
        source: 'SEDEMA',
        alcaldia: 'Cuauhtémoc',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch {
    return NextResponse.json({
      index: undefined,
      contaminante: undefined,
      riesgo: undefined,
      temperature: undefined,
      source: 'SEDEMA',
      alcaldia: 'Cuauhtémoc',
    });
  }
}
