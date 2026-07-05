import { Router } from 'express';
import * as searchService from '../services/search.service';
import { badRequest } from '../lib/errors';
import { wrap } from '../middleware/wrap';

export const searchRoutes = Router();

function parseBoundedInt(value: unknown, field: string, defaultValue: number, min: number, max: number): number {
  if (value === undefined) return defaultValue;
  if (Array.isArray(value)) throw badRequest(`${field} must be a single integer`);
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw badRequest(`${field} must be an integer between ${min} and ${max}`);
  }
  return parsed;
}

searchRoutes.get('/', wrap((req, res) => {
  const q = req.query.q as string | undefined;
  if (!q) throw badRequest('q is required');
  const cursor = parseBoundedInt(req.query.cursor, 'cursor', 0, 0, Number.MAX_SAFE_INTEGER);
  const limit = parseBoundedInt(req.query.limit, 'limit', 100, 1, 100);
  res.json(searchService.search(q, cursor, limit));
}));
