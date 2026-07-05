import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { buildApp, seedBasics } from '../fixtures/seed';
import { createExpense } from '../fixtures/transactions';

describe('Transactions API', () => {
  let app: Express;
  let category: { id: number };
  let paymentMethod: { id: number };

  beforeEach(async () => {
    app = buildApp();
    const basics = await seedBasics(app);
    category = basics.category;
    paymentMethod = basics.paymentMethod;
  });

  it('creates an expense and lists it', async () => {
    const res = await createExpense(app, { categoryId: category.id, paymentMethodId: paymentMethod.id });
    expect(res.status).toBe(201);
    expect(res.body.amountCents).toBe(1000);

    const list = await request(app).get('/api/transactions');
    expect(list.body.total).toBe(1);
    expect(list.body.items[0].id).toBe(res.body.id);
  });

  it('rejects a future-dated transaction', async () => {
    const res = await createExpense(app, {
      date: '2999-01-01',
      categoryId: category.id,
      paymentMethodId: paymentMethod.id,
    });
    expect(res.status).toBe(400);
  });

  it('rejects a non-positive amount', async () => {
    const res = await createExpense(app, { amountCents: 0, categoryId: category.id, paymentMethodId: paymentMethod.id });
    expect(res.status).toBe(400);
  });

  it('rejects archived category and payment method references', async () => {
    await request(app).post(`/api/categories/${category.id}/archive`);
    await request(app).post(`/api/payment-methods/${paymentMethod.id}/archive`);

    const res = await createExpense(app, { categoryId: category.id, paymentMethodId: paymentMethod.id });
    expect(res.status).toBe(400);
  });

  it('rejects an expense with no categoryId', async () => {
    const res = await createExpense(app, { paymentMethodId: paymentMethod.id });
    expect(res.status).toBe(400);
  });

  it('deletes a transaction', async () => {
    const created = await createExpense(app, { categoryId: category.id, paymentMethodId: paymentMethod.id });
    const del = await request(app).delete(`/api/transactions/${created.body.id}`);
    expect(del.status).toBe(204);
    const get = await request(app).get(`/api/transactions/${created.body.id}`);
    expect(get.status).toBe(404);
  });
});
