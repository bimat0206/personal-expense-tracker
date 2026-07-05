import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../src/app';
import { resetDb } from './reset';

/** Each test file shares one in-memory DB across its `it()` blocks (see reset.ts) — reset on every buildApp() call. */
export function buildApp(): Express {
  resetDb();
  return createApp();
}

export async function completeFirstRun(app: Express): Promise<void> {
  await request(app).post('/api/settings/first-run').send({ currencyCode: 'USD' });
}

export async function createCategory(app: Express, name = 'Food'): Promise<{ id: number }> {
  const res = await request(app).post('/api/categories').send({ name });
  return res.body;
}

export async function createIncomeSource(app: Express, name = 'Salary'): Promise<{ id: number }> {
  const res = await request(app).post('/api/income-sources').send({ name });
  return res.body;
}

export async function createPaymentMethod(app: Express, name = 'Cash'): Promise<{ id: number }> {
  const res = await request(app).post('/api/payment-methods').send({ name, type: 'cash' });
  return res.body;
}

/** Completes first-run and returns one active category/income source/payment method to build fixtures with. */
export async function seedBasics(app: Express) {
  await completeFirstRun(app);
  const category = await createCategory(app, 'Test Category');
  const incomeSource = await createIncomeSource(app, 'Test Income Source');
  const paymentMethod = await createPaymentMethod(app, 'Test Payment Method');
  return { category, incomeSource, paymentMethod };
}
