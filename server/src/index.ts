import { buildApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();

const start = async (): Promise<void> => {
  const app = await buildApp(config);

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`Получен сигнал ${signal}, останавливаюсь`);
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(`БСО API: http://localhost:${config.port}/v1 · Swagger: http://localhost:${config.port}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

void start();
