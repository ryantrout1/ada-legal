/**
 * Spot teal ramp — every display mode measured, none assumed.
 *
 * WHY SPOT HAS ITS OWN COLOUR. Terracotta is the site's colour: the nav
 * wordmark, the section eyebrows, the headline. When Spot borrowed it,
 * Spot stopped reading as a product and started reading as page
 * furniture — while Ada, which isn't live yet, was the one with an
 * identity. Spot is the product that ships today, so it gets the third
 * slot alongside Ada's violet.
 *
 * WHY NOT GREEN, AND WHY NOT RED. Spot screens photos for things that
 * look like barriers. It does not certify compliance and must never
 * appear to. Green means "this passes" and red means "this fails" to
 * every user before they read a word, so both are excluded from this
 * ramp by rule, not by taste. That constraint is asserted below.
 *
 * WHY PER-MODE VALUES. A single teal cannot serve a white page and a
 * black high-contrast page. The ramp resolves in six contexts —
 * @theme, dark, warm, contrast, low-vision, and prefers-contrast: more.
 * Skipping any of them would produce a button that is invisible in
 * exactly the mode a low-vision user is running, which on an
 * accessibility product is the user.
 *
 * Ref: /plan Spot product colour, Phase 1.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const css = readFileSync(resolve(root, 'src/app.css'), 'utf8');

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const parts = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = parts.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** All values a given custom property takes across the stylesheet, in order. */
function allValues(name: string): string[] {
  const re = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`, 'g');
  return [...css.matchAll(re)].map((m) => m[1].toLowerCase());
}

/**
 * The six contexts, in the order they appear in app.css, paired with the
 * page background each resolves against.
 */
const MODES = [
  { name: '@theme (light)', bg: '#FDFCFA' },
  { name: 'dark', bg: '#0F1216' },
  { name: 'warm', bg: '#FBF6EE' },
  { name: 'contrast', bg: '#000000' },
  { name: 'low-vision', bg: '#000000' },
  { name: 'prefers-contrast: more', bg: '#0F1216' },
];

describe('spot ramp — defined in every display mode', () => {
  it('declares spot-500 six times, once per context', () => {
    // If a mode is added to the app and Spot is not given a value there,
    // it silently inherits the previous mode's teal — which is how a
    // token ends up unreadable on a background nobody tested it against.
    expect(allValues('color-spot-500')).toHaveLength(MODES.length);
  });

  it('declares a matching hover and tint for each', () => {
    expect(allValues('color-spot-600')).toHaveLength(MODES.length);
    expect(allValues('color-spot-50')).toHaveLength(MODES.length);
  });
});

describe('spot ramp — AAA in every display mode', () => {
  const fives = allValues('color-spot-500');
  const sixes = allValues('color-spot-600');

  MODES.forEach((mode, i) => {
    it(`${mode.name}: primary and hover clear 7:1`, () => {
      const r5 = ratio(fives[i], mode.bg);
      const r6 = ratio(sixes[i], mode.bg);
      expect(r5, `spot-500 ${fives[i]} on ${mode.bg} measured ${r5.toFixed(2)}:1`).toBeGreaterThanOrEqual(7);
      expect(r6, `spot-600 ${sixes[i]} on ${mode.bg} measured ${r6.toFixed(2)}:1`).toBeGreaterThanOrEqual(7);
    });
  });
});

describe('spot ramp — landing stops on the dark hero', () => {
  const HERO = '#141820';

  it('the CTA fill carries dark text at 7:1', () => {
    const fill = allValues('color-spot-400')[0];
    expect(ratio('#141820', fill)).toBeGreaterThanOrEqual(7);
  });

  it('the CTA fill reads as a block against the hero', () => {
    const fill = allValues('color-spot-400')[0];
    expect(ratio(fill, HERO)).toBeGreaterThanOrEqual(3);
  });

  it('body and accent stops are AAA on the hero', () => {
    expect(ratio(allValues('color-spot-300')[0], HERO)).toBeGreaterThanOrEqual(7);
    expect(ratio(allValues('color-spot-200')[0], HERO)).toBeGreaterThanOrEqual(7);
  });
});

describe('spot ramp — carries no pass/fail meaning', () => {
  it('is never green or red', () => {
    // Hue check, not a vibe check. Spot reports what looks like a
    // barrier; a green product colour would read as "this place is
    // fine" and a red one as "this place is illegal". Spot certifies
    // nothing and its palette must not either.
    for (const hex of [...allValues('color-spot-500'), ...allValues('color-spot-600')]) {
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16));

      const isGreen = g > r + 30 && g > b + 30;
      expect(isGreen, `${hex} reads as green — implies "passes"`).toBe(false);

      const isRed = r > g + 30 && r > b + 30;
      expect(isRed, `${hex} reads as red — implies "fails"`).toBe(false);
    }
  });
});

describe('spot ramp — does not disturb the site palette', () => {
  it('leaves the terracotta accent alone', () => {
    // Phase 1 adds tokens only. If this count moves, the ramp has
    // started overwriting the site's own colour rather than sitting
    // beside it.
    expect(allValues('color-accent-500').length).toBeGreaterThanOrEqual(9);
  });

  it('has not been scoped to anything yet', () => {
    // .spot-accent lands in Phase 2. Until then nothing consumes these
    // tokens, and that is the point — the ramp ships provably inert.
    // Matches the RULE, not the word: the ramp's own comment names the
    // selector it is waiting for.
    expect(css).not.toMatch(/\.spot-accent\s*\{/);
  });
});
