# Despliegue QAU en qau.ironslash.com

Pasos para configurar el proyecto en el VPS (PostgreSQL, PM2, Nginx ya instalados).

## 1. Requisitos en el VPS

- Node.js 18+ (recomendado LTS)
- PostgreSQL
- PM2 (`npm i -g pm2`)
- Nginx

## 2. Clonar y preparar el proyecto

```bash
cd ~
git clone https://github.com/ivanamx/qau.git
cd qau
```

## 3. Base de datos PostgreSQL

Crear base de datos y usuario (ajusta usuario y contraseña):

```bash
sudo -u postgres psql -c "CREATE USER qau WITH PASSWORD 'tu_password_seguro';"
sudo -u postgres psql -c "CREATE DATABASE qau OWNER qau;"
```

Ejecutar migraciones y seed (roles + reportes de prueba):

```bash
cd api
cp .env.production.example .env
# Edita .env y pon DATABASE_URL, JWT_SECRET, CORS_ORIGIN (ver abajo)
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run db:seed-reports
cd ..
```

## 4. Variables de entorno

### API (`api/.env`)

Copia el ejemplo y rellena:

```bash
cp api/.env.production.example api/.env
nano api/.env
```

Debe tener al menos:

- `DATABASE_URL=postgresql://qau:tu_password@localhost:5432/qau`
- `JWT_SECRET=` (genera uno: `openssl rand -base64 32`)
- `CORS_ORIGIN=https://qau.ironslash.com`
- `PORT=3001` y `HOST=0.0.0.0` si quieres (ya están por defecto)

### Web (`web/.env.local`)

Para que el front use la misma URL (Nginx hace proxy de `/api` y `/uploads`):

```bash
cp web/.env.production.example web/.env.local
# .env.local puede quedar con NEXT_PUBLIC_API_URL= vacío
nano web/.env.local
```

Si usas Google Maps en producción, añade `NEXT_PUBLIC_GOOGLE_MAPS_KEY=...`.

## 5. Build e instalar dependencias

```bash
# API
cd api
npm ci
npm run build
cd ..

# Web (el build usa NEXT_PUBLIC_* de .env.local)
cd web
npm ci
npm run build
cd ..
```

## 6. PM2

Desde la raíz del repo (`qau/`):

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # sigue la instrucción que imprime para arrancar PM2 al reiniciar
```

Comprobar:

```bash
pm2 status
curl -s http://127.0.0.1:3001/api/health
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000
```

## 7. Nginx

Copiar la configuración y activarla:

```bash
sudo cp deploy/nginx-qau.ironslash.com.conf /etc/nginx/sites-available/qau.ironslash.com
sudo ln -s /etc/nginx/sites-available/qau.ironslash.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Si Nginx no usa `sites-available/sites-enabled`, copia el contenido del archivo dentro de `http { ... }` en tu `nginx.conf` o en el archivo de sitio que uses.

## 8. HTTPS (opcional)

Cuando quieras SSL:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d qau.ironslash.com -d www.qau.ironslash.com
```

Luego en la config de Nginx puedes forzar HTTPS (certbot suele añadir el `server` en 443 y la redirección desde 80).

## 9. Actualizar después de cambios

```bash
cd ~/qau
git pull
cd api && npm ci && npm run build && cd ..
cd web && npm ci && npm run build && cd ..
pm2 restart all
```

## Resumen de puertos

| Servicio   | Puerto | Uso                          |
|-----------|--------|------------------------------|
| Nginx     | 80     | qau.ironslash.com            |
| Next.js   | 3000   | Proxy desde Nginx `/`        |
| API       | 3001   | Proxy desde Nginx `/api`, `/uploads` |

## Troubleshooting

- **502 Bad Gateway**: Revisa que PM2 tenga los dos procesos activos (`pm2 status`) y que la API responda en 3001 y Next en 3000.
- **CORS o “blocked by CORS”**: Comprueba que `CORS_ORIGIN` en `api/.env` sea exactamente `https://qau.ironslash.com` (sin barra final).
- **Fotos no cargan**: Que la ruta Nginx `/uploads/` apunte a `http://127.0.0.1:3001` y que en `api/uploads/` existan las imágenes que uses (o el seed que las referencia).
