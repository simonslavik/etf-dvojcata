/**
 * Postgres přes Drizzle:
 * - DATABASE_URL nastavená (Neon, Vercel Marketplace) → neon-http driver
 * - jinak PGlite = Postgres ve WASM v procesu (.data/pglite lokálně) – vývoj bez účtů a nastavování
 * Migrace (lib/db/migrations, generuje drizzle-kit) se spustí jednou na instanci při prvním dotazu.
 */
import path from 'node:path';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import * as schema from './schema';

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
export const dbMode = process.env.DATABASE_URL ? 'postgres' : 'pglite';

const migrationsFolder = path.join(process.cwd(), 'lib/db/migrations');
const g = globalThis as unknown as { __etfdDb?: Promise<Db> };

async function connect(): Promise<Db> {
  if (process.env.DATABASE_URL) {
    const { neon } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-http');
    const { migrate } = await import('drizzle-orm/neon-http/migrator');
    const db = drizzle(neon(process.env.DATABASE_URL), { schema });
    await migrate(db, { migrationsFolder });
    return db as unknown as Db;
  }
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  const dir = process.env.VERCEL ? '/tmp/pglite' : path.join(process.cwd(), '.data/pglite');
  (await import('node:fs')).mkdirSync(path.dirname(dir), { recursive: true }); // PGlite vytvoří jen poslední úroveň
  const db = drizzle(new PGlite(dir), { schema });
  await migrate(db, { migrationsFolder });
  return db as unknown as Db;
}

export function getDb(): Promise<Db> {
  // Cache na globalThis přežije hot reload v dev režimu (PGlite smí mít adresář otevřený jen jednou)
  g.__etfdDb ??= connect().catch((e) => { g.__etfdDb = undefined; throw e; });
  return g.__etfdDb;
}

export { schema };
