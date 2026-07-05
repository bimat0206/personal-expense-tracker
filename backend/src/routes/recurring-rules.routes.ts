import { Router } from 'express';
import { z } from 'zod';
import * as recurringService from '../services/recurring.service';
import { validateBody } from '../middleware/validate';
import { wrap } from '../middleware/wrap';

export const recurringRulesRoutes = Router();

const createSchema = z.object({
  type: z.enum(['expense', 'income']),
  amountCents: z.number().int(),
  categoryId: z.number().int().optional(),
  incomeSourceId: z.number().int().optional(),
  paymentMethodId: z.number().int(),
  frequency: z.enum(['weekly', 'monthly', 'yearly']),
  startDate: z.string(),
  endDate: z.string().optional(),
});
const updateSchema = createSchema.partial();

recurringRulesRoutes.get('/', wrap((req, res) => {
  res.json(recurringService.list(req.query.includeStopped === 'true'));
}));

recurringRulesRoutes.post('/', validateBody(createSchema), wrap((req, res) => {
  res.status(201).json(recurringService.create(req.body));
}));

recurringRulesRoutes.put('/:id', validateBody(updateSchema), wrap((req, res) => {
  res.json(recurringService.update(Number(req.params.id), req.body));
}));

recurringRulesRoutes.post('/:id/stop', wrap((req, res) => {
  res.json(recurringService.stop(Number(req.params.id)));
}));

recurringRulesRoutes.post('/:id/resume', wrap((req, res) => {
  res.json(recurringService.resume(Number(req.params.id)));
}));

recurringRulesRoutes.post('/generate', wrap((_req, res) => {
  res.json({ generated: recurringService.generate() });
}));
