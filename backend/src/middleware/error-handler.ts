import { ErrorRequestHandler } from 'express';
import { AppError } from '../lib/errors';

/** Central error mapping (SYSTEM_DESIGN.md §12). Never leaks stack traces to the client. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
    return;
  }
  if (err?.name === 'MulterError') {
    res.status(400).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong, please try again.' });
};
