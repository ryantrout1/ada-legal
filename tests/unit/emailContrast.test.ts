/**
 * Every colour pair an email renders has to clear WCAG AAA.
 *
 * Emails cannot use the design tokens — inline hex is the only thing that
 * survives a mail client — so the palette lives in code and nothing was
 * checking it. Two renderers hand-rolled their own values and both drifted
 * under the floor independently: the Spot release email shipped its retention
 * line at 2.40:1, which fails even AA, on a product whose audience is the
 * people least able to absorb that.
 *
 * This computes the real WCAG relative-luminance ratio rather than trusting a
 * value somebody eyeballed once. The pairs come from the palette module, so a
 * new colour is only covered if it is declared there — which is the point:
 * declaring it is how it gets checked.
 *
 * Encodes acceptance criterion 1 from /plan phase 1 (Spot release email).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { EMAIL_CONTRAST_PAIRS, EMAIL_PALETTE } from '@/engine/email/emailStyles';

/** WCAG 2.x relative luminance. */
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const channel = (i: number) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('the contrast maths itself', () => {
  it('agrees with the known anchors', () => {
    // If this drifts, every assertion below is measuring nothing.
    expect(contrast('#ffffff', '#000000')).toBeCloseTo(21, 1);
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });
});

describe('every declared email colour pair', () => {
  it('declares at least the pairs the Spot release email uses', () => {
    const names = EMAIL_CONTRAST_PAIRS.map((p) => p.name);
    for (const required of [
      'heading',
      'body',
      'muted',
      'button label',
      'button fill',
      'link',
      // The handoff emails render on their own lighter-grey surface, so every
      // colour used there needs its own pair — a ratio is a property of a
      // combination, not of a colour.
      'heading on alt surface',
      'body on alt surface',
      'muted on alt surface',
      'link on alt surface',
      'callout text',
      'callout border',
    ]) {
      expect(names, `no pair declared for "${required}"`).toContain(required);
    }
  });

  it.each(EMAIL_CONTRAST_PAIRS)('$name clears $min:1', ({ fg, bg, min }) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(min);
  });

  it('holds text pairs to 7:1, not 4.5:1', () => {
    // AAA is the project floor. A pair quietly relaxed to AA would pass the
    // loop above while failing the constraint the loop exists to enforce.
    for (const pair of EMAIL_CONTRAST_PAIRS) {
      if (pair.kind !== 'text') continue;
      expect(pair.min, `${pair.name} is held to AA, not AAA`).toBeGreaterThanOrEqual(7);
    }
  });

  it('holds non-text pairs to at least 3:1', () => {
    for (const pair of EMAIL_CONTRAST_PAIRS) {
      if (pair.kind !== 'non-text') continue;
      expect(pair.min, pair.name).toBeGreaterThanOrEqual(3);
    }
  });
});

/**
 * Phase 2 — /plan: Spot release email.
 *
 * The contrast pairs above prove the palette. This proves the renderers only
 * draw from it. Without this half, a renderer can hold any hex it likes and
 * the measured pairs are measuring a palette nobody uses.
 *
 * Source-level rather than output-level because these renderers need fixtures
 * to run and a stray hex is visible in the source either way.
 */
describe('every email renderer draws only from the shared palette', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const allowed = new Set(EMAIL_PALETTE.map((c) => c.toLowerCase()));

  const RENDERERS = [
    'src/engine/handoff/selfHelpEmail.ts',
    'src/lib/spot/releaseEmail.ts',
    'src/engine/handoff/emailTemplates.ts',
  ];

  it.each(RENDERERS)('%s', (rel) => {
    const src = readFileSync(resolve(root, rel), 'utf8');
    // Strip the comment blocks — they cite old values on purpose, to record
    // what was wrong and what it measured.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    const used = new Set((code.match(/#[0-9a-f]{3,6}\b/gi) ?? []).map((h) => h.toLowerCase()));
    for (const hex of used) {
      expect(allowed.has(hex), `${rel} uses ${hex}, which is not in the shared palette`).toBe(true);
    }
  });
});
