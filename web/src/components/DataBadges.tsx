'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { fetchAirQuality } from '@/lib/api';
import { fetchAirQualityFromBrowser } from '@/lib/airQuality';

/** Color del indicador circular según nivel SEDEMA (Índice Aire y Salud) */
function airQualityColor(index: string | null): string {
  if (!index) return 'bg-gray-400';
  const u = index.toUpperCase();
  if (u === 'BUENA') return 'bg-green-500';
  if (u === 'ACEPTABLE') return 'bg-yellow-500';
  if (u === 'MALA') return 'bg-orange-500';
  if (u === 'MUY MALA') return 'bg-red-500';
  if (u === 'EXTREMADAMENTE MALA') return 'bg-purple-600';
  if (u === 'SIN DATOS') return 'bg-gray-400';
  return 'bg-gray-400';
}

/**
 * Badges: fecha/hora, temperatura, calidad del aire (Cuauhtémoc, SEDEMA), contingencia.
 * Primero intenta la API (servidor); si no hay datos, intenta desde el navegador vía proxy CORS.
 */
export default function DataBadges() {
  const now = new Date();
  const [temperature, setTemperature] = useState<number | null>(null);
  const [airQuality, setAirQuality] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const contingency = false;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const apply = (index: string | null, temp: number | null) => {
      if (cancelled) return;
      if (index) setAirQuality(index);
      if (temp != null) setTemperature(temp);
    };

    fetchAirQuality()
      .then((data) => {
        if (cancelled) return;
        const hasData = data.index || data.temperature != null;
        if (hasData) {
          apply(data.index ?? null, data.temperature ?? null);
          return;
        }
        // Sin datos del servidor: intentar desde el navegador (proxy CORS)
        return fetchAirQualityFromBrowser()
          .then(({ index, temperature: t }) => apply(index, t))
          .catch(() => {
            if (!cancelled) {
              setAirQuality(null);
              setTemperature(null);
            }
          });
      })
      .catch(() =>
        fetchAirQualityFromBrowser()
          .then(({ index, temperature: t }) => apply(index, t))
          .catch(() => {
            if (!cancelled) {
              setAirQuality(null);
              setTemperature(null);
            }
          })
      )
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:pb-0">
      <span className="flex items-center gap-1 shrink-0 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-[var(--counter-bg)] border border-[var(--border)] text-[var(--text-secondary)]">
        <span>{format(now, "d MMM yyyy, HH:mm", { locale: es })}</span>
      </span>
      <span className="flex items-center gap-1 shrink-0 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-[var(--counter-bg)] border border-[var(--border)] text-[var(--text-secondary)]">
        <span aria-hidden>🌡</span>
        <span>{loading ? '…' : (temperature != null ? `${temperature}` : '--')}°C</span>
      </span>
      <span className="flex items-center gap-1 shrink-0 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-[var(--counter-bg)] border border-[var(--border)] text-[var(--text-secondary)]">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${airQualityColor(airQuality)}`}
          aria-hidden
        />
        <span>Calidad del aire: {loading ? '…' : (airQuality ?? '--')}</span>
      </span>
      {contingency && (
        <span className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-400 font-medium">
          Contingencia ambiental
        </span>
      )}
    </div>
  );
}
