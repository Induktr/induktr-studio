import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'apps/web/src'),
      'bun:sqlite': resolve(__dirname, 'apps/api/src/bun-sqlite-shim.ts'),
    },
  },
  test: {
    include: ['**/*.spec.ts'],
    exclude: ['**/dist/**', '**/node_modules/**', '**/.next/**'],
  },
});
