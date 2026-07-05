import { Router } from 'express';
import { z, ZodSchema } from 'zod';
import { validateBody } from '../middleware/validate';
import { wrap } from '../middleware/wrap';

interface ConfigService {
  list: (includeArchived: boolean) => unknown[];
  create: (data: Record<string, unknown>) => unknown;
  update: (id: number, data: Record<string, unknown>) => unknown;
  archive: (id: number) => unknown;
  unarchive: (id: number) => unknown;
  remove: (id: number) => void;
}

/** Shared route wiring for the four taxonomy entities — identical CRUD/archive rules (PRD §5.2). */
export function createConfigRoutes(service: ConfigService, createSchema: ZodSchema, updateSchema: ZodSchema): Router {
  const router = Router();

  router.get('/', wrap((req, res) => {
    const includeArchived = req.query.includeArchived === 'true';
    res.json(service.list(includeArchived));
  }));

  router.post('/', validateBody(createSchema), wrap((req, res) => {
    res.status(201).json(service.create(req.body));
  }));

  router.put('/:id', validateBody(updateSchema), wrap((req, res) => {
    res.json(service.update(Number(req.params.id), req.body));
  }));

  router.post('/:id/archive', wrap((req, res) => {
    res.json(service.archive(Number(req.params.id)));
  }));

  router.post('/:id/unarchive', wrap((req, res) => {
    res.json(service.unarchive(Number(req.params.id)));
  }));

  router.delete('/:id', wrap((req, res) => {
    service.remove(Number(req.params.id));
    res.status(204).end();
  }));

  return router;
}

export const baseConfigSchema = {
  name: z.string().min(1),
  color: z.string().nullish(),
  sortOrder: z.number().int().optional(),
};
