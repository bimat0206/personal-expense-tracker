import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import * as csvImportService from '../services/csv-import.service';
import { validateBody } from '../middleware/validate';
import { badRequest } from '../lib/errors';
import { config } from '../config';
import { wrap } from '../middleware/wrap';

export const importRoutes = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.csvUploadMaxSizeBytes } });

importRoutes.post('/csv/preview', upload.single('file'), wrap((req, res) => {
  if (!req.file) throw badRequest('file is required');
  res.json(csvImportService.preview(req.file.buffer));
}));

const commitSchema = z.object({
  fileToken: z.string(),
  mapping: z.object({
    date: z.string(),
    note: z.string().optional(),
    amount: z.string().optional(),
    type: z.string().optional(),
    signedAmount: z.string().optional(),
  }),
  defaultCategoryId: z.number().int().optional(),
  defaultIncomeSourceId: z.number().int().optional(),
  defaultPaymentMethodId: z.number().int(),
});

importRoutes.post('/csv/commit', validateBody(commitSchema), wrap((req, res) => {
  const jobId = csvImportService.startCommit(req.body);
  res.status(202).json({ jobId });
}));

importRoutes.get('/csv/commit/:jobId', wrap((req, res) => {
  res.json(csvImportService.getJob(req.params.jobId));
}));
