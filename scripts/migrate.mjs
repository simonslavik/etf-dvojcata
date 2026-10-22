// Migrace produkční DB při buildu (Vercel spouští `npm run build` s env proměnnými projektu).
// Neon přes WebSocket Pool → celé migrace v jedné transakci (neon-http migrator transakce neumí).
// Bez DATABASE_URL nic nedělá – lokální PGlite se migruje za běhu (lib/db/index.ts).
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';

if (!process.env.DATABASE_URL) {
  console.log('migrate: DATABASE_URL není nastavená – přeskočeno');
  process.exit(0);
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
await migrate(drizzle(pool), { migrationsFolder: new URL('../lib/db/migrations', import.meta.url).pathname });
await pool.end();
console.log('migrate: hotovo');
