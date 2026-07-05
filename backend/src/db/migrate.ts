import path from 'path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './db';

/** Runs pending migrations. Aborts the process on failure rather than serving against a broken schema (SYSTEM_DESIGN.md §7). */
export function runMigrations(): void {
  migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle') });
}

if (require.main === module) {
  runMigrations();
  console.log('Migrations applied.');
}
