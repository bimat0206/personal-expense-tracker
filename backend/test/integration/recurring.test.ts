import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { buildApp, seedBasics } from '../fixtures/seed';

describe('Recurring Rules API', () => {
  let app: Express;
  let category: { id: number };
  let paymentMethod: { id: number };

  beforeEach(async () => {
    app = buildApp();
    const basics = await seedBasics(app);
    category = basics.category;
    paymentMethod = basics.paymentMethod;
  });

  it('generates a due transaction immediately when startDate is today', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const rule = await request(app).post('/api/recurring-rules').send({
      type: 'expense',
      amountCents: 1200,
      categoryId: category.id,
      paymentMethodId: paymentMethod.id,
      frequency: 'monthly',
      startDate: today,
    });
    expect(rule.status).toBe(201);

    const list = await request(app).get('/api/transactions');
    expect(list.body.total).toBe(1);
    expect(list.body.items[0].recurringRuleId).toBe(rule.body.id);
    expect(list.body.items[0].occurrenceDate).toBe(today);
  });

  it('is idempotent — calling generate twice does not create duplicates', async () => {
    const today = new Date().toISOString().slice(0, 10);
    await request(app).post('/api/recurring-rules').send({
      type: 'expense',
      amountCents: 500,
      categoryId: category.id,
      paymentMethodId: paymentMethod.id,
      frequency: 'weekly',
      startDate: today,
    });
    await request(app).post('/api/recurring-rules/generate');
    const second = await request(app).post('/api/recurring-rules/generate');
    expect(second.body.generated).toHaveLength(0);

    const list = await request(app).get('/api/transactions');
    expect(list.body.total).toBe(1);
  });

  it('stopping a rule prevents further generation but keeps past transactions', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const rule = await request(app).post('/api/recurring-rules').send({
      type: 'expense',
      amountCents: 500,
      categoryId: category.id,
      paymentMethodId: paymentMethod.id,
      frequency: 'weekly',
      startDate: today,
    });
    await request(app).post('/api/recurring-rules/generate');
    await request(app).post(`/api/recurring-rules/${rule.body.id}/stop`);
    const gen = await request(app).post('/api/recurring-rules/generate');
    expect(gen.body.generated).toHaveLength(0);

    const list = await request(app).get('/api/transactions');
    expect(list.body.total).toBe(1);
  });
});
