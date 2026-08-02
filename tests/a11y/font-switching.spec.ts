import { test, expect } from '@playwright/test';
import { AUDIT_ROUTES } from './lib/routes';

/**
 * Font-switching coverage.
 *
 * The accessibility panel writes `data-font` on <html>, and app.css maps each
 * choice to BOTH --font-body and --font-display:
 *   [data-font="opendyslexic"] { --font-body: 'OpenDyslexic'…; --font-display: 'OpenDyslexic'… }
 *
 * So any element that styles itself with var(--font-body)/var(--font-display)
 * follows the choice. Elements that HARDCODE a family (fontFamily:'Manrope…' or
 * 'Fraunces…') silently ignore it — which defeats the whole point of offering
 * OpenDyslexic / Atkinson / Lexend to users who need them.
 *
 * This guard sets each accessible font and asserts that NO visible text element
 * still computes to a hardcoded brand family. It catches the current bypasses
 * and any new one someone adds later, the same way the contrast harness works.
 */

const ACCESSIBLE_FONTS = ['atkinson', 'opendyslexic', 'lexend'] as const;

// Families that must never survive a font override — they're the hardcoded
// brand defaults the override is supposed to replace.
const HARDCODED = ['manrope', 'fraunces'];

for (const route of AUDIT_ROUTES) {
  for (const font of ACCESSIBLE_FONTS) {
    test(`${route.name} [${font}] — accessible font reaches every element`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      await page.evaluate((f) => document.documentElement.setAttribute('data-font', f), font);
      // let the CSS var cascade settle before reading computed styles
      await page.waitForTimeout(120);

      const offenders = await page.evaluate((hardcoded: string[]) => {
        const bad: { tag: string; cls: string; family: string; text: string }[] = [];
        const els = document.querySelectorAll<HTMLElement>('body *');
        for (const el of els) {
          // only elements that directly render visible text
          const ownsText = Array.from(el.childNodes).some(
            (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 0,
          );
          if (!ownsText) continue;
          const rects = el.getClientRects();
          if (rects.length === 0) continue; // not visible

          const family = getComputedStyle(el).fontFamily || '';
          const first = family.split(',')[0].replace(/['"]/g, '').trim().toLowerCase();
          if (hardcoded.includes(first)) {
            bad.push({
              tag: el.tagName.toLowerCase(),
              cls: typeof el.className === 'string' ? el.className.slice(0, 60) : '',
              family: first,
              text: (el.textContent ?? '').trim().slice(0, 40),
            });
          }
        }
        // de-dupe by tag+family+text for a readable failure
        const seen = new Set<string>();
        return bad.filter((b) => {
          const k = `${b.tag}|${b.family}|${b.text}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        }).slice(0, 25);
      }, HARDCODED);

      expect(
        offenders,
        `With data-font="${font}", these elements still render a hardcoded font ` +
          `(should use var(--font-body)/var(--font-display)):\n` +
          JSON.stringify(offenders, null, 2),
      ).toEqual([]);
    });
  }
}
