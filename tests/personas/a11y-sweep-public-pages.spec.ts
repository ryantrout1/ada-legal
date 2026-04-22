/**
 * Persona #6 — a11y axe sweep of key public pages
 * Step 28, Commit 2.
 *
 * Tags: @harness-a @a11y
 *
 * Runs @axe-core/playwright against the two highest-traffic public
 * pages (homepage + /class-actions directory) and records any
 * violations in the persona trace. Fails if any serious or critical
 * violation is detected.
 *
 * This is a LIGHTWEIGHT Harness A sweep. The full WCAG 2.2 AAA
 * audit lives in tests/a11y/aaa-audit.spec.ts and runs separately
 * via `npm run test:a11y`. This persona is the daily-smoke
 * equivalent: if a recent code change introduced a hard
 * accessibility regression (missing label, broken contrast, etc.)
 * the nightly run flags it the next morning.
 *
 * Pass criteria:
 *   - No serious or critical axe violations on / or /class-actions
 *   - Moderate/minor violations are logged in the trace but don't
 *     fail the persona (matches the tolerance of aaa-audit.spec.ts)
 */

import AxeBuilder from '@axe-core/playwright';
import { test } from './harness/personaHarness.js';

const ROUTES = [
  { path: '/', name: 'homepage' },
  { path: '/class-actions', name: 'class-actions-directory' },
];

const AAA_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag2aaa',
  'wcag21a',
  'wcag21aa',
  'wcag21aaa',
  'wcag22aa',
  'wcag22aaa',
];

test.describe.configure({ mode: 'serial' });

test(
  'a11y-sweep-public-pages',
  {
    tag: ['@harness-a', '@a11y'],
  },
  async ({ page, recorder }) => {
    // Works against any target — axe is a static page analysis.
    // Don't skip for local; this one is useful during dev too.

    page.on('pageerror', (err) => {
      recorder.step('console-error', { message: err.message });
    });

    let totalSerious = 0;
    let totalCritical = 0;
    const summaries: Array<{
      route: string;
      critical: number;
      serious: number;
      moderate: number;
      minor: number;
    }> = [];

    for (const route of ROUTES) {
      await page.goto(route.path);
      recorder.navigate(route.path);
      recorder.step(`scanning-${route.name}`);

      // Small wait — some content finishes rendering after mount
      // (Helmet injects meta, client fetches listings, etc.) and
      // axe should audit the fully-rendered DOM.
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(AAA_TAGS)
        .analyze();

      const critical = results.violations.filter(
        (v) => v.impact === 'critical',
      );
      const serious = results.violations.filter(
        (v) => v.impact === 'serious',
      );
      const moderate = results.violations.filter(
        (v) => v.impact === 'moderate',
      );
      const minor = results.violations.filter((v) => v.impact === 'minor');

      summaries.push({
        route: route.name,
        critical: critical.length,
        serious: serious.length,
        moderate: moderate.length,
        minor: minor.length,
      });

      // Log details for any violation, regardless of impact — the
      // trace file is where someone scanning results looks first.
      for (const v of results.violations) {
        recorder.step(`axe-violation-${route.name}`, {
          impact: v.impact ?? 'unknown',
          id: v.id,
          description: v.description,
          help: v.help,
          nodeCount: v.nodes.length,
          sampleTarget: v.nodes[0]?.target?.join(' ') ?? '(none)',
        });
      }

      totalCritical += critical.length;
      totalSerious += serious.length;
    }

    // Synthesize a "turn"-like record so transcript.md has something
    // readable. (There's no user/assistant dialogue here — the axe
    // scan is the whole content.)
    for (const s of summaries) {
      recorder.assistantTurn(
        `Route: ${s.route}\n` +
          `  critical: ${s.critical}\n` +
          `  serious: ${s.serious}\n` +
          `  moderate: ${s.moderate}\n` +
          `  minor: ${s.minor}`,
      );
    }

    recorder.assertion(
      'no-critical-a11y-violations',
      totalCritical === 0,
      `${totalCritical} critical axe violations across ${ROUTES.length} routes`,
    );
    recorder.assertion(
      'no-serious-a11y-violations',
      totalSerious === 0,
      `${totalSerious} serious axe violations across ${ROUTES.length} routes`,
    );

    if (recorder.trace.assertions.failed > 0) {
      throw new Error(
        `${recorder.trace.assertions.failed} a11y assertion(s) failed. See ` +
          `test-results/personas/<run>/${recorder.trace.slug}/trace.json for details`,
      );
    }
  },
);
