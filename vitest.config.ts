import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    pool: 'forks',
    forks: {
      singleFork: true,
    },
    isolate: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.d.ts'],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
      },
    },
  },
  resolve: {
    alias: {
      '@app': resolve(__dirname, './src/app'),
      '@shared': resolve(__dirname, './src/app/shared'),
      '@auth': resolve(__dirname, './src/app/auth'),
      '@utils': resolve(__dirname, './src/app/utils'),
    },
  },
});