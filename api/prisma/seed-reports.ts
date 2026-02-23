/**
 * Seed de reportes mock para presentar la plataforma.
 * - Fechas: 2 feb 2026 — 20 feb 2026 (hasta 16:00)
 * - Status "PENDING" solo en 19 y 20 feb; el resto mayormente RESOLVED
 * - Ubicaciones DENTRO del polígono de la alcaldía (GeoJSON), dispersas
 *
 * Ejecutar: npm run db:seed-reports  (desde carpeta api)
 */
import { Prisma, PrismaClient, ReportStatus } from '../generated/prisma-client/index.js';
import path from 'path';
import fs from 'fs';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

const prisma = new PrismaClient();

const CATEGORIES = [
  'alumbrado',
  'bache',
  'limpieza',
  'seguridad',
  'espacios_publicos',
  'arbolado',
  'drenaje',
  'otro',
] as const;

// Colonias de referencia: asignamos a cada punto la colonia más cercana (dentro del polígono)
const COLONIAS_REF: { lat: number; lng: number; colonia: string }[] = [
  { lat: 19.4326, lng: -99.1332, colonia: 'Centro' },
  { lat: 19.4194, lng: -99.1611, colonia: 'Roma Norte' },
  { lat: 19.415, lng: -99.162, colonia: 'Roma Sur' },
  { lat: 19.411, lng: -99.171, colonia: 'Condesa' },
  { lat: 19.434, lng: -99.147, colonia: 'Juárez' },
  { lat: 19.438, lng: -99.142, colonia: 'Cuauhtémoc' },
  { lat: 19.444, lng: -99.152, colonia: 'San Rafael' },
  { lat: 19.441, lng: -99.148, colonia: 'Tabacalera' },
  { lat: 19.428, lng: -99.138, colonia: 'Hipódromo' },
  { lat: 19.422, lng: -99.155, colonia: 'Doctores' },
  { lat: 19.436, lng: -99.141, colonia: 'Buenavista' },
  { lat: 19.426, lng: -99.165, colonia: 'Escandón' },
  { lat: 19.418, lng: -99.158, colonia: 'Del Valle Norte' },
  { lat: 19.431, lng: -99.135, colonia: 'Juárez Norte' },
  { lat: 19.447, lng: -99.145, colonia: 'Peralvillo' },
];

function dist2(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  return (a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2;
}

function coloniaMasCercana(lat: number, lng: number): string {
  let best = COLONIAS_REF[0];
  let bestD = dist2({ lat, lng }, best);
  for (let i = 1; i < COLONIAS_REF.length; i++) {
    const d = dist2({ lat, lng }, COLONIAS_REF[i]);
    if (d < bestD) {
      bestD = d;
      best = COLONIAS_REF[i];
    }
  }
  return best.colonia;
}

/** Punto [lng, lat] dentro del multipolígono usando Turf (mismo criterio que el frontend). */
function pointInAlcaldiaGeoJSON(lng: number, lat: number, coords: number[][][][]): boolean {
  const feature = {
    type: 'Feature' as const,
    geometry: { type: 'MultiPolygon' as const, coordinates: coords },
    properties: {},
  };
  return booleanPointInPolygon([lng, lat], feature);
}

function loadAlcaldiaGeoJSON(): { bbox: { latMin: number; latMax: number; lngMin: number; lngMax: number }; coords: number[][][][] } | null {
  const ruta = path.join(process.cwd(), '..', 'web', 'public', 'geojson', 'alcaldia-cuauhtemoc.json');
  if (!fs.existsSync(ruta)) return null;
  const data = JSON.parse(fs.readFileSync(ruta, 'utf-8'));
  const feature = data?.features?.[0];
  if (!feature?.geometry || feature.geometry.type !== 'MultiPolygon') return null;
  const coords = feature.geometry.coordinates as number[][][][];
  let latMin = Infinity, latMax = -Infinity, lngMin = Infinity, lngMax = -Infinity;
  for (const poly of coords) {
    for (const ring of poly) {
      for (const p of ring) {
        const lng = p[0];
        const lat = p[1];
        lngMin = Math.min(lngMin, lng);
        lngMax = Math.max(lngMax, lng);
        latMin = Math.min(latMin, lat);
        latMax = Math.max(latMax, lat);
      }
    }
  }
  return { bbox: { latMin, latMax, lngMin, lngMax }, coords };
}

/** 55 puntos DENTRO del polígono de la alcaldía (GeoJSON), dispersos. */
function buildUbicacionesDentroAlcaldia(total: number): { lat: number; lng: number; colonia: string }[] {
  const geo = loadAlcaldiaGeoJSON();
  if (!geo) {
    console.warn('GeoJSON alcaldía no encontrado; se usa bbox por defecto.');
    const bbox = { latMin: 19.41, latMax: 19.465, lngMin: -99.17, lngMax: -99.125 };
    const out: { lat: number; lng: number; colonia: string }[] = [];
    const seen = new Set<string>();
    while (out.length < total) {
      const lat = bbox.latMin + Math.random() * (bbox.latMax - bbox.latMin);
      const lng = bbox.lngMin + Math.random() * (bbox.lngMax - bbox.lngMin);
      const key = `${lat.toFixed(5)}_${lng.toFixed(5)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ lat, lng, colonia: coloniaMasCercana(lat, lng) });
    }
    return out;
  }
  const { bbox, coords } = geo;
  const out: { lat: number; lng: number; colonia: string }[] = [];
  const seen = new Set<string>();
  let intentos = 0;
  const maxIntentos = total * 200;
  while (out.length < total && intentos < maxIntentos) {
    intentos++;
    const lat = bbox.latMin + Math.random() * (bbox.latMax - bbox.latMin);
    const lng = bbox.lngMin + Math.random() * (bbox.lngMax - bbox.lngMin);
    if (!pointInAlcaldiaGeoJSON(lng, lat, coords)) continue;
    const key = `${lat.toFixed(5)}_${lng.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ lat, lng, colonia: coloniaMasCercana(lat, lng) });
  }
  if (out.length < total) {
    console.warn(`Solo ${out.length}/${total} puntos dentro del polígono; rellenando con puntos en bbox.`);
    while (out.length < total) {
      const lat = bbox.latMin + Math.random() * (bbox.latMax - bbox.latMin);
      const lng = bbox.lngMin + Math.random() * (bbox.lngMax - bbox.lngMin);
      const key = `${lat.toFixed(5)}_${lng.toFixed(5)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ lat, lng, colonia: coloniaMasCercana(lat, lng) });
    }
  }
  return out;
}

// Variantes por categoría (cada una se usa como máximo una vez en el seed)
const DESCRIPCIONES_POR_CATEGORIA: Record<string, string[]> = {
  alumbrado: [
    'Lámpara fundida en esquina, zona oscura por las noches.',
    'Poste sin luz desde hace varios días.',
    'Foco parpadeando en andador peatonal.',
    'Luminaria dañada a la altura del número 45.',
    'Foco quemado en cruce peatonal, riesgo por la noche.',
    'Poste con cable suelto y luz intermitente.',
    'Falta de alumbrado en tramo de dos cuadras.',
    'Lámpara rota en parque, vidrios en el piso.',
  ],
  bache: [
    'Bache profundo en calle principal, riesgo para vehículos.',
    'Varios baches en esquina, ya hubo un accidente menor.',
    'Hundimiento en carril derecho.',
    'Bache con agua estancada después de lluvia.',
    'Grieta grande que se está convirtiendo en bache.',
    'Hoyo frente a escuela, peligro para peatones.',
    'Baches consecutivos en avenida, sin señalización.',
    'Hundimiento en banqueta junto a alcantarilla.',
  ],
  limpieza: [
    'Basura acumulada en contenedor desbordado.',
    'Desperdicios en vía pública sin recoger.',
    'Papeleras llenas en parque.',
    'Contenedor roto, residuos esparcidos.',
    'Basura en esquina desde hace una semana.',
    'Monto de escombro abandonado en vialidad.',
    'Lotes con maleza y desechos en zona común.',
    'Recolección no pasó, bolsas en la calle.',
  ],
  seguridad: [
    'Foco roto en pasillo, pide mayor iluminación.',
    'Reporte de actitud sospechosa en horario nocturno.',
    'Solicitud de mayor patrullaje en la colonia.',
    'Vereda oscura junto a estacionamiento.',
    'Vecinos reportan ruidos y desconocidos de noche.',
    'Punto ciego en cruce, pedir refuerzo de vigilancia.',
    'Reclamo por venta ambulante en horario no permitido.',
    'Solicitud de cámara o botón de pánico en esquina.',
  ],
  espacios_publicos: [
    'Banca dañada en plaza, no hay donde sentarse.',
    'Juegos infantiles con piezas rotas.',
    'Piso resbaladizo en andador después de lluvia.',
    'Mesa de concreto partida en área verde.',
    'Columpio con cadena rota, riesgo para niños.',
    'Pintura desprendida en kiosco del parque.',
    'Bebedero sin agua y con fuga.',
    'Rampa de accesibilidad con desnivel.',
  ],
  arbolado: [
    'Rama caída sobre banqueta, obstruye paso.',
    'Árbol inclinado que podría caer.',
    'Solicitud de poda en área verde.',
    'Ramas tocando cables de luz.',
    'Árbol con plaga, hojas secas y riesgo.',
    'Raíces levantando la banqueta.',
    'Tocón sin retirar tras derribo de árbol.',
    'Poda urgente por ramas sobre cochera.',
  ],
  drenaje: [
    'Coladera tapada, se encharca en lluvia.',
    'Filtración en tubería visible en calle.',
    'Mal olor por drenaje obstruido.',
    'Agua negra saliendo por registro.',
    'Atarjea sin tapa, riesgo para peatones.',
    'Tubería rota bajo la banqueta.',
    'Inundación recurrente en esquina.',
    'Registro colapsado y desnivel.',
  ],
  otro: [
    'Grafiti en muro de edificio histórico.',
    'Animal abandonado en zona de parque.',
    'Mobiliario urbano vandalizado.',
    'Señalética de tránsito doblada.',
    'Puesto semifijo obstruyendo paso peatonal.',
    'Ruido excesivo por obra en horario no permitido.',
    'Cableado colgando a altura de personas.',
    'Reclamo por falta de mantenimiento en espacio común.',
  ],
};

const PHOTO_PLACEHOLDER = 'uploads/pendiente.jpg';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Fecha aleatoria entre inicio y fin (fin inclusive) */
function randomDate(start: Date, end: Date): Date {
  const startMs = start.getTime();
  const endMs = end.getTime();
  const ms = startMs + Math.random() * (endMs - startMs);
  return new Date(ms);
}

/** Hora aleatoria en un día (YYYY-MM-DD), entre las 06:00 y las 16:00 (zona local como UTC para simplicidad) */
function randomTimeOnDay(day: string, endHour = 16): Date {
  const start = new Date(`${day}T06:00:00.000Z`).getTime();
  const end = new Date(`${day}T${String(endHour).padStart(2, '0')}:00:00.000Z`).getTime();
  return new Date(start + Math.random() * (end - start));
}

async function main() {
  const citizen = await prisma.citizen.findFirst();
  const citizenId = citizen?.id ?? null;

  // Borrar reportes existentes para no duplicar (el seed deja siempre exactamente 55)
  const deleted = await prisma.report.deleteMany({});
  if (deleted.count > 0) {
    console.log(`Seed reportes: ${deleted.count} reportes anteriores eliminados.`);
  }

  const inicio = new Date('2026-02-02T00:00:00.000Z');
  const finAntesDeAyer = new Date('2026-02-18T23:59:59.999Z');
  const soloPendienteDesde = new Date('2026-02-19T00:00:00.000Z');

  const total = 55;
  const countHoy = 12;      // 20 feb 2026 (siempre hay reportes de hoy)
  const countAyer = 8;      // 19 feb 2026
  const countResto = total - countHoy - countAyer;

  // Fechas: primero hoy, luego ayer, luego resto entre 2 y 18 feb
  const fechas: Date[] = [];
  for (let i = 0; i < countHoy; i++) {
    fechas.push(randomTimeOnDay('2026-02-20', 16));
  }
  const inicioAyer = new Date('2026-02-19T06:00:00.000Z');
  const finAyer = new Date('2026-02-19T23:59:59.999Z');
  for (let i = 0; i < countAyer; i++) {
    fechas.push(randomDate(inicioAyer, finAyer));
  }
  for (let i = 0; i < countResto; i++) {
    fechas.push(randomDate(inicio, finAntesDeAyer));
  }

  // Pool en orden fijo (igual que IMAGENES-REPORTES.md): reporte-01.jpg … reporte-55.jpg
  const pool: { category: string; description: string }[] = [];
  for (const cat of CATEGORIES) {
    const descs = DESCRIPCIONES_POR_CATEGORIA[cat] ?? DESCRIPCIONES_POR_CATEGORIA.otro;
    for (const desc of descs) pool.push({ category: cat, description: desc });
  }
  const poolFijo = pool.slice(0, total);
  const ubicacionesDispersas = buildUbicacionesDentroAlcaldia(total);

  const reports: Parameters<typeof prisma.report.create>[0]['data'][] = [];

  for (let i = 0; i < total; i++) {
    const { category, description } = poolFijo[i];
    const createdAt = fechas[i];
    const loc = ubicacionesDispersas[i];
    const photoUrl = `uploads/reporte-${String(i + 1).padStart(2, '0')}.jpg`;

    let status: ReportStatus;
    if (createdAt >= soloPendienteDesde) {
      // 19 o 20 feb: ~35% PENDING, resto repartido
      const r = Math.random();
      if (r < 0.35) status = ReportStatus.PENDING;
      else if (r < 0.55) status = ReportStatus.RESOLVED;
      else if (r < 0.8) status = ReportStatus.IN_PROGRESS;
      else status = ReportStatus.CHANNELED;
    } else {
      // Antes del 19: nunca PENDING; mayoría RESOLVED
      const r = Math.random();
      if (r < 0.75) status = ReportStatus.RESOLVED;
      else if (r < 0.9) status = ReportStatus.IN_PROGRESS;
      else status = ReportStatus.CHANNELED;
    }

    reports.push({
      citizenId,
      category,
      description,
      photoUrl,
      latitude: loc.lat,
      longitude: loc.lng,
      colonia: loc.colonia,
      status,
      createdAt,
      updatedAt: createdAt,
    });
  }

  // Ordenar por createdAt para inserts estables (opcional)
  reports.sort((a, b) => (a.createdAt as Date).getTime() - (b.createdAt as Date).getTime());

  for (const r of reports) {
    await prisma.report.create({
      data: {
        ...r,
        latitude: new Prisma.Decimal(r.latitude as number),
        longitude: new Prisma.Decimal(r.longitude as number),
      },
    });
  }

  console.log(`Seed reportes: ${total} reportes mock creados (2 feb - 20 feb 2026, 16:00).`);
  console.log('Fotos: placeholder "uploads/pendiente.jpg". Puedes sustituirlas manualmente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
