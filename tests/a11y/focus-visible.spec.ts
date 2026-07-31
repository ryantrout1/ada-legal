/**
 * focus-visible.spec.ts — visible keyboard focus (WCAG 2.4.7 / 2.4.13).
 *
 * Phase 3 (AAA remediation). For every focusable element on a route, focus
 * it and assert the computed style CHANGES visibly versus its unfocused
 * state — a non-'none' outline, a box-shadow ring, or a border/background
 * delta. An element that looks identical focused and unfocused has no
 * visible focus indicator and fails.
 *
 * This is partial automation: it proves an indicator EXISTS and is
 * perceivable as a style delta; it does not judge whether the indicator
 * meets the 3:1 non-text contrast minimum (that is the manual pass). Runs
 * in the DEFAULT theme — focus rings are structural, not theme-specific in
 * this codebase; a regression there would show in the contrast sweep.
 *
 * Ryan runs this; committed so it runs wherever `npm run test:a11y` runs.
 */

import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { AUDIT_ROUTES } from './lib/routes.js';

const OUT_DIR = 'test-results/a11y-findings';

interface NoFocus {
  route: string;
  routeName: string;
  selector: string;
  text: string;
}

function slugify(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

for (const route of AUDIT_ROUTES) {
  test(`${route.name} — visible focus indicators`, async ({ page }) => {
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');

    const offenders: NoFocus[] = [];

    const handles = await page.$$(
      'a[href], button:not([disabled]), input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [role=button], [role=link], [tabindex]:not([tabindex="-1"])',
    );

    // Cap per route to keep runtime sane on dense pages; structural focus
    // styles repeat, so a generous sample surfaces missing-ring components.
    const sample = handles.slice(0, 60);

    for (const h of sample) {
      const visible = await h.isVisible().catch(() => false);
      if (!visible) continue;

      const info = await h.evaluate((el) => {
        function snapshot(node: Element) {
          const s = window.getComputedStyle(node);
          return {
            outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`,
            boxShadow: s.boxShadow,
            borderColor: s.borderColor,
            background: s.backgroundColor,
          };
        }
        const before = snapshot(el);
        (el as HTMLElement).focus();
        const after = snapshot(el);
        const changed =
          before.outline !== after.outline ||
          before.boxShadow !== after.boxShadow ||
          before.borderColor !== after.borderColor ||
          before.background !== after.background;
        const focused = document.activeElement === el;
        const tag = el.tagName.toLowerCase();
        const selector =
          (el.id ? `#${el.id}` : '') ||
          `${tag}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`;
        return { changed, focused, selector, text: (el.textContent ?? '').trim().slice(0, 40) };
      });

      // Only flag elements that actually took focus but showed no delta.
      if (info.focused && !info.changed) {
        offenders.push({
          route: route.path,
          routeName: route.name,
          selector: info.selector,
          text: info.text,
        });
      }
    }

    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(
      `${OUT_DIR}/focus-${slugify(route.name)}.json`,
      JSON.stringify(offenders, null, 2),
    );

    if (offenders.length > 0) {
      console.log(`\n[a11y] ${route.path} — ${offenders.length} element(s) with no visible focus:`);
      for (const o of offenders.slice(0, 10)) {
        console.log(`  ✗ ${o.selector} "${o.text}"`);
      }
    }

    expect(
      offenders,
      `${route.path} has focusable elements with no visible focus indicator — see test output`,
    ).toEqual([]);
  });
}
