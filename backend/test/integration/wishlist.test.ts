import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { buildApp, seedBasics } from '../fixtures/seed';

describe('Wish List API', () => {
  let app: Express;
  let category: { id: number };
  let paymentMethod: { id: number };

  beforeEach(async () => {
    app = buildApp();
    const basics = await seedBasics(app);
    category = basics.category;
    paymentMethod = basics.paymentMethod;
  });

  async function createItem() {
    return request(app)
      .post('/api/wishlist')
      .send({ month: 7, year: 2026, name: 'Headphones', estimatedCostCents: 15000, categoryId: category.id });
  }

  it('creates an item and includes it in the monthly total', async () => {
    await createItem();
    const list = await request(app).get('/api/wishlist').query({ year: 2026, month: 7 });
    expect(list.body.items).toHaveLength(1);
    expect(list.body.estimatedTotalCents).toBe(15000);
  });

  it('rejects marking purchased without a payment method', async () => {
    const created = await createItem();
    const res = await request(app).post(`/api/wishlist/${created.body.id}/purchase`).send({});
    expect(res.status).toBe(400);
  });

  it('marking purchased creates a linked transaction and updates status', async () => {
    const created = await createItem();
    const res = await request(app)
      .post(`/api/wishlist/${created.body.id}/purchase`)
      .send({ paymentMethodId: paymentMethod.id });
    expect(res.status).toBe(200);
    expect(res.body.wishListItem.status).toBe('purchased');
    expect(res.body.transaction.categoryId).toBe(category.id);

    // deleting the linked transaction reverts the item to planned
    await request(app).delete(`/api/transactions/${res.body.transaction.id}`);
    const list = await request(app).get('/api/wishlist').query({ year: 2026, month: 7 });
    expect(list.body.items[0].status).toBe('planned');
    expect(list.body.items[0].linkedTransactionId).toBeNull();
  });

  it('rejects purchasing an already-purchased item twice', async () => {
    const created = await createItem();
    await request(app).post(`/api/wishlist/${created.body.id}/purchase`).send({ paymentMethodId: paymentMethod.id });
    const second = await request(app)
      .post(`/api/wishlist/${created.body.id}/purchase`)
      .send({ paymentMethodId: paymentMethod.id });
    expect(second.status).toBe(409);
  });

  it('copy-to-next-month creates an independent copy', async () => {
    const created = await createItem();
    const copy = await request(app).post(`/api/wishlist/${created.body.id}/copy-next-month`);
    expect(copy.status).toBe(201);
    expect(copy.body.month).toBe(8);
    expect(copy.body.year).toBe(2026);

    const original = await request(app).get('/api/wishlist').query({ year: 2026, month: 7 });
    expect(original.body.items[0].status).toBe('planned');
  });
});
