import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { buildApp, seedBasics } from '../fixtures/seed';

describe('Search API', () => {
  let app: Express;

  beforeEach(async () => {
    app = buildApp();
    await seedBasics(app);
  });

  it('rejects invalid limit and cursor values', async () => {
    const invalidLimit = await request(app).get('/api/search').query({ q: 'test', limit: '100000' });
    expect(invalidLimit.status).toBe(400);

    const invalidCursor = await request(app).get('/api/search').query({ q: 'test', cursor: '-1' });
    expect(invalidCursor.status).toBe(400);
  });
});
