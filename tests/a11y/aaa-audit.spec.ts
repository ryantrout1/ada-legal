/**
 * Automated WCAG 2.2 AAA accessibility audit via axe-core — theme matrix.
 *
 * Phase 2 (AAA remediation) rebuild. THREE holes in the previous version
 * let real contrast defects ship, all fixed here:
 *
 *   1. It ran the DEFAULT theme only — never set data-display, so
 *      Dark / Contrast / Warm / Low Vision were never audited. Every
 *      screenshot defect lived in a non-default theme. → We now sweep all
 *      5 display themes (tests/a11y/lib/themes.ts).
 *   2. It only FAILED on serious/critical impact — axe files most contrast
 *      issues as "moderate", so real contrast failures were logged and
 *      waved through. → color-contrast-enhanced (AAA 7:1) now BLOCKS at any
 *      impact.
 *   3. It used a hardcoded 10-route list (with a lawsuit slug that no
 *      longer exists). → Routes are generated (tests/a11y/lib/routes.ts).
 *
 * axe "incomplete" contrast results (backgrounds it can't resolve —
 * gradients / images, i.e. the hero sections) are captured as must-review
 * with a screenshot rather than silently passed.
 *
 * Findings are written per (route × theme) to test-results/a11y-findings/
 * (parallel-safe); scripts/a11y-report.mjs merges them into
 * test-results/a11y-report.md — report v1.
 *
 * What this DOES NOT catch (see docs/A11Y-MANUAL-CHECKLIST.md): screen
 * reader timing, reading order, keyboard/DnD logic, plain-language quality.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { AUDIT_ROUTES } from './lib/routes.js';
import { DISPLAY_THEMES, applyThemeToPage } from './lib/themes.js';
import type { Finding } from './lib/report.js';

const AAA_TAGS = [
  'wcag2a', 'wcag2aa', 'wcag2aaa',
  'wcag21a', 'wcag21aa', 'wcag21aaa',
  'wcag22aa', 'wcag22aaa',
];

const FINDINGS_DIR = 'test-results/a11y-findings';

function slugify(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

/** A contrast finding blocks the suite regardless of axe impact (AC2). */
function isBlocking(f: Finding): boolean {
  return (
    f.kind === 'violation' &&
    (f.ruleId === 'color-contrast-enhanced' ||
      f.impact === 'serious' ||
      f.impact === 'critical')
  );
}

for (const route of AUDIT_ROUTES) {
  for (const theme of DISPLAY_THEMES) {
    test(`${route.name} [${theme.label}] — AAA contrast`, async ({ page }, testInfo) => {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      await applyThemeToPage(page, theme.id);
      // let the CSS re-theme settle before axe reads computed styles
      await page.waitForTimeout(150);

      const results = await new AxeBuilder({ page }).withTags(AAA_TAGS).analyze();
      const findings: Finding[] = [];

      // Violations
      for (const v of results.violations) {
        for (const node of v.nodes) {
          findings.push({
            route: route.path,
            routeName: route.name,
            theme: theme.label,
            ruleId: v.id,
            kind: 'violation',
            impact: v.impact ?? null,
            target: node.target.join(' '),
            html: node.html.slice(0, 200),
            summary: node.failureSummary ?? v.help,
          });
        }
      }

      // Incomplete CONTRAST results — axe couldn't resolve the background
      // (gradient / image hero). Keep as must-review + screenshot; never a
      // silent pass. Non-contrast incompletes are left to the manual pass.
      const contrastIncomplete = results.incomplete.filter((r) =>
        r.id === 'color-contrast' || r.id === 'color-contrast-enhanced',
      );
      for (const inc of contrastIncomplete) {
        const shot = `${FINDINGS_DIR}/${slugify(route.name)}-${theme.id}-review.png`;
        mkdirSync(FINDINGS_DIR, { recursive: true });
        try {
          await page.screenshot({ path: shot, fullPage: true });
        } catch {
          /* screenshot is best-effort */
        }
        for (const node of inc.nodes) {
          findings.push({
            route: route.path,
            routeName: route.name,
            theme: theme.label,
            ruleId: inc.id,
            kind: 'incomplete',
            impact: inc.impact ?? null,
            target: node.target.join(' '),
            html: node.html.slice(0, 200),
            summary: 'axe could not resolve the background — needs manual review',
            screenshot: shot,
          });
        }
      }

      // Persist this cell's findings (parallel-safe: unique filename).
      mkdirSync(FINDINGS_DIR, { recursive: true });
      writeFileSync(
        `${FINDINGS_DIR}/${slugify(route.name)}-${theme.id}.json`,
        JSON.stringify(findings, null, 2),
      );

      const blocking = findings.filter(isBlocking);
      if (blocking.length > 0) {
        console.log(`\n[a11y] ${route.path} [${theme.label}] — ${blocking.length} BLOCKING:`);
        for (const f of blocking.slice(0, 8)) {
          console.log(`  ✗ ${f.ruleId} (${f.impact ?? '—'}) ${f.target}`);
        }
      }

      // Attach findings to the Playwright report for this cell too.
      await testInfo.attach('findings.json', {
        body: JSON.stringify(findings, null, 2),
        contentType: 'application/json',
      });

      expect(
        blocking,
        `${route.path} [${theme.label}] has AAA contrast / serious violations — see test-results/a11y-report.md`,
      ).toEqual([]);
    });
  }
}
