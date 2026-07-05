import path from 'path';

function resolveFromBackendRoot(p: string): string {
  // ':memory:' is SQLite's special in-memory-DB sentinel (used by tests), not a filesystem path.
  if (p === ':memory:') return p;
  return path.isAbsolute(p) ? p : path.resolve(__dirname, '..', p);
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  // Hard default: bind loopback only. Set ALLOW_NON_LOCAL_BIND=true to opt out (unsupported).
  host: process.env.ALLOW_NON_LOCAL_BIND === 'true' ? '0.0.0.0' : '127.0.0.1',
  databasePath: resolveFromBackendRoot(process.env.DATABASE_PATH ?? '../data/expense-tracker.db'),
  attachmentsPath: resolveFromBackendRoot(process.env.ATTACHMENTS_PATH ?? '../data/attachments'),
  tmpImportsPath: resolveFromBackendRoot(process.env.TMP_IMPORTS_PATH ?? '../data/tmp/imports'),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  defaultCurrencyCode: 'USD',
  attachmentMaxSizeBytes: 10 * 1024 * 1024,
  attachmentAllowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'] as string[],
  csvFileTokenTtlMs: 30 * 60 * 1000,
  csvUploadMaxSizeBytes: 50 * 1024 * 1024,
  backupUploadMaxSizeBytes: 200 * 1024 * 1024,
} as const;
