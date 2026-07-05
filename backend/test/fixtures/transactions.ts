import request from 'supertest';
import { Express } from 'express';

export async function createExpense(
  app: Express,
  overrides: Partial<{ date: string; amountCents: number; categoryId: number; paymentMethodId: number; note: string }>,
) {
  const res = await request(app)
    .post('/api/transactions')
    .send({
      type: 'expense',
      date: '2026-01-15',
      amountCents: 1000,
      ...overrides,
    });
  return res;
}
