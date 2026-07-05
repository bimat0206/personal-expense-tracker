import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sqlite } from './client';
import * as schema from './schema';

export const db = drizzle(sqlite, { schema });
