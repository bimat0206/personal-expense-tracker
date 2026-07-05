import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { buildApp, seedBasics } from '../fixtures/seed';

async function waitForJob(app: Express, jobId: string) {
  for (let i = 0; i < 50; i++) {
    const res = await request(app).get(`/api/import/csv/commit/${jobId}`);
    if (res.body.status === 'done') return res.body;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error('job did not complete in time');
}

describe('CSV Import API', () => {
  let app: Express;
  let category: { id: number };
  let paymentMethod: { id: number };

  beforeEach(async () => {
    app = buildApp();
    const basics = await seedBasics(app);
    category = basics.category;
    paymentMethod = basics.paymentMethod;
  });

  it('previews a CSV and returns a fileToken usable for commit', async () => {
    const csv = 'date,amount,type,note\n2026-01-01,10.50,expense,Coffee\n';
    const preview = await request(app).post('/api/import/csv/preview').attach('file', Buffer.from(csv), 'sample.csv');
    expect(preview.status).toBe(200);
    expect(preview.body.headers).toEqual(['date', 'amount', 'type', 'note']);
    expect(preview.body.fileToken).toBeTruthy();
  });

  it('imports valid rows and reports skipped ones with reasons', async () => {
    const csv = [
      'date,amount,type,note',
      '2026-01-01,10.50,expense,Coffee',
      'not-a-date,5,expense,Bad row',
      '2026-01-02,0,expense,Zero amount',
    ].join('\n');
    const preview = await request(app).post('/api/import/csv/preview').attach('file', Buffer.from(csv), 'sample.csv');

    const commit = await request(app)
      .post('/api/import/csv/commit')
      .send({
        fileToken: preview.body.fileToken,
        mapping: { date: 'date', amount: 'amount', type: 'type', note: 'note' },
        defaultCategoryId: category.id,
        defaultPaymentMethodId: paymentMethod.id,
      });
    expect(commit.status).toBe(202);

    const result = await waitForJob(app, commit.body.jobId);
    expect(result.imported).toBe(1);
    expect(result.skipped).toHaveLength(2);
  });

  it('rejects commit with an expired or unknown fileToken', async () => {
    const commit = await request(app)
      .post('/api/import/csv/commit')
      .send({
        fileToken: 'unknown-token',
        mapping: { date: 'date', amount: 'amount', type: 'type' },
        defaultCategoryId: category.id,
        defaultPaymentMethodId: paymentMethod.id,
      });
    expect(commit.status).toBe(410);
  });
});
