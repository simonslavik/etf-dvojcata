import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { fileURLToPath } from 'node:url';

const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url));

export const runMigrations = (db: NodePgDatabase<Record<string, unknown>>) => migrate(db, { migrationsFolder });
