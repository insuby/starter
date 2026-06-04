import type { AppConfig } from '../config.js';
import { MemoryRepository } from './memory.js';
import { PostgresRepository } from './postgres.js';
import type { Repository } from './types.js';

export type { Repository } from './types.js';

// Выбор источника данных: PostgreSQL при заданном DATABASE_URL, иначе in-memory.
export function createRepository(config: AppConfig): { repo: Repository; kind: 'postgres' | 'memory' } {
  if (config.databaseUrl) {
    return { repo: new PostgresRepository(config.databaseUrl), kind: 'postgres' };
  }
  return { repo: new MemoryRepository(), kind: 'memory' };
}
