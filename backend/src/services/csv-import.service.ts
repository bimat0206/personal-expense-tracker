import fs from 'fs';
import crypto from 'crypto';
import { db } from '../db/db';
import { badRequest, gone, notFound } from '../lib/errors';
import { parseCsv } from '../lib/csv-parser';
import { isValidDateString, isFutureDate } from '../lib/date';
import { roundToCents } from '../lib/currency';
import { storeUploadedFile, resolveFileToken, releaseFileToken } from '../lib/file-token';
import { validateCreateInput, createWithHandle, CreateTransactionInput } from './transaction.service';

export interface CsvMapping {
  date: string;
  note?: string;
  amount?: string;
  type?: string;
  signedAmount?: string;
}

export interface CommitInput {
  fileToken: string;
  mapping: CsvMapping;
  defaultCategoryId?: number;
  defaultIncomeSourceId?: number;
  defaultPaymentMethodId: number;
}

interface SkippedRow {
  row: number;
  reason: string;
}

interface Job {
  status: 'processing' | 'done';
  rowsProcessed: number;
  totalRows: number;
  imported?: number;
  skipped?: SkippedRow[];
}

const jobs = new Map<string, Job>();

export function preview(buffer: Buffer) {
  const { headers, rows } = parseCsv(buffer.toString('utf-8'));
  const fileToken = storeUploadedFile(buffer);
  return { fileToken, headers, sampleRows: rows.slice(0, 10) };
}

export function startCommit(input: CommitInput): string {
  if (!input.mapping.amount && !input.mapping.signedAmount) {
    throw badRequest('mapping must include either "amount" (with "type") or "signedAmount"');
  }
  const filePath = resolveFileToken(input.fileToken);
  if (!filePath) throw gone('CSV upload has expired — please re-upload the file');

  const content = fs.readFileSync(filePath, 'utf-8');
  const { headers, rows } = parseCsv(content);
  const jobId = crypto.randomUUID();
  jobs.set(jobId, { status: 'processing', rowsProcessed: 0, totalRows: rows.length });

  setImmediate(() => processJob(jobId, headers, rows, input));
  return jobId;
}

export function getJob(jobId: string): Job {
  const job = jobs.get(jobId);
  if (!job) throw notFound('Unknown import job');
  return job;
}

function buildRowInput(
  cols: string[],
  headers: string[],
  mapping: CsvMapping,
  defaults: CommitInput,
): { input: CreateTransactionInput } | { skipReason: string } {
  const colIndex = (name?: string) => (name ? headers.indexOf(name) : -1);
  const dateIdx = colIndex(mapping.date);
  const noteIdx = colIndex(mapping.note);
  const amountIdx = colIndex(mapping.amount);
  const typeIdx = colIndex(mapping.type);
  const signedIdx = colIndex(mapping.signedAmount);

  const dateStr = cols[dateIdx];
  if (!isValidDateString(dateStr)) return { skipReason: 'invalid or missing date' };
  if (isFutureDate(dateStr)) return { skipReason: 'future date not allowed' };

  let type: 'expense' | 'income';
  let amountCents: number;

  if (signedIdx >= 0) {
    const raw = Number(cols[signedIdx]);
    if (!Number.isFinite(raw) || raw === 0) return { skipReason: 'invalid or zero signed amount' };
    type = raw > 0 ? 'income' : 'expense';
    amountCents = roundToCents(Math.abs(raw));
  } else {
    const raw = Number(cols[amountIdx]);
    if (!Number.isFinite(raw) || raw <= 0) return { skipReason: 'invalid amount' };
    const typeVal = cols[typeIdx]?.trim().toLowerCase();
    if (typeVal !== 'expense' && typeVal !== 'income') return { skipReason: 'invalid or missing type' };
    type = typeVal;
    amountCents = roundToCents(raw);
  }

  const categoryId = type === 'expense' ? defaults.defaultCategoryId : undefined;
  const incomeSourceId = type === 'income' ? defaults.defaultIncomeSourceId : undefined;
  if (type === 'expense' && !categoryId) return { skipReason: 'no default category configured' };
  if (type === 'income' && !incomeSourceId) return { skipReason: 'no default income source configured' };

  const input: CreateTransactionInput = {
    type,
    date: dateStr,
    amountCents,
    categoryId,
    incomeSourceId,
    paymentMethodId: defaults.defaultPaymentMethodId,
    note: noteIdx >= 0 ? cols[noteIdx] : undefined,
  };
  try {
    validateCreateInput(input);
  } catch (err) {
    return { skipReason: err instanceof Error ? err.message : 'validation failed' };
  }
  return { input };
}

/** Phase 1: validate every row in memory. Phase 2: insert all valid rows in one DB transaction (SYSTEM_DESIGN.md §6). */
function processJob(jobId: string, headers: string[], rows: string[][], input: CommitInput): void {
  const job = jobs.get(jobId);
  if (!job) return;

  const validInputs: CreateTransactionInput[] = [];
  const skipped: SkippedRow[] = [];

  rows.forEach((cols, i) => {
    const rowNum = i + 1;
    const result = buildRowInput(cols, headers, input.mapping, input);
    if ('skipReason' in result) {
      skipped.push({ row: rowNum, reason: result.skipReason });
    } else {
      validInputs.push(result.input);
    }
    job.rowsProcessed = rowNum;
  });

  let imported = 0;
  try {
    db.transaction((tx) => {
      for (const row of validInputs) {
        createWithHandle(tx, row);
        imported++;
      }
    });
  } catch (err) {
    // Phase 2 is all-or-nothing: an infra failure here rolls back everything already inserted
    // in this transaction and is reported as a total failure, not a partial commit.
    console.error(`CSV import job ${jobId} failed during commit:`, err);
    job.status = 'done';
    job.imported = 0;
    job.skipped = rows.map((_, i) => ({ row: i + 1, reason: 'import failed, no rows were saved' }));
    releaseFileToken(input.fileToken);
    return;
  }

  job.status = 'done';
  job.imported = imported;
  job.skipped = skipped;
  releaseFileToken(input.fileToken);
}
