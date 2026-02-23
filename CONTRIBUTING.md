# Cómo levantar el proyecto en local

## Requisitos

- **Node.js** 20 LTS
- **npm** 9+
- **PostgreSQL** 15+ (para usar la API con base de datos)

## Estructura

- `api/` – Backend (Fastify + TypeScript + Prisma)
- `web/` – Frontend (Next.js 14 + TypeScript + Tailwind)

## 1. Backend (API)

```bash
cd api
cp .env.example .env
# Editar .env: DATABASE_URL (si tienes PostgreSQL), JWT_SECRET y opcionalmente GOOGLE_PLACES_API_KEY (Fase 2 – sync negocios)
npm install
npm run db:generate
```

### Base de datos (opcional para desarrollo mínimo)

Si tienes PostgreSQL:

```bash
# Crear base de datos (ejemplo)
createdb qau

# Aplicar migraciones (detén el servidor dev antes de migrar si hay errores EPERM)
npm run db:migrate

# Cargar roles iniciales
npm run db:seed
```

Si cambias el esquema Prisma, ejecuta `npm run db:generate`. Si falla con EPERM en Windows, detén `npm run dev` antes.

Si no tienes base de datos, la API arranca igual; el endpoint `GET /api/health` responderá con `database: "unavailable"`.

### Levantar la API

```bash
npm run dev
```

- API: **http://localhost:3001**
- Health: **http://localhost:3001/api/health**

## 2. Frontend (Web)

```bash
cd web
cp .env.local.example .env.local
# Opcional: editar NEXT_PUBLIC_API_URL si la API está en otro puerto
npm install
npm run dev
```

- Web: **http://localhost:3000**

## 3. Verificación Fase 0 y Auth

- [ ] `cd api && npm run dev` → sin errores
- [ ] `GET http://localhost:3001/api/health` → `{ "status": "ok", "database": "..." }`
- [ ] Con DB: `POST http://localhost:3001/api/v1/auth/register` con `{ "email": "test@test.com", "password": "12345678" }` → 201 y `accessToken`/`refreshToken`
- [ ] `GET http://localhost:3001/api/v1/reports/categories` → lista de categorías
- [ ] `GET http://localhost:3001/api/v1/reports` → lista de reportes (paginada)
- [ ] Dashboard (con usuario admin): login con `admin@alcaldia.local` / `admin123` (tras `npm run db:seed`), luego `GET /api/v1/dashboard/stats` y `GET /api/v1/dashboard/reports` con header `Authorization: Bearer <accessToken>`
- [ ] `cd web && npm run dev` → sin errores
- [ ] Abrir http://localhost:3000 y ver la página principal

## Scripts útiles

| Ubicación | Comando        | Descripción              |
|-----------|----------------|--------------------------|
| api/      | `npm run dev`  | API en modo desarrollo   |
| api/      | `npm run build`| Compilar API             |
| api/      | `npm run db:migrate` | Aplicar migraciones |
| api/      | `npm run db:studio`  | Abrir Prisma Studio |
| web/      | `npm run dev`  | Next.js en desarrollo    |
| web/      | `npm run build`| Build de producción      |
