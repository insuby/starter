import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { AppConfig } from './config.js';
import { createRepository } from './repo/index.js';
import { registerRoutes } from './routes.js';

export async function buildApp(config: AppConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL ?? 'info' },
  });

  await app.register(cors, { origin: config.corsOrigin });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'БСО — API учёта бланков строгой отчётности',
        description: 'Серверное API по согласованной схеме (docs/dashboard-api-schema.json). Задачи 2.2–2.3 дорожной карты.',
        version: '1.0.0',
      },
      servers: [{ url: `/v1` }],
      tags: [
        { name: 'service', description: 'Служебные' },
        { name: 'dashboard', description: 'Дашборд' },
        { name: 'blanks', description: 'Реестр бланков' },
        { name: 'operations', description: 'Операции' },
      ],
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  const { repo, kind } = createRepository(config);
  await repo.ready();
  app.log.info(`Источник данных: ${kind}`);

  // Все доменные маршруты под префиксом /v1 (соответствует baseUrl контракта).
  await app.register(async (instance) => {
    await registerRoutes(instance, { repo, kind });
  }, { prefix: '/v1' });

  app.addHook('onClose', async () => {
    await repo.close();
  });

  return app;
}
