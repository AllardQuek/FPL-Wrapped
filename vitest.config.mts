import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    globals: false,
    server: {
      deps: {
        // Allow vi.doMock to intercept @elastic/elasticsearch.
        // Without this, node_modules are externalized and dynamic mocks
        // do not take effect for packages that use native CJS/ESM loaders.
        inline: ['@elastic/elasticsearch'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
