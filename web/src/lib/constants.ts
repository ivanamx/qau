export const REPORT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CHANNELED: 'Canalizado',
  IN_PROGRESS: 'En proceso',
  RESOLVED: 'Resuelto',
};

export const REPORT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'var(--status-pending)',
  CHANNELED: 'var(--status-validated)',
  IN_PROGRESS: 'var(--status-validated)',
  RESOLVED: 'var(--status-resolved)',
};

/** Relleno (más claro) y borde (más oscuro) para marcadores del mapa */
export const REPORT_STATUS_MARKER_FILL: Record<string, string> = {
  PENDING: 'var(--map-fill-pending)',
  CHANNELED: 'var(--map-fill-validated)',
  IN_PROGRESS: 'var(--map-fill-validated)',
  RESOLVED: 'var(--map-fill-resolved)',
};
export const REPORT_STATUS_MARKER_BORDER: Record<string, string> = {
  PENDING: 'var(--map-border-pending)',
  CHANNELED: 'var(--map-border-validated)',
  IN_PROGRESS: 'var(--map-border-validated)',
  RESOLVED: 'var(--map-border-resolved)',
};

/** Centro aproximado Alcaldía Cuauhtémoc, CDMX. Lat un poco al norte para que la alcaldía quede “centrada pero abajo” (no detrás de la barra de filtros) */
export const MAP_CENTER: [number, number] = [19.4726, -99.1332];
export const MAP_ZOOM = 13;

/** Desplazar centro del mapa para que la delegación quede a la izquierda (espacio libre). Más valor = delegación más a la izq. */
const MAP_VIEW_OFFSET = { east: 0.018, south: 0.03 };
export const MAP_CENTER_VIEW: [number, number] = [
  MAP_CENTER[0] - MAP_VIEW_OFFSET.south,
  MAP_CENTER[1] + MAP_VIEW_OFFSET.east,
];

/** Solo móvil: centro para que la delegación se vea centrada (subir = centro al sur; derecha = centro al oeste). */
const MAP_VIEW_OFFSET_MOBILE = { south: 0.035, west: 0.02 };
export const MAP_CENTER_VIEW_MOBILE: [number, number] = [
  MAP_CENTER[0] - MAP_VIEW_OFFSET_MOBILE.south,
  MAP_CENTER[1] - MAP_VIEW_OFFSET_MOBILE.west,
];

export const CATEGORY_LABELS: Record<string, string> = {
  alumbrado: 'Alumbrado público',
  bache: 'Baches',
  limpieza: 'Limpieza y recolección',
  seguridad: 'Seguridad',
  espacios_publicos: 'Espacios públicos',
  arbolado: 'Arbolado y áreas verdes',
  drenaje: 'Drenaje',
  otro: 'Otro',
};

export const DASHBOARD_ROLE_LABELS: Record<string, string> = {
  superadmin: 'Alcaldesa / Superusuario',
  admin: 'Directores / Alto nivel',
  operator: 'Equipo operativo',
};
