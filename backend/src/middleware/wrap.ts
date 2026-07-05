import type { RequestHandler, Request, Response, NextFunction } from 'express';

/**
 * Wraps a synchronous Express route handler so that any thrown error
 * (including AppError from service layer) is forwarded to the central
 * error-handler middleware via next(err).
 *
 * Without this, synchronous throws inside handlers with arity < 4 are
 * silently swallowed by Express rather than being forwarded to errorHandler.
 */
export function wrap(fn: (req: Request, res: Response, next: NextFunction) => unknown): RequestHandler {
  return (req, res, next) => {
    try {
      fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}
