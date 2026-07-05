import { z } from 'zod';
import { paymentMethodService } from '../services/config.service';
import { createConfigRoutes, baseConfigSchema } from './config-route-factory';

const createSchema = z.object({
  name: baseConfigSchema.name,
  sortOrder: baseConfigSchema.sortOrder,
  type: z.enum(['cash', 'credit', 'debit', 'bank_transfer', 'other']).optional(),
});
const updateSchema = createSchema.partial();

export const paymentMethodsRoutes = createConfigRoutes(paymentMethodService, createSchema, updateSchema);
