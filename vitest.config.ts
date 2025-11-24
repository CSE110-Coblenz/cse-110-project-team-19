import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    pool: 'forks',
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    // Force exit after tests complete
    isolate: true,
    // This helps identify what's keeping the process alive
    logHeapUsage: true
  },
});
