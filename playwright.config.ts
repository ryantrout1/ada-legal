/**
 * Playwright config for persona (Layer 3) tests.
 *
 * By default tests run against a local dev server. Set PLAYWRIGHT_TARGET=preview
 * to instead run against the current Vercel preview URL (handy for CI
 * verification and for exercising the real deployed artifact).
 *
 * Usage:
 *   npm run test:personas            — runs against http://localhost:5173
 *                                      (vite dev server auto-started by webServer)
 *   npm run test:personas:preview    — runs against the Vercel preview
 *
 * Browser binaries are installed on demand via `npx playwright install chromium`.
 * This repo pins Chromium-only; we're not targeting cross-browser coverage
 * for the Ada UI at this phase.
 *
 * Ref: docs/ARCHITECTURE.md §13 — testing layers
 */

import { defineConfig, devices } from '@playwright/test';

const TARGET = process.env.PLAYWRIGHT_TARGET ?? 'local';
const PREVIEW_URL =
  process.env.PLAYWRIGHT_PREVIEW_URL ??
  'https://ada-legal-git-main-rttg123-6107s-projects.vercel.app';
const LOCAL_URL = 'http://localhost:5173';

export default defineConfig({
  testDir: './tests/personas',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html'], ['github']] : 'list',

  use: {
    baseURL: TARGET === 'preview' ? PREVIEW_URL : LOCAL_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Only spin up the local dev server when targeting local.
  ...(TARGET === 'local'
    ? {
        webServer: {
          command: 'npm run dev',
          url: LOCAL_URL,
          reuseExistingServer: !process.env.CI,
          timeout: 30_000,
        },
      }
    : {}),
});
