import { Router } from 'express';
import multer from 'multer';
import * as backupService from '../services/backup.service';
import { badRequest } from '../lib/errors';
import { config } from '../config';
import { wrap } from '../middleware/wrap';

export const backupRoutes = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.backupUploadMaxSizeBytes } });

backupRoutes.get('/export', wrap((_req, res) => {
  res.json(backupService.exportData());
}));

backupRoutes.post('/import', upload.single('file'), wrap((req, res) => {
  if (!req.file) throw badRequest('file is required');
  const confirm = req.body.confirm === 'true' || req.body.confirm === true;
  let payload;
  try {
    payload = JSON.parse(req.file.buffer.toString('utf-8'));
  } catch {
    throw badRequest('file is not valid JSON');
  }
  res.json(backupService.importData(payload, confirm));
}));
