import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { buildApp, seedBasics } from '../fixtures/seed';

describe('Backup export/import API', () => {
  let app: Express;
  let category: { id: number };
  let paymentMethod: { id: number };

  beforeEach(async () => {
    app = buildApp();
    const basics = await seedBasics(app);
    category = basics.category;
    paymentMethod = basics.paymentMethod;
    await request(app)
      .post('/api/transactions')
      .send({ type: 'expense', date: '2026-01-01', amountCents: 1000, categoryId: category.id, paymentMethodId: paymentMethod.id });
  });

  it('export then import reproduces the same data', async () => {
    const exported = await request(app).get('/api/backup/export');
    expect(exported.status).toBe(200);
    expect(exported.body.transactions).toHaveLength(1);

    const imported = await request(app)
      .post('/api/backup/import')
      .field('confirm', 'true')
      .attach('file', Buffer.from(JSON.stringify(exported.body)), 'backup.json');
    expect(imported.status).toBe(200);
    expect(imported.body.imported.transactions).toBe(1);

    const list = await request(app).get('/api/transactions');
    expect(list.body.total).toBe(1);
  });

  it('rejects import without confirm=true', async () => {
    const exported = await request(app).get('/api/backup/export');
    const res = await request(app)
      .post('/api/backup/import')
      .attach('file', Buffer.from(JSON.stringify(exported.body)), 'backup.json');
    expect(res.status).toBe(400);
  });

  it('rejects attachments whose stored path is outside the attachments directory', async () => {
    const exported = await request(app).get('/api/backup/export');
    exported.body.attachments = [{
      id: 'crafted',
      transactionId: exported.body.transactions[0].id,
      fileName: 'passwd',
      filePath: '/etc/passwd',
      mimeType: 'text/plain',
      sizeBytes: 1,
      createdAt: new Date().toISOString(),
    }];

    const res = await request(app)
      .post('/api/backup/import')
      .field('confirm', 'true')
      .attach('file', Buffer.from(JSON.stringify(exported.body)), 'backup.json');
    expect(res.status).toBe(400);
  });

  it('rejects invalid restored financial and state values', async () => {
    const exported = await request(app).get('/api/backup/export');
    exported.body.transactions[0].amountCents = -1;
    exported.body.wishListItems = [{
      id: 1,
      month: 13,
      year: 2026,
      name: 'Invalid',
      estimatedCostCents: 0,
      categoryId: category.id,
      priority: 'urgent',
      status: 'done',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }];
    exported.body.appSettings.topExpensesCount = 0;

    const res = await request(app)
      .post('/api/backup/import')
      .field('confirm', 'true')
      .attach('file', Buffer.from(JSON.stringify(exported.body)), 'backup.json');
    expect(res.status).toBe(400);
  });

  it('is not due immediately after the first transaction, and stays not-due right after an export', async () => {
    const before = await request(app).get('/api/settings');
    expect(before.body.backupReminderDue).toBe(false); // baseline (first transaction) was just created, well within the 30-day threshold
    await request(app).get('/api/backup/export');
    const after = await request(app).get('/api/settings');
    expect(after.body.backupReminderDue).toBe(false);
  });
});
