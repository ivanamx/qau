export const config = {
  port: Number(process.env.PORT) || 3001,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
  jwtAccessExpiresIn: '15m',
  jwtRefreshExpiresIn: '7d',
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY ?? '',
} as const;
