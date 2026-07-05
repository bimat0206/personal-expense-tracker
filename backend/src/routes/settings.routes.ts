import { Router } from 'express';
import { z } from 'zod';
import * as settingsService from '../services/settings.service';
import * as backupService from '../services/backup.service';
import { validateBody } from '../middleware/validate';
import { wrap } from '../middleware/wrap';

export const settingsRoutes = Router();

const updateSchema = z.object({
  currencyCode: z.string().optional(),
  topExpensesCount: z.number().int().optional(),
  backupReminderThresholdDays: z.number().int().optional(),
});

const firstRunSchema = z.object({ currencyCode: z.string() });

settingsRoutes.get('/', wrap((_req, res) => {
  res.json({ ...settingsService.getSettings(), backupReminderDue: backupService.isBackupReminderDue() });
}));

settingsRoutes.put('/', validateBody(updateSchema), wrap((req, res) => {
  res.json(settingsService.updateSettings(req.body));
}));

settingsRoutes.post('/first-run', validateBody(firstRunSchema), wrap((req, res) => {
  res.json(settingsService.completeFirstRun(req.body.currencyCode));
}));
