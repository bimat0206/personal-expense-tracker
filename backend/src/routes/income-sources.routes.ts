import { z } from 'zod';
import { incomeSourceService } from '../services/config.service';
import { createConfigRoutes, baseConfigSchema } from './config-route-factory';

const createSchema = z.object({ ...baseConfigSchema, icon: z.string().optional() });
const updateSchema = createSchema.partial();

export const incomeSourcesRoutes = createConfigRoutes(incomeSourceService, createSchema, updateSchema);
