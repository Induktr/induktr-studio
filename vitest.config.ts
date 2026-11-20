import { resolveSync } from 'bun';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolveSync(__dirname, 'apps/web/src'),
      'bun:sqlite': resolveSync(__dirname, 'apps/api/src/bun-sqlite-shim.ts'),
    },
  },
  test: {
    include: ['**/*.spec.ts'],
    exclude: ['**/dist/**', '**/node_modules/**', '**/.next/**'],
  },
});
