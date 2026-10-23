import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { runMigrations } from './db/migrate.js';

/** Samostatné spuštění migrací (build na Vercelu): `npm run migrate`. Neon: přímé spojení, ne přes pooler */
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL });
await runMigrations(drizzle(pool));
await pool.end();
console.log('migrace hotové');
