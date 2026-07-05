import { Router } from 'express';
import multer from 'multer';
import * as attachmentService from '../services/attachment.service';
import { config } from '../config';
import { wrap } from '../middleware/wrap';

export const attachmentsRoutes = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.attachmentMaxSizeBytes } });

// Matches the OpenAPI Attachment schema exactly — `filePath` (internal storage location) is
// never exposed over the API.
function toApiShape(row: { id: string; fileName: string; mimeType: string; sizeBytes: number; transactionId: number }) {
  return { id: row.id, filename: row.fileName, mimeType: row.mimeType, sizeBytes: row.sizeBytes, transactionId: row.transactionId };
}

attachmentsRoutes.post('/:id/attachment', upload.single('file'), wrap((req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'file is required' });
    return;
  }
  const { row, created } = attachmentService.upload(Number(req.params.id), {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    buffer: req.file.buffer,
  });
  res.status(created ? 201 : 200).json(toApiShape(row));
}));

attachmentsRoutes.get('/:id/attachment', wrap((req, res) => {
  const attachment = attachmentService.getByTransactionId(Number(req.params.id));
  res.download(attachment.filePath, attachment.fileName);
}));

attachmentsRoutes.delete('/:id/attachment', wrap((req, res) => {
  attachmentService.remove(Number(req.params.id));
  res.status(204).end();
}));
