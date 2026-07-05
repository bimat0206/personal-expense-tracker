import { sqlite } from '../../src/db/client';

const TABLES_IN_FK_SAFE_ORDER = [
  'transaction_tags',
  'attachments',
  'transactions',
  'wish_list_items',
  'recurring_rules',
  'categories',
  'income_sources',
  'payment_methods',
  'tags',
  'app_settings',
];

/** Each test file shares one in-memory DB across its `it()` blocks — reset between tests for isolation. */
export function resetDb(): void {
  for (const table of TABLES_IN_FK_SAFE_ORDER) {
    sqlite.exec(`DELETE FROM ${table};`);
  }
}
