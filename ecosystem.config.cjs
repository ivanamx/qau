/**
 * PM2 ecosystem para QAU en producción.
 * Uso: desde la raíz del repo (donde está este archivo):
 *   pm2 start ecosystem.config.cjs
 *
 * Asegúrate de tener api/.env y web/.env.local con las variables correctas.
 */
module.exports = {
  apps: [
    {
      name: 'qau-api',
      cwd: './api',
      script: 'node',
      args: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'qau-web',
      cwd: './web',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: { NODE_ENV: 'production', PORT: 3000 },
    },
  ],
};
