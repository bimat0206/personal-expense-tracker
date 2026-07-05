import { runMigrations } from '../src/db/migrate';

// Each test file gets its own module registry (and thus its own in-memory DB, since
// DATABASE_PATH=':memory:') — apply the schema fresh before that file's tests run.
runMigrations();
