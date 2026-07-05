import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: {
      DATABASE_PATH: ':memory:',
      ATTACHMENTS_PATH: './test/tmp/attachments',
      TMP_IMPORTS_PATH: './test/tmp/imports',
    },
    setupFiles: ['./test/setup.ts'],
  },
});
