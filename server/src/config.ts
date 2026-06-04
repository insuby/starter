// Конфигурация сервера из переменных окружения.
export interface AppConfig {
  port: number;
  host: string;
  databaseUrl: string | undefined;
  corsOrigin: string;
}

export function loadConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 3001),
    host: process.env.HOST ?? '0.0.0.0',
    // Если DATABASE_URL задан — используется PostgreSQL, иначе in-memory (демо/тесты).
    databaseUrl: process.env.DATABASE_URL || undefined,
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
  };
}
