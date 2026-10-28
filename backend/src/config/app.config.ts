import { registerAs } from '@nestjs/config';

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const appConfig = registerAs('app', () => ({
  port: toInt(process.env.PORT, 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  f1Api: {
    baseUrl:
      process.env.F1_API_BASE_URL ?? 'https://tech-challenge101.onrender.com',
    timeoutMs: toInt(process.env.F1_API_TIMEOUT_MS, 75_000),
    retries: toInt(process.env.F1_API_RETRIES, 1),
    cacheTtlMs: toInt(process.env.F1_API_CACHE_TTL_MS, 3_600_000),
  },
}));

export type AppConfig = ReturnType<typeof appConfig>;
