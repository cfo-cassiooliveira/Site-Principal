import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.mjs'],
    coverage: {
      provider: 'v8',
      // lcov é o formato lido pelo SonarQube (sonar.javascript.lcov.reportPaths).
      reporter: ['text-summary', 'lcov'],
      include: ['js/**/*.js', 'server.js'],
    },
  },
});
