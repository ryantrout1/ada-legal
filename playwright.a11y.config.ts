/**
 * Playwright config for the axe-core WCAG 2.2 AAA audit.
 *
 * Separate from playwright.config.ts (persona tests) because:
 *   - A11y tests run against every public route with a fixed config,
 *     whereas persona tests are flow-based
 *   - A11y tests should run on every commit; persona tests on demand
 *   - Reporting format differs (we want full violation logs visible)
 *
 * Usage:
 *   npm run test:a11y                    — local, vite dev server auto-starts
 *   PLAYWRIGHT_TARGET=preview npm run test:a11y
 *                                        — against the deployed preview URL
 */

import { defineConfig, devices } from '@playwright/test';

const TARGET = process.env.PLAYWRIGHT_TARGET ?? 'local';
const PREVIEW_URL =
  process.env.PLAYWRIGHT_PREVIEW_URL ??
  'https://ada-legal-git-main-rttg123-6107s-projects.vercel.app';
const LOCAL_URL = 'http://localhost:5173';

export default defineConfig({
  testDir: './tests/a11y',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',

  use: {
    baseURL: TARGET === 'preview' ? PREVIEW_URL : LOCAL_URL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

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
