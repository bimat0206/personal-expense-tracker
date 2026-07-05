import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../db/db';
import { attachments, transactions } from '../db/schema';
import { badRequest, notFound } from '../lib/errors';
import { nowIso } from '../lib/date';
import { config } from '../config';

function ensureDir(): void {
  fs.mkdirSync(config.attachmentsPath, { recursive: true });
}

function assertTransactionExists(transactionId: number): void {
  const row = db.select().from(transactions).where(eq(transactions.id, transactionId)).get();
  if (!row) throw notFound('Transaction not found');
}

function validateFile(mimeType: string, sizeBytes: number): void {
  if (!config.attachmentAllowedMimeTypes.includes(mimeType)) {
    throw badRequest(`Unsupported file type: ${mimeType}`);
  }
  if (sizeBytes > config.attachmentMaxSizeBytes) {
    throw badRequest(`File exceeds the ${config.attachmentMaxSizeBytes / (1024 * 1024)}MB limit`);
  }
}

/** Crash-safe replace ordering (SYSTEM_DESIGN.md §6): write new file first, commit DB, only then delete the old file. */
export function upload(transactionId: number, file: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
  assertTransactionExists(transactionId);
  validateFile(file.mimetype, file.size);
  ensureDir();

  const existing = db.select().from(attachments).where(eq(attachments.transactionId, transactionId)).get();
  const storageId = crypto.randomUUID();
  const filePath = path.join(config.attachmentsPath, storageId);
  fs.writeFileSync(filePath, file.buffer);

  // The DB write is the point of no return: if it fails, roll back the new file and leave the
  // old file/row untouched; only delete the old file (best-effort) after the DB write succeeds.
  let result: { row: typeof attachments.$inferSelect; created: boolean };
  try {
    const now = nowIso();
    if (existing) {
      const row = db
        .update(attachments)
        .set({ fileName: file.originalname, filePath, mimeType: file.mimetype, sizeBytes: file.size })
        .where(eq(attachments.transactionId, transactionId))
        .returning().get();
      result = { row, created: false };
    } else {
      const row = db
        .insert(attachments)
        .values({
          id: storageId,
          transactionId,
          fileName: file.originalname,
          filePath,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          createdAt: now,
        })
        .returning().get();
      result = { row, created: true };
    }
  } catch (err) {
    fs.unlinkSync(filePath);
    throw err;
  }
  if (existing) {
    try {
      fs.unlinkSync(existing.filePath);
    } catch {
      // old file already gone — fine, the DB already points at the new one
    }
  }
  return result;
}

/** Defense in depth: refuses to serve a file whose stored path resolves outside the attachments
 * directory, regardless of how it got into the DB (e.g. a tampered/crafted full-JSON import). */
function assertWithinAttachmentsDir(filePath: string): void {
  const resolved = path.resolve(filePath);
  const dir = path.resolve(config.attachmentsPath) + path.sep;
  if (!resolved.startsWith(dir)) {
    throw notFound('Attachment file is missing on disk');
  }
}

export function getByTransactionId(transactionId: number) {
  const row = db.select().from(attachments).where(eq(attachments.transactionId, transactionId)).get();
  if (!row) throw notFound('No attachment for this transaction');
  assertWithinAttachmentsDir(row.filePath);
  if (!fs.existsSync(row.filePath)) throw notFound('Attachment file is missing on disk');
  return row;
}

export function remove(transactionId: number): void {
  const row = db.select().from(attachments).where(eq(attachments.transactionId, transactionId)).get();
  if (!row) throw notFound('No attachment for this transaction');
  db.delete(attachments).where(eq(attachments.transactionId, transactionId)).run();
  try {
    fs.unlinkSync(row.filePath);
  } catch {
    // already gone — fine
  }
}
