import { Global, Inject, Logger, Module, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import type { Env } from '../config/env.js';
import { DB } from './db.js';
import { RateLimitService } from './rate-limit.service.js';
import * as schema from './schema.js';

const POOL = Symbol('PG_POOL');

const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url));

/**
 * Postgres přes Drizzle + node-postgres Pool. Migrace (drizzle/, generuje drizzle-kit) proběhnou při startu
 * v jedné transakci – API běží jako jeden dlouhodobý proces, takže nehrozí souběh více instancí.
 */
@Global()
@Module({
  providers: [
    {
      provide: POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        new pg.Pool({ connectionString: config.get('DATABASE_URL', { infer: true }), max: 10 }),
    },
    {
      provide: DB,
      inject: [POOL],
      useFactory: async (pool: pg.Pool) => {
        const db = drizzle(pool, { schema });
        await migrate(db, { migrationsFolder });
        new Logger('Database').log('migrace hotové');
        return db;
      },
    },
    RateLimitService,
  ],
  exports: [DB, RateLimitService],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(POOL) private readonly pool: pg.Pool) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
