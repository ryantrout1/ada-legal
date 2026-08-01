/**
 * target-size.spec.ts — WCAG 2.2 AAA 2.5.5 Target Size (44×44 CSS px).
 *
 * Phase 3 (AAA remediation). axe carries a `target-size` rule, but it maps
 * to the 2.5.8 AA floor (24px); AAA is 44px, and Gina navigates by knuckle,
 * so 44px is the project floor. This spec therefore measures the rendered
 * box of every interactive element directly and fails any that is under
 * 44px in either dimension (excluding inline links in flowing text, which
 * 2.5.5 exempts).
 *
 * Runs once per route in the DEFAULT theme — target size is a function of
 * layout (font/size/spacing), not colour, so it doesn't multiply by the 5
 * display themes. A follow-up may add the large-text size variant; the
 * default pass catches the structural offenders (buttons, controls, icon
 * links) that ship the same size in every theme.
 *
 * Ryan runs this (no browser in the build sandbox); it is committed so it
 * runs wherever `npm run test:a11y` runs.
 */

import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { AUDIT_ROUTES } from './lib/routes.js';

const MIN = 44; // CSS px, WCAG 2.2 AAA 2.5.5
const OUT_DIR = 'test-results/a11y-findings';

interface Small {
  route: string;
  routeName: string;
  selector: string;
  width: number;
  height: number;
  text: string;
}

function slugify(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

for (const route of AUDIT_ROUTES) {
  test(`${route.name} — 44px target size`, async ({ page }) => {
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');

    const small: Small[] = await page.evaluate((min) => {
      const out: Small[] = [];
      const sel = 'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=link], [role=checkbox], [role=radio], [role=switch], [role=tab], [role=menuitem]';
      const nodes = Array.from(document.querySelectorAll(sel));
      for (const el of nodes) {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        if (el.getClientRects().length === 0) continue;

        // 2.5.5 exception: a link/button whose box is inline within a
        // sentence of text is exempt. Approximate: an <a> whose parent's
        // text is materially longer than the link's own text is inline.
        const tag = el.tagName.toLowerCase();
        const ownText = (el.textContent ?? '').trim();
        // 2.5.5 inline exception: a link flowing within a sentence is exempt.
        // Links are often wrapped per-item (span > a), so the immediate parent
        // isn't enough — walk up a few levels; if a nearby ancestor carries
        // materially more text, the link sits inside prose and is exempt.
        if (tag === 'a') {
          let anc: Element | null = el.parentElement;
          let depth = 0;
          let inline = false;
          while (anc && depth < 4) {
            if ((anc.textContent ?? '').trim().length > ownText.length + 10) { inline = true; break; }
            anc = anc.parentElement;
            depth++;
          }
          if (inline) continue; // inline in prose
        }

        // A file input paired with a styled <label for=...> isn't itself the
        // target — WCAG measures the label (the visible control). Skip the
        // input; the label is selected and measured on its own.
        if (
          tag === 'input' &&
          (el as HTMLInputElement).type === 'file' &&
          el.id &&
          document.querySelector(`label[for="${el.id}"]`)
        ) {
          continue;
        }

        const r = el.getBoundingClientRect();
        // round to avoid sub-pixel noise
        const w = Math.round(r.width);
        const h = Math.round(r.height);
        if (w === 0 || h === 0) continue;
        if (w < min || h < min) {
          const selector =
            (el.id ? `#${el.id}` : '') ||
            `${tag}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`;
          out.push({
            route: '', routeName: '', selector, width: w, height: h,
            text: ownText.slice(0, 40),
          });
        }
      }
      return out;
    }, MIN);

    for (const s of small) {
      s.route = route.path;
      s.routeName = route.name;
    }

    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(
      `${OUT_DIR}/targetsize-${slugify(route.name)}.json`,
      JSON.stringify(small, null, 2),
    );

    if (small.length > 0) {
      console.log(`\n[a11y] ${route.path} — ${small.length} target(s) under ${MIN}px:`);
      for (const s of small.slice(0, 10)) {
        console.log(`  ✗ ${s.width}×${s.height} ${s.selector} "${s.text}"`);
      }
    }

    expect(
      small,
      `${route.path} has interactive targets under ${MIN}px — see test output`,
    ).toEqual([]);
  });
}
