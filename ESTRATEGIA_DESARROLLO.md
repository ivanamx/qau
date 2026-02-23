# Estrategia de Desarrollo e Implementación
## Plataforma Ciudadana y Marketplace Local – Alcaldía Cuauhtémoc

---

## 1. Principios y Criterios

| Principio | Criterio |
|-----------|----------|
| **Modularidad** | Cada módulo (reportes, marketplace, dashboard) debe poder desplegarse y probarse de forma independiente. |
| **Escalabilidad** | Diseño que permita añadir alcaldías o módulos sin reescribir el core. |
| **Seguridad primero** | Auth, validación y auditoría desde el día uno. |
| **MVP iterativo** | Entregas pequeñas y funcionales; prioridad al flujo ciudadano de reportes. |
| **Datos públicos** | APIs y modelos pensados para transparencia y posibles integraciones externas. |

---

## 2. Estructura del Repositorio

```
qau/
├── apps/
│   ├── api/                    # Backend Node.js + TypeScript
│   │   ├── src/
│   │   │   ├── modules/        # Por dominio (reports, auth, businesses, offers…)
│   │   │   ├── shared/         # Middlewares, utils, config
│   │   │   └── prisma/
│   │   ├── prisma/
│   │   └── package.json
│   └── web/                    # Frontend Next.js (ciudadano + mapa)
├── apps/
│   └── dashboard/              # App separada o rutas /dashboard en web (decidir en Fase 1)
├── packages/
│   ├── db/                     # Prisma schema y client compartido (monorepo)
│   ├── types/                  # Tipos TS compartidos
│   └── ui/                     # (Opcional) Componentes compartidos
├── docs/                       # API, decisiones de arquitectura
├── scripts/                    # Seeds, migraciones, jobs
├── .env.example
├── readme.md
└── ESTRATEGIA_DESARROLLO.md    # Este documento
```

**Decisión inicial:** Empezar con **monorepo simple** (carpetas `api/` y `web/` en raíz) para reducir complejidad. Si crece, migrar a estructura tipo Turborepo/Nx.

---

## 3. Stack Técnico Confirmado

| Capa | Tecnología | Notas |
|------|------------|--------|
| **Backend** | Node.js 20 LTS, TypeScript, Fastify | Fastify por rendimiento y tipado. |
| **ORM** | Prisma | Migraciones, tipos generados, fácil de leer. |
| **Base de datos** | PostgreSQL 15+ | Hosted: Supabase, Neon o VPS. |
| **Auth** | JWT (access + refresh), opcionalmente cookies httpOnly | Sin OAuth en MVP. |
| **Frontend** | Next.js 14 (App Router), React, TypeScript | SSR/SSG donde aplique. |
| **Mapas** | Google Maps JavaScript API + Places API | Keys por entorno. |
| **Cache (Fase 2)** | Redis o Upstash | Para Places y rate limiting. |
| **Archivos** | Almacenamiento local o S3-compatible (MinIO/R2) | Fotos de reportes y ofertas. |
| **Validación** | Zod | En API y en formularios (compartir schemas). |

---

## 4. Modelo de Datos (Fase 1 + preparación Fase 2)

### 4.1 Entidades principales

- **users**  
  - id, email, phone, password_hash, role_id, colonia, verified_at, created_at, updated_at.  
  - Relación con `roles`.

- **roles**  
  - id, name (superadmin, admin, operator, citizen), description.

- **reports**  
  - id, user_id, category, description, photo_url, latitude, longitude, status, created_at, updated_at.  
  - Índices: status, category, created_at, (latitude, longitude) para mapas.

- **report_votes**  
  - id, report_id, user_id, created_at.  
  - UNIQUE(report_id, user_id) para evitar duplicados.

- **report_status_history**  
  - id, report_id, from_status, to_status, changed_by_id, comment, created_at.  
  - Para auditoría y timeline en dashboard.

- **businesses** (Fase 2, preparar tabla)  
  - id, place_id (unique), name, address, rating, category, photo_url, raw_json (opcional), cached_at.  
  - Índices: place_id, category, cached_at.

- **offers** (Fase 2)  
  - id, business_id, title, description, image_url, valid_from, valid_until, conditions, created_at.

- **notifications** (Fase 2+)  
  - id, user_id, type, payload (jsonb), read_at, created_at.

### 4.2 Convenciones

- IDs: UUID v4 para todas las tablas principales.  
- Timestamps: `created_at`, `updated_at` en todas.  
- Soft delete: solo donde se requiera (ej. usuarios); reportes no se borran, se rechazan.  
- Nombres en inglés en DB y código; textos al usuario en español.

---

## 5. API REST – Diseño de Alto Nivel

- **Base:** `/api/v1`.  
- **Auth:** Header `Authorization: Bearer <access_token>`. Refresh en `POST /api/v1/auth/refresh`.  
- **Paginación:** `limit` + `cursor` o `offset` (estándar en listados).  
- **Filtros:** Query params (ej. `?status=pending&category=alumbrado&since=2025-01-01`).  
- **Respuestas:** JSON; formato estándar `{ data, meta?, error? }`.  
- **Códigos:** 200, 201, 400, 401, 403, 404, 429, 500.

### Endpoints Fase 1 (MVP Reportes)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | /auth/register | Registro (email/phone + contraseña) | No |
| POST | /auth/login | Login, devuelve access + refresh | No |
| POST | /auth/refresh | Refrescar access token | Refresh |
| GET  | /reports | Listar reportes (filtros, paginación) | Opcional |
| GET  | /reports/:id | Detalle de un reporte | No |
| POST | /reports | Crear reporte (foto, geolocalización) | Sí |
| POST | /reports/:id/vote | +1 Apoyar reporte | Sí |
| GET  | /reports/categories | Listar categorías | No |
| GET  | /dashboard/reports | Listado para dashboard (filtros avanzados) | Admin/Operator |
| PATCH| /dashboard/reports/:id | Cambiar estado, validar, rechazar | Admin/Operator |
| GET  | /dashboard/stats | Métricas (por categoría, tiempo, votos) | Admin/Operator |

### Fase 2 (Marketplace)

- `GET/POST /businesses` (sync con Places, cache).  
- `GET /businesses/:id/offers`, `POST /offers`, `PATCH /offers/:id`.  
- Endpoints públicos para mapa y ofertas activas.

---

## 6. Frontend – Arquitectura

- **Framework:** Next.js 14 (App Router).  
- **Rutas:**  
  - `/` → Mapa + lista de reportes (pública).  
  - `/reportar` → Formulario crear reporte (auth).  
  - `/reportes/[id]` → Modal o página de detalle (pública).  
  - `/dashboard` → Solo roles alcaldía (layout protegido).  
- **Estado:** React Query (TanStack Query) para servidor; Zustand o contexto ligero para UI (filtros, mapa).  
- **Mapa:** Un solo componente contenedor (Google Maps); capas: pins de reportes, filtros por categoría/estado.  
- **Forms:** React Hook Form + Zod (reutilizar schemas del backend).  
- **UI:** Tailwind CSS; componentes base (botones, inputs, modales) consistentes.  
- **i18n:** Español por defecto; claves de texto en un solo lugar para futura traducción.

---

## 7. Seguridad

- Contraseñas: bcrypt (cost 12).  
- JWT: access 15 min, refresh 7 días; refresh en DB o allowlist para revocación.  
- Rate limiting: por IP en login/register; por usuario en creación de reportes y votos.  
- Límite de votos: 1 por usuario por reporte (constraint en DB + validación en API).  
- Subida de fotos: tipos permitidos (JPEG/PNG), tamaño máximo (ej. 5 MB), escaneo básico si se usa servicio externo.  
- Inputs: validación con Zod; escape en salida si se renderiza HTML.  
- Dashboard: verificación de rol en cada endpoint y en middleware de rutas.  
- Logs: registrar acciones sensibles (cambio de estado, rechazo, acceso dashboard).

---

## 8. Plan de Implementación por Fases

### Fase 0 – Preparación (Semana 0)

- [x] **Paso 0.1** – Inicializar repositorio: estructura de carpetas `api/` y `web/`. Configurar backend: Fastify, TypeScript, variables de entorno (`.env.example`). Health check `GET /api/health` operativo. *(Completado)*  
- [x] **Paso 0.2** – Definir esquema Prisma: `users`, `roles`, `reports`, `report_votes`, `report_status_history`; migración `20250219193600_init`; seed de roles; cliente Prisma en `shared/prisma.ts`. *(Completado)*  
- [x] **Paso 0.3** – Configurar Next.js (carpeta `web/`): TypeScript, Tailwind, ESLint, estructura de rutas (`/`, `/reportar`, `/reportes/[id]`, `/dashboard`). *(Completado)*  
- [x] **Paso 0.4** – Documentar cómo levantar API y web en local: `CONTRIBUTING.md` con pasos y verificación Fase 0. *(Completado)*

### Fase 1 – MVP Reportes Ciudadanos (Semanas 1–3)

**Backend**  
- [x] **1. Auth:** registro (`POST /api/v1/auth/register`), login (`POST /api/v1/auth/login`), refresh (`POST /api/v1/auth/refresh`); middleware `requireAuth` y `requireRoles`; tabla `RefreshToken`; JWT access 15 min, refresh 7 días. *(Completado)*  
- [x] **2. CRUD reportes:** `GET /api/v1/reports` (filtros status, category, since, limit, offset), `GET /api/v1/reports/:id`, `POST /api/v1/reports` (multipart: photo + category, description, latitude, longitude). *(Completado)*  
- [x] **3. Votación:** `POST /api/v1/reports/:id/vote` con validación de duplicado y solo reportes pendientes. *(Completado)*  
- [x] **4. Categorías:** `GET /api/v1/reports/categories` (lista fija en `report.constants.ts`). *(Completado)*  
- [x] **5. Endpoints dashboard:** `GET /api/v1/dashboard/reports` (filtros + orderBy), `PATCH /api/v1/dashboard/reports/:id` (status, comment; historial), `GET /api/v1/dashboard/reports/:id/history`. *(Completado)*  
- [x] **6. Métricas básicas:** `GET /api/v1/dashboard/stats` (byStatus, byCategory, topVoted, total). *(Completado)*

**Frontend (vista ciudadano)**  
- [x] Página principal: mapa Leaflet (dark, sin etiquetas/zoom), marcadores circulares, popup al clic; columna sobre mapa (Live 12h / Historial), filtros sincronizados.  
- [x] Modal de detalle al clic en pin: categoría, fecha, descripción, foto, estado, votos, botón “+1 Apoyar”.  
- [x] Modal Crear reporte “Crear reporte”: categoría, descripción, foto, elegir ubicación en mapa; Reportar con tooltip para no registrados.  
- [x] Dashboard web por roles: estadísticas, tabla, canalizar, acceso al mapa principal.

**Entregable:** Un ciudadano puede reportar, ver reportes en mapa, votar; un operador puede cambiar estados y ver métricas básicas.

### Fase 2 – Marketplace Local (Semanas 4–5) ✅

1. [x] Tablas `businesses` y `offers`; relaciones con Prisma; migración `20250220120000_add_businesses_offers`.  
2. [x] Integración Google Places API (searchNearby): zona Cuauhtémoc, guardado en DB como cache.  
3. [x] Endpoint `POST /api/v1/businesses/sync` (admin) para refrescar negocios desde Places.  
4. [x] CRUD ofertas: `GET/POST /api/v1/offers`, `PATCH/DELETE /api/v1/offers/:id` (crear/editar solo dashboard).  
5. [x] Vista `/marketplace`: mapa de negocios, filtros por categoría y “con/sin oferta”, pins distintos (verde con oferta).  
6. [x] Sección “Ofertas activas” en panel lateral y enlace a negocio.  
7. (Opcional) Redis para cache de Places y rate limit.

### Fase 3 – Automatización y Pulido (Semanas 6–7)

1. Reglas por categoría (ej. “Luminarias” → notificar a responsable).  
2. Notificaciones: email y/o WhatsApp (API) o cola de mensajes.  
3. Métricas avanzadas: tiempo promedio resolución, heatmap por colonia.  
4. Mejoras UX: loading, errores, mensajes de éxito, accesibilidad básica.

### Fase 4 – Gamificación y Extensión (Futuro)

1. Sistema de reputación y puntos.  
2. Ranking por colonia.  
3. Extensiones marketplace: renta, intercambio, donaciones, bolsa de servicios.  
4. Verificación residente (teléfono + colonia o INE según decisión legal).

---

## 9. Criterios de Aceptación por Fase

- **Fase 0:** `npm run dev` en api y web sin error; migración Prisma aplicada; health check `/api/health` responde OK.  
- **Fase 1:** Crear reporte con foto y ubicación → aparece en mapa; votar +1 → cuenta actualizada; dashboard muestra reportes y permite cambiar estado; métricas visibles.  
- **Fase 2:** Mapa muestra negocios de Cuauhtémoc; ofertas creadas se ven en mapa y en listado “Ofertas activas”.  
- **Fase 3:** Al menos una categoría con regla automática (ej. notificación por email); métricas de tiempo de resolución y heatmap operativas.

---

## 10. Entorno y Despliegue

- **Desarrollo:** `.env` local; PostgreSQL en Docker o servicio cloud.  
- **Staging:** Mismo stack; DB y storage separados; variables de Google Maps/Places de prueba.  
- **Producción:** VPS o PaaS (Railway, Fly.io, etc.); PostgreSQL gestionado; backups automáticos; logs centralizados.  
- **CI:** Lint + tests en cada push; opcional deploy automático a staging desde `main`.

---

## 11. Estado de Implementación

- **Fase 0:** ✅ Completada (estructura api/ y web/, Prisma, migración, seed, CONTRIBUTING).  
- **Fase 1:** ✅ Completada (backend + frontend: auth, reportes, votación, categorías, mapa ciudadano, modal Reportar con mapa, +1 en popup, dashboard por roles, canalización Llamar/Email).  
- **Fase 2:** ✅ Completada (tablas Business/Offer, migración, API negocios y ofertas, sync Google Places, frontend `/marketplace` con mapa, filtros y ofertas activas).  
- **Próximo paso:** Fase 3 – Automatización y pulido (reglas por categoría, notificaciones, métricas avanzadas).
