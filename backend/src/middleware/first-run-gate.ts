import { RequestHandler } from 'express';
import { db } from '../db/db';
import { appSettings } from '../db/schema';
import { preconditionRequired } from '../lib/errors';

const EXEMPT_PATHS = ['/api/health', '/api/settings', '/api/settings/first-run', '/api/system/today'];

/** Gates the rest of the API until first-run setup (PRD §5.13) has completed. */
export const firstRunGate: RequestHandler = (req, _res, next) => {
  if (EXEMPT_PATHS.includes(req.path)) {
    next();
    return;
  }
  const settings = db.select().from(appSettings).get();
  if (!settings?.firstRunCompletedAt) {
    next(preconditionRequired('First-run setup has not been completed yet'));
    return;
  }
  next();
};
