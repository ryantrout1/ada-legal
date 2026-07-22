/**
 * Diagram dark-mode legibility — completeness guard.
 *
 * The 43 Standards Guide diagrams paint their labels with hardcoded hex fills
 * (a category color system: green = compliant, red-brown = violation, blue =
 * dimension, violet = note). Their backdrop is tokenized —
 * `<rect fill="var(--page-bg-subtle)">` — so it follows the user's display
 * mode, but the labels do not. In dark and contrast modes the backdrop goes
 * near-black while the labels stay dark, and the text disappears.
 *
 * This test is a COMPLETENESS guard, not a spot check. It reads the diagram
 * sources, finds every hardcoded fill actually in use, computes its contrast
 * against each dark backdrop, and asserts that anything failing has a remap
 * rule in app.css. A new diagram introducing a new dark fill fails this test
 * — which is the point. A hand-copied list would go stale the first time
 * someone adds a diagram.
 *
 * Scope note: VC's low-vision mode is a WHITE canvas (#FFFFFF page /
 * #F5F5F5 subtle), unlike Base44's black-and-gold. Dark-mode remapping must
 * NOT apply there. Low-vision has the mirror-image defect — the light
 * STRUCTURAL set (#E2E8F0 lines/circles at 1.13:1) is what disappears —
 * and that is non-text shape recoloring under 1.4.11, deliberately out of
 * scope here and tracked as its own phase.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const APP_CSS = resolve(__dirname, '../../src/app.css');
const DIAGRAM_DIR = resolve(__dirname, '../../src/app/components/standards/diagrams');
const css = readFileSync(APP_CSS, 'utf8');

/** Backdrop each mode resolves --page-bg-subtle to (see app.css display blocks). */
const DARK_BACKDROP = '#1E1B17';      // dark: --color-surface-100
const CONTRAST_BACKDROP = '#000000';  // contrast: --color-surface-100

/** WCAG relative luminance + contrast ratio. */
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Every `<text ... fill="#XXXXXX">` colour actually used across the diagrams. */
function textFillsInUse(): Set<string> {
  const found = new Set<string>();
  for (const file of readdirSync(DIAGRAM_DIR)) {
    if (!/\.(jsx?|tsx?)$/.test(file)) continue;
    const src = readFileSync(join(DIAGRAM_DIR, file), 'utf8');
    for (const m of src.matchAll(/<text[^>]*\bfill="(#[0-9A-Fa-f]{6})"/g)) {
      found.add(m[1].toUpperCase());
    }
  }
  return found;
}

/** Does app.css carry a remap rule for this fill? */
function hasRemap(fill: string): boolean {
  return new RegExp(`text\\[fill="${fill}"\\]`, 'i').test(css);
}

describe('diagram dark-mode remap', () => {
  const fills = [...textFillsInUse()].sort();

  it('finds diagram text fills to check (guards against a silent empty pass)', () => {
    // If the glob or regex ever stops matching, every it.each below would
    // vacuously pass. Pin a floor so the suite can't go green by finding nothing.
    expect(fills.length).toBeGreaterThan(5);
  });

  it.each([
    ['dark', DARK_BACKDROP],
    ['contrast', CONTRAST_BACKDROP],
  ])('remaps every text fill that fails 4.5:1 in %s mode', (_mode, backdrop) => {
    const failing = fills.filter((f) => contrast(f, backdrop) < 4.5);
    const unremapped = failing.filter((f) => !hasRemap(f));
    expect(
      unremapped,
      `these diagram text fills are unreadable on ${backdrop} and have no remap rule`,
    ).toEqual([]);
  });

  it('every remap target itself clears 7:1 on both dark backdrops', () => {
    // A remap that swaps one failing colour for another failing colour is worse
    // than none — it looks fixed. AAA body text is 7:1; diagram labels are small.
    const targets = [...css.matchAll(/text\[fill="#[0-9A-Fa-f]{6}"\][^{]*\{\s*fill:\s*(#[0-9A-Fa-f]{6})/g)]
      .map((m) => m[1].toUpperCase());
    expect(targets.length, 'no remap targets found in app.css').toBeGreaterThan(0);

    const weak = [...new Set(targets)].filter(
      (t) => contrast(t, DARK_BACKDROP) < 7 || contrast(t, CONTRAST_BACKDROP) < 7,
    );
    expect(weak, 'remap targets below the 7:1 AAA floor').toEqual([]);
  });

  it('does not apply the dark remap to low-vision, whose canvas is white', () => {
    // Guard against the copy-from-Base44 mistake: B44's low-vision is black,
    // so its remap covers LV. Ours is white — applying it there would invert
    // the bug rather than fix it.
    const remapBlock = css.slice(css.indexOf('Diagram category-colour remap'));
    expect(remapBlock).not.toMatch(/\[data-display="low-vision"\][^{]*svg\[role="img"\]/);
  });
});
