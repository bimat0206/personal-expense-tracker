import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { buildApp, seedBasics } from '../fixtures/seed';

describe('Dashboard API', () => {
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
      .send({ type: 'expense', date: '2026-03-10', amountCents: 2000, categoryId: category.id, paymentMethodId: paymentMethod.id });
  });

  it('returns zero-filled totals for a year with no transactions, not an error', async () => {
    const res = await request(app).get('/api/dashboard/annual').query({ year: 2020 });
    expect(res.status).toBe(200);
    expect(res.body.totals).toEqual({ incomeCents: 0, expenseCents: 0, netCents: 0 });
  });

  it('aggregates totals and top expenses for a year with data', async () => {
    const res = await request(app).get('/api/dashboard/annual').query({ year: 2026 });
    expect(res.body.totals.expenseCents).toBe(2000);
    expect(res.body.topExpenses).toHaveLength(1);
  });

  it('comparison against a zero-data year returns null percentages, not an error', async () => {
    const res = await request(app).get('/api/dashboard/annual/compare').query({ yearA: 2020, yearB: 2026 });
    expect(res.status).toBe(200);
    expect(res.body.delta.expensePct).toBeNull();
  });

  it('lists available years including the current year even if empty', async () => {
    const res = await request(app).get('/api/dashboard/years');
    const year2026 = res.body.years.find((y: { year: number }) => y.year === 2026);
    expect(year2026.hasData).toBe(true);
  });
});
