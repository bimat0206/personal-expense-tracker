import { createApp } from './app';
import { config } from './config';
import { runMigrations } from './db/migrate';
import { sweepExpiredImports } from './lib/file-token';
import { generate as generateRecurring } from './services/recurring.service';

runMigrations();
sweepExpiredImports();
generateRecurring();

const app = createApp();
app.listen(config.port, config.host, () => {
  console.log(`Backend listening on http://${config.host}:${config.port}`);
});
