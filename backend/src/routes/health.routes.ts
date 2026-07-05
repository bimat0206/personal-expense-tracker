import { Router } from 'express';
import { sqlite } from '../db/client';

export const healthRoutes = Router();

healthRoutes.get('/health', (_req, res) => {
  try {
    sqlite.prepare('SELECT 1').get();
    res.json({ status: 'ok', dbConnected: true });
  } catch {
    res.status(503).json({ status: 'error', dbConnected: false });
  }
});
