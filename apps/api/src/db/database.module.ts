import { Global, Inject, Logger, Module, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import type { Env } from '../config/env.js';
import { DB } from './db.js';
import { runMigrations } from './migrate.js';
import { RateLimitService } from './rate-limit.service.js';
import * as schema from './schema.js';

const POOL = Symbol('PG_POOL');

/**
 * Postgres přes Drizzle + node-postgres Pool. Migrace (drizzle/, generuje drizzle-kit) proběhnou při startu
 * v jedné transakci – v Dockeru běží API jako jeden dlouhodobý proces, takže nehrozí souběh více instancí.
 * Na Vercelu (serverless, více instancí) se místo toho spouští jednou při buildu (`npm run migrate`).
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
      inject: [POOL, ConfigService],
      useFactory: async (pool: pg.Pool, config: ConfigService<Env, true>) => {
        const db = drizzle(pool, { schema });
        if (!config.get('VERCEL', { infer: true })) {
          await runMigrations(db);
          new Logger('Database').log('migrace hotové');
        }
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
