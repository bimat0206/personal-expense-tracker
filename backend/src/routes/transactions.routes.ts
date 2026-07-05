import { Router } from 'express';
import { z } from 'zod';
import * as transactionService from '../services/transaction.service';
import { validateBody } from '../middleware/validate';
import { wrap } from '../middleware/wrap';

export const transactionsRoutes = Router();

const createSchema = z.object({
  type: z.enum(['expense', 'income']),
  date: z.string(),
  amountCents: z.number().int(),
  categoryId: z.number().int().optional(),
  incomeSourceId: z.number().int().optional(),
  paymentMethodId: z.number().int(),
  note: z.string().max(500).optional(),
  tagIds: z.array(z.number().int()).optional(),
});
const updateSchema = createSchema.partial();

transactionsRoutes.get('/', wrap((req, res) => {
  const q = req.query;
  const result = transactionService.list({
    dateFrom: q.dateFrom as string | undefined,
    dateTo: q.dateTo as string | undefined,
    type: q.type as string | undefined,
    categoryId: q.categoryId ? Number(q.categoryId) : undefined,
    incomeSourceId: q.incomeSourceId ? Number(q.incomeSourceId) : undefined,
    paymentMethodId: q.paymentMethodId ? Number(q.paymentMethodId) : undefined,
    tagId: q.tagId ? Number(q.tagId) : undefined,
    page: q.page ? Number(q.page) : 1,
    pageSize: q.pageSize ? Number(q.pageSize) : 50,
  });
  res.json(result);
}));

transactionsRoutes.post('/', validateBody(createSchema), wrap((req, res) => {
  res.status(201).json(transactionService.create(req.body));
}));

transactionsRoutes.get('/:id', wrap((req, res) => {
  res.json(transactionService.getById(Number(req.params.id)));
}));

transactionsRoutes.put('/:id', validateBody(updateSchema), wrap((req, res) => {
  res.json(transactionService.update(Number(req.params.id), req.body));
}));

transactionsRoutes.delete('/:id', wrap((req, res) => {
  transactionService.remove(Number(req.params.id));
  res.status(204).end();
}));
