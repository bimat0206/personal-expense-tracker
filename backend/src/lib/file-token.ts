import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config';

/**
 * Short-lived server-side cache for CSV uploads between preview and commit
 * (SYSTEM_DESIGN.md §4.10). Tokens expire after config.csvFileTokenTtlMs.
 */

interface TokenEntry {
  filePath: string;
  expiresAt: number;
}

const tokens = new Map<string, TokenEntry>();

function ensureDir(): void {
  fs.mkdirSync(config.tmpImportsPath, { recursive: true });
}

export function storeUploadedFile(buffer: Buffer): string {
  ensureDir();
  const token = crypto.randomUUID();
  const filePath = path.join(config.tmpImportsPath, `${token}.csv`);
  fs.writeFileSync(filePath, buffer);
  tokens.set(token, { filePath, expiresAt: Date.now() + config.csvFileTokenTtlMs });
  return token;
}

/** Returns the file path for a token, or null if unknown/expired. */
export function resolveFileToken(token: string): string | null {
  const entry = tokens.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    tokens.delete(token);
    safeUnlink(entry.filePath);
    return null;
  }
  return entry.filePath;
}

export function releaseFileToken(token: string): void {
  const entry = tokens.get(token);
  if (entry) {
    tokens.delete(token);
    safeUnlink(entry.filePath);
  }
}

/** Sweep orphaned temp files (from crashes between preview and commit) on startup. */
export function sweepExpiredImports(): void {
  ensureDir();
  const cutoff = Date.now() - config.csvFileTokenTtlMs;
  for (const entry of fs.readdirSync(config.tmpImportsPath)) {
    const filePath = path.join(config.tmpImportsPath, entry);
    const stat = fs.statSync(filePath);
    if (stat.mtimeMs < cutoff) safeUnlink(filePath);
  }
}

function safeUnlink(filePath: string): void {
  try {
    fs.unlinkSync(filePath);
  } catch {
    // already gone — fine
  }
}
