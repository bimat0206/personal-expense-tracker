import { Router } from 'express';
import { z } from 'zod';
import * as wishlistService from '../services/wishlist.service';
import { validateBody } from '../middleware/validate';
import { badRequest } from '../lib/errors';
import { wrap } from '../middleware/wrap';

export const wishlistRoutes = Router();

const createSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  name: z.string().min(1),
  estimatedCostCents: z.number().int(),
  categoryId: z.number().int(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  note: z.string().max(500).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  estimatedCostCents: z.number().int().optional(),
  categoryId: z.number().int().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  note: z.string().max(500).optional(),
  status: z.enum(['planned', 'abandoned']).optional(),
});

const purchaseSchema = z.object({
  amountCents: z.number().int().optional(),
  date: z.string().optional(),
  paymentMethodId: z.number().int(),
});

wishlistRoutes.get('/', wrap((req, res) => {
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  if (!year || !month) throw badRequest('year and month are required');
  res.json(wishlistService.listForMonth(year, month));
}));

wishlistRoutes.post('/', validateBody(createSchema), wrap((req, res) => {
  res.status(201).json(wishlistService.create(req.body));
}));

wishlistRoutes.put('/:id', validateBody(updateSchema), wrap((req, res) => {
  res.json(wishlistService.update(Number(req.params.id), req.body));
}));

wishlistRoutes.delete('/:id', wrap((req, res) => {
  wishlistService.remove(Number(req.params.id));
  res.status(204).end();
}));

wishlistRoutes.post('/:id/purchase', validateBody(purchaseSchema), wrap((req, res) => {
  res.json(wishlistService.purchase(Number(req.params.id), req.body));
}));

wishlistRoutes.post('/:id/copy-next-month', wrap((req, res) => {
  res.status(201).json(wishlistService.copyToNextMonth(Number(req.params.id)));
}));
