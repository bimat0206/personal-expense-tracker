import { Router } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { today } from '../lib/date';
import { badRequest } from '../lib/errors';
import { wrap } from '../middleware/wrap';

export const dashboardRoutes = Router();

dashboardRoutes.get('/years', wrap((_req, res) => {
  res.json(dashboardService.getAvailableYears());
}));

dashboardRoutes.get('/annual', wrap((req, res) => {
  const year = Number(req.query.year);
  if (!year) throw badRequest('year is required');
  res.json(dashboardService.getAnnual(year));
}));

dashboardRoutes.get('/annual/compare', wrap((req, res) => {
  const yearA = Number(req.query.yearA);
  const yearB = Number(req.query.yearB);
  if (!yearA || !yearB) throw badRequest('yearA and yearB are required');
  res.json(dashboardService.compareYears(yearA, yearB));
}));

dashboardRoutes.get('/monthly', wrap((req, res) => {
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  if (!year || !month) throw badRequest('year and month are required');
  res.json(dashboardService.getMonthly(year, month));
}));

export const systemRoutes = Router();
systemRoutes.get('/today', (_req, res) => {
  res.json({ date: today() });
});
