import { z } from 'zod';
import { tagService } from '../services/config.service';
import { createConfigRoutes, baseConfigSchema } from './config-route-factory';

const createSchema = z.object(baseConfigSchema);
const updateSchema = createSchema.partial();

export const tagsRoutes = createConfigRoutes(tagService, createSchema, updateSchema);
