import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './demo/tests/browser',
  testMatch: '**/*.spec.mjs',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:4173/demo/',
    browserName: 'chromium'
  },
  projects: [
    {
      name: 'chromium'
    }
  ],
  webServer: {
    command: 'http-server . -p 4173 -c-1',
    url: 'http://127.0.0.1:4173/demo/',
    reuseExistingServer: !process.env.CI
  }
});
