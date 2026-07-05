import { RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import { badRequest } from '../lib/errors';

/** Validates and replaces req.body with the parsed (typed) result. Server-side, never trusts the client. */
export function validateBody(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || '(root)',
        message: issue.message,
      }));
      next(badRequest('Validation failed', details));
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || '(root)',
        message: issue.message,
      }));
      next(badRequest('Validation failed', details));
      return;
    }
    (req as unknown as { validatedQuery: unknown }).validatedQuery = result.data;
    next();
  };
}
