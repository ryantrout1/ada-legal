/**
 * Spot font scope — guards the a11y font override.
 *
 * /spot renders Manrope to match adalegallink.com. The mechanism is subtle
 * enough to break by accident, so it's pinned here.
 *
 * Custom properties inherit from the nearest ancestor that declares them.
 * A `.spot-surface { --font-body: Manrope }` rule would therefore beat
 * `:root[data-font="opendyslexic"]` for everything inside Spot — specificity
 * never enters into it, because the two rules match different elements. A
 * user who picked OpenDyslexic would silently get Manrope, on an AAA product,
 * on the one page a disabled visitor is most likely to reach from a QR code.
 *
 * The fix is to match on :root via :has(), putting both declarations on the
 * same element so they compete normally: equal specificity (0,2,0) → source
 * order wins → the data-font block must come LAST.
 *
 * These tests fail if someone reorders the file, converts the rule to a
 * descendant selector, or drops :has().
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(__dirname, '../../src/app.css'), 'utf8');

const SPOT_RULE = ':root:has(.spot-surface)';
const A11Y_FONTS = ['atkinson', 'opendyslexic', 'lexend'] as const;

describe('Spot font scope', () => {
  it('scopes the body font to Manrope on the Spot surface', () => {
    const i = css.indexOf(SPOT_RULE);
    expect(i, `${SPOT_RULE} missing from app.css`).toBeGreaterThan(-1);
    const block = css.slice(i, css.indexOf('}', i));
    expect(block).toContain('--font-body');
    expect(block).toContain('Manrope');
  });

  it('never repoints --font-display at :root — that leaks into the chrome wordmark', () => {
    // Regression: adding --font-display here turned the header/footer wordmark
    // sans on /spot while the homepage stayed serif. :root is the whole
    // document, so the token rides the cascade past .spot-surface into the
    // chrome, where the wordmark carries the `font-display` utility. The nav
    // and footer escaped only because they sit on `font-chrome`.
    const i = css.indexOf(SPOT_RULE);
    const block = css.slice(i, css.indexOf('}', i));
    expect(block).not.toContain('--font-display');
  });

  it('de-serifs Spot headings via font-family: var(--font-body) on descendants', () => {
    // A real declaration scoped to the surface — not an inherited token — so
    // it cannot escape .spot-surface. Reading var(--font-body) rather than
    // naming Manrope is what lets a user's a11y font still win.
    const rule = /\.spot-surface \.font-display\s*\{[^}]*font-family:\s*var\(--font-body\)/;
    expect(rule.test(css)).toBe(true);
  });

  it('matches on :root, not a descendant — a descendant would beat the a11y font', () => {
    // A bare `.spot-surface {` block declaring --font-body is the bug.
    const descendantRule = /(^|\n)\s*\.spot-surface\s*\{[^}]*--font-body/;
    expect(descendantRule.test(css)).toBe(false);
  });

  it.each(A11Y_FONTS)('lets a user-chosen %s font win via source order', (font) => {
    const spotAt = css.indexOf(SPOT_RULE);
    const fontAt = css.indexOf(`:root[data-font="${font}"]`);
    expect(fontAt, `data-font="${font}" rule missing`).toBeGreaterThan(-1);
    // Equal specificity (0,2,0) — later declaration wins.
    expect(spotAt).toBeLessThan(fontAt);
    // Spot's headings read var(--font-body), so overriding --font-body is what
    // carries a user's font to the headings too.
    const block = css.slice(fontAt, css.indexOf('}', fontAt));
    expect(block).toContain('--font-body');
  });

  it('does not import the consumer site\'s AA-level accent', () => {
    // #C2410C is 5.18:1 — below the 7:1 AAA floor this app holds.
    const spotAt = css.indexOf(SPOT_RULE);
    const block = css.slice(spotAt, css.indexOf('}', spotAt));
    expect(block).not.toContain('#C2410C');
  });
});
