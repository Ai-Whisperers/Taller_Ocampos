import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./frontend/tests/setup.ts'],
    include: [
      'frontend/src/**/*.{test,spec}.{ts,tsx}',
      'frontend/tests/**/*.{test,spec}.{ts,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      'build',
      'coverage',
      '**/*.e2e.{test,spec}.{ts,tsx}'
    ],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html', 'lcov', 'clover'],
      reportsDirectory: './coverage/frontend',
      include: [
        'frontend/src/**/*.{ts,tsx}'
      ],
      exclude: [
        'frontend/src/**/*.d.ts',
        'frontend/src/**/*.stories.{ts,tsx}',
        'frontend/src/**/*.test.{ts,tsx}',
        'frontend/src/types/**/*',
        'frontend/src/assets/**/*'
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src'),
      '@tests': path.resolve(__dirname, './frontend/tests')
    }
  }
});