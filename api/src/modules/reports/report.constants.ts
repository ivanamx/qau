/**
 * Categorías de reportes ciudadanos (lista fija Fase 1).
 * En Fase 2 se puede migrar a tabla report_categories con semilla.
 */
export const REPORT_CATEGORIES = [
  { id: 'alumbrado', label: 'Alumbrado público' },
  { id: 'bache', label: 'Baches' },
  { id: 'limpieza', label: 'Limpieza y recolección' },
  { id: 'seguridad', label: 'Seguridad' },
  { id: 'espacios_publicos', label: 'Espacios públicos' },
  { id: 'arbolado', label: 'Arbolado y áreas verdes' },
  { id: 'drenaje', label: 'Drenaje' },
  { id: 'otro', label: 'Otro' },
] as const;

export const REPORT_CATEGORY_IDS = REPORT_CATEGORIES.map((c) => c.id);
