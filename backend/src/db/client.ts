import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { config } from '../config';

fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });

export const sqlite = new Database(config.databasePath);
// SQLite disables FK enforcement by default; without this none of the schema's
// REFERENCES/ON DELETE behavior is actually enforced (SYSTEM_DESIGN.md §7).
sqlite.pragma('foreign_keys = ON');
// WAL mode is invalid for in-memory databases (used in tests); only apply it for a real file.
if (config.databasePath !== ':memory:') {
  sqlite.pragma('journal_mode = WAL');
}
