import fs from 'fs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { buildApp, seedBasics } from '../fixtures/seed';
import { createExpense } from '../fixtures/transactions';
import { config } from '../../src/config';

function binaryParser(res: NodeJS.ReadableStream, callback: (err: Error | null, body?: Buffer) => void): void {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(chunk));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
  res.on('error', callback);
}

describe('Attachments API', () => {
  let app: Express;
  let transactionId: number;

  beforeEach(async () => {
    app = buildApp();
    const { category, paymentMethod } = await seedBasics(app);
    const transaction = await createExpense(app, { categoryId: category.id, paymentMethodId: paymentMethod.id });
    transactionId = transaction.body.id;
  });

  it('does not expose filePath in upload responses', async () => {
    const res = await request(app)
      .post(`/api/transactions/${transactionId}/attachment`)
      .attach('file', Buffer.from('pdf'), { filename: 'receipt.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(201);
    expect(res.body.filename).toBe('receipt.pdf');
    expect(res.body.fileName).toBeUndefined();
    expect(res.body.filePath).toBeUndefined();
  });

  it('rejects files larger than the configured attachment limit', async () => {
    const res = await request(app)
      .post(`/api/transactions/${transactionId}/attachment`)
      .attach('file', Buffer.alloc(config.attachmentMaxSizeBytes + 1), {
        filename: 'large.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(400);
  });

  it('keeps the replacement file when deleting the old file fails', async () => {
    await request(app)
      .post(`/api/transactions/${transactionId}/attachment`)
      .attach('file', Buffer.from('old'), { filename: 'old.pdf', contentType: 'application/pdf' });
    const unlink = vi.spyOn(fs, 'unlinkSync').mockImplementationOnce(() => {
      throw new Error('simulated old-file deletion failure');
    });

    const replaced = await request(app)
      .post(`/api/transactions/${transactionId}/attachment`)
      .attach('file', Buffer.from('new'), { filename: 'new.pdf', contentType: 'application/pdf' });
    unlink.mockRestore();

    expect(replaced.status).toBe(200);
    const downloaded = await request(app)
      .get(`/api/transactions/${transactionId}/attachment`)
      .buffer(true)
      .parse(binaryParser);
    expect(downloaded.status).toBe(200);
    expect(Buffer.isBuffer(downloaded.body)).toBe(true);
    expect(downloaded.body.toString()).toBe('new');
  });
});
