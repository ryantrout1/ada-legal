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
  it('scopes Manrope to the Spot surface', () => {
    const i = css.indexOf(SPOT_RULE);
    expect(i, `${SPOT_RULE} missing from app.css`).toBeGreaterThan(-1);
    const block = css.slice(i, css.indexOf('}', i));
    expect(block).toContain('--font-body');
    expect(block).toContain('Manrope');
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
  });

  it('does not import the consumer site\'s AA-level accent', () => {
    // #C2410C is 5.18:1 — below the 7:1 AAA floor this app holds.
    const spotAt = css.indexOf(SPOT_RULE);
    const block = css.slice(spotAt, css.indexOf('}', spotAt));
    expect(block).not.toContain('#C2410C');
  });
});
