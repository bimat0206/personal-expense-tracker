import { z } from 'zod';
import { categoryService } from '../services/config.service';
import { createConfigRoutes, baseConfigSchema } from './config-route-factory';

const createSchema = z.object({ ...baseConfigSchema, icon: z.string().nullish() });
const updateSchema = createSchema.partial();

export const categoriesRoutes = createConfigRoutes(categoryService, createSchema, updateSchema);
