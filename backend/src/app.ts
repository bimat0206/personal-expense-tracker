import express from 'express';
import cors from 'cors';
import { healthRoutes } from './routes/health.routes';
import { transactionsRoutes } from './routes/transactions.routes';
import { attachmentsRoutes } from './routes/attachments.routes';
import { categoriesRoutes } from './routes/categories.routes';
import { incomeSourcesRoutes } from './routes/income-sources.routes';
import { paymentMethodsRoutes } from './routes/payment-methods.routes';
import { tagsRoutes } from './routes/tags.routes';
import { dashboardRoutes, systemRoutes } from './routes/dashboard.routes';
import { wishlistRoutes } from './routes/wishlist.routes';
import { searchRoutes } from './routes/search.routes';
import { importRoutes } from './routes/import.routes';
import { backupRoutes } from './routes/backup.routes';
import { recurringRulesRoutes } from './routes/recurring-rules.routes';
import { settingsRoutes } from './routes/settings.routes';
import { firstRunGate } from './middleware/first-run-gate';
import { errorHandler } from './middleware/error-handler';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(firstRunGate);

  app.use('/api', healthRoutes);
  app.use('/api/transactions', transactionsRoutes);
  app.use('/api/transactions', attachmentsRoutes);
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/income-sources', incomeSourcesRoutes);
  app.use('/api/payment-methods', paymentMethodsRoutes);
  app.use('/api/tags', tagsRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/system', systemRoutes);
  app.use('/api/wishlist', wishlistRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/import', importRoutes);
  app.use('/api/backup', backupRoutes);
  app.use('/api/recurring-rules', recurringRulesRoutes);
  app.use('/api/settings', settingsRoutes);

  app.use(errorHandler);
  return app;
}
