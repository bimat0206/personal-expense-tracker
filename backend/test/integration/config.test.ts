import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { buildApp, completeFirstRun } from '../fixtures/seed';

describe('Config (categories) API', () => {
  let app: Express;

  beforeEach(async () => {
    app = buildApp();
    await completeFirstRun(app);
  });

  it('rejects a duplicate active name (case-insensitive)', async () => {
    await request(app).post('/api/categories').send({ name: 'Groceries' });
    const res = await request(app).post('/api/categories').send({ name: 'groceries' });
    expect(res.status).toBe(409);
  });

  it('archiving hides an item from the active list but keeps it visible with includeArchived', async () => {
    const created = await request(app).post('/api/categories').send({ name: 'Subscriptions' });
    await request(app).post(`/api/categories/${created.body.id}/archive`);

    const active = await request(app).get('/api/categories');
    expect(active.body.find((c: { id: number }) => c.id === created.body.id)).toBeUndefined();

    const all = await request(app).get('/api/categories').query({ includeArchived: 'true' });
    expect(all.body.find((c: { id: number }) => c.id === created.body.id)).toBeDefined();
  });

  it('allows reusing the name of an archived item', async () => {
    const created = await request(app).post('/api/categories').send({ name: 'Travel' });
    await request(app).post(`/api/categories/${created.body.id}/archive`);
    const reused = await request(app).post('/api/categories').send({ name: 'Travel' });
    expect(reused.status).toBe(201);
  });

  it('rejects unarchiving into a duplicate active name', async () => {
    const archived = await request(app).post('/api/categories').send({ name: 'Dining' });
    await request(app).post(`/api/categories/${archived.body.id}/archive`);
    await request(app).post('/api/categories').send({ name: 'dining' });

    const res = await request(app).post(`/api/categories/${archived.body.id}/unarchive`);
    expect(res.status).toBe(409);
  });

  it('blocks deleting a category referenced by a transaction, and allows archiving instead', async () => {
    const category = await request(app).post('/api/categories').send({ name: 'Referenced Category' });
    const paymentMethod = await request(app).post('/api/payment-methods').send({ name: 'Referenced Payment Method' });
    await request(app)
      .post('/api/transactions')
      .send({ type: 'expense', date: '2026-01-01', amountCents: 500, categoryId: category.body.id, paymentMethodId: paymentMethod.body.id });

    const del = await request(app).delete(`/api/categories/${category.body.id}`);
    expect(del.status).toBe(409);

    const archive = await request(app).post(`/api/categories/${category.body.id}/archive`);
    expect(archive.status).toBe(200);
  });
});
