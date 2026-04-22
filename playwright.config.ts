/**
 * Playwright config for persona (Layer 3) tests.
 *
 * Three targets:
 *   local   (default)  — http://localhost:5173 via auto-started vite dev
 *   preview            — git-main Vercel preview URL
 *   prod               — https://ada.adalegallink.com
 *
 * Usage:
 *   npm run test:personas                                    # local
 *   npm run test:personas:preview                            # preview
 *   PLAYWRIGHT_TARGET=prod npm run test:personas             # prod
 *   PLAYWRIGHT_PREVIEW_URL=<url> npm run test:personas:preview  # custom preview
 *
 * Artifact recording:
 *   Every persona test gets its own trace.json / transcript.md /
 *   assertions.log under test-results/personas/<run-id>/<persona-slug>/.
 *   The run-id is either the PERSONA_RUN_ID env var (for grouping
 *   multiple invocations) or an ISO timestamp minted per invocation.
 *
 * Ref: Step 28, Commit 1.
 */

import { defineConfig, devices } from '@playwright/test';

const TARGET = process.env.PLAYWRIGHT_TARGET ?? 'local';
const PREVIEW_URL =
  process.env.PLAYWRIGHT_PREVIEW_URL ??
  'https://ada-legal-git-main-rttg123-6107s-projects.vercel.app';
const PROD_URL = 'https://ada.adalegallink.com';
const LOCAL_URL = 'http://localhost:5173';

function resolveBaseUrl(): string {
  switch (TARGET) {
    case 'prod':
      return PROD_URL;
    case 'preview':
      return PREVIEW_URL;
    case 'local':
    default:
      return LOCAL_URL;
  }
}

export default defineConfig({
  testDir: './tests/personas',
  // Persona tests call real LLMs; 30s is tight when Ada takes 12s to
  // respond and we do 5+ turns. Bumped to 120s.
  timeout: 120_000,
  // Sequential by default — persona tests share state via the chat UI
  // + anon cookies in a single browser, and running them in parallel
  // hits the same session cookie and clobbers each other unless
  // isolated. Isolation is fixture-level work we can add later.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html'], ['github']] : 'list',

  use: {
    baseURL: resolveBaseUrl(),
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
