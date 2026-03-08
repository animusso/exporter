import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'test/**',
        '**/*.test.{js,ts}',
        '**/*.config.{js,ts,cjs,mjs}',
        '**/*.d.ts',
        '**/index.ts',
        'build.js',
        'src/popup/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
    include: ['**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules/**/*'],
  },
  resolve: {
    alias: {
      '@/test': path.resolve(__dirname, './test'),
      '@': path.resolve(__dirname, './src'),
    },
  },
});
