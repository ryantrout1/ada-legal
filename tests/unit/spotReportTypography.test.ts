/**
 * The Spot report renders in Spot's own face, everywhere it renders.
 *
 * app.css already carries the rule — `.spot-surface h1, h2, h3, .font-display
 * { font-family: var(--font-body) }` — written specifically so someone
 * scanning a QR code onto /spot does not feel they changed products halfway
 * through. SpotLanding opts in. The readout the buyer actually paid for did
 * not, and neither did the admin queue where reports get approved, so the same
 * report rendered in Fraunces in two places and Manrope in a third. A reviewer
 * was approving a document that did not look like the one being sent.
 *
 * Two classes sit next to each other and only one is wanted. `spot-surface` is
 * fonts. `spot-accent` is the teal, which app.css is explicit about keeping off
 * this app because the consumer palette is AA-level and the floor here is AAA.
 * One word apart, so both are asserted.
 *
 * Nothing here authors CSS. The rule exists; these are the surfaces opting
 * into it. The a11y font override is guarded separately and unchanged by
 * spotFontScope.test.ts — that mechanism is why the rule reads var(--font-body)
 * instead of naming Manrope.
 *
 * Encodes acceptance criteria 1-4 from /plan phase 1 (de-serif the Spot report).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8');

const READOUT = 'src/app/routes/public/spot/SpotReadout.tsx';
const REVIEW = 'src/app/routes/review/SpotReview.tsx';
const VIEW = 'src/app/routes/public/spot/SpotReportView.tsx';

describe('the buyer’s readout', () => {
  const src = read(READOUT);

  it('opts into the Spot surface, so the report is not set in Fraunces', () => {
    expect(src).toMatch(/spot-surface/);
  });

  it('does not opt into the Spot accent', () => {
    // That is the teal. One word from spot-surface and it would restyle the
    // whole report.
    expect(src).not.toMatch(/spot-accent/);
  });
});

describe('the admin review queue', () => {
  const src = read(REVIEW);

  it('renders its preview on the Spot surface too', () => {
    // The point of a review queue is that the reviewer sees what the buyer
    // will see.
    expect(src).toMatch(/spot-surface/);
  });

  it('scopes it to the preview, not the whole admin page', () => {
    // The admin chrome is not Spot and should not be de-serifed with it.
    expect(src.match(/spot-surface/g) ?? []).toHaveLength(1);
    expect(src).toMatch(/<section[^>]*spot-surface[\s\S]{0,500}<SpotReportView/);
  });

  it('does not opt into the Spot accent either', () => {
    expect(src).not.toMatch(/spot-accent/);
  });
});

describe('measurements are set as numbers, not headlines', () => {
  const src = read(VIEW);

  const classesFor = (marker: string): string => {
    const m = src.match(new RegExp(`className="([^"]*)"[^>]*>\\s*\\{${marker}\\}`));
    if (!m) throw new Error(`no element found rendering {${marker}}`);
    return m[1];
  };

  it('the target value is not display type', () => {
    // A measurement in a display face reads as a headline. It is the number
    // the reader is going to hold a tape up against.
    expect(classesFor('item\\.target\\.value')).not.toContain('font-display');
  });

  it('the target value aligns its figures', () => {
    expect(classesFor('item\\.target\\.value')).toContain('tabular-nums');
  });

  it('the strip values match it', () => {
    const strip = classesFor('t\\.value');
    expect(strip).not.toContain('font-display');
    expect(strip).toContain('tabular-nums');
  });

  it('leaves the headline and the finding titles on display type', () => {
    // Those are headings and should stay headings — once the surface class is
    // applied, .font-display resolves to the body face anyway, and it carries
    // the letter-spacing the rule sets with it.
    expect(src).toMatch(/className="[^"]*font-display[^"]*"[^>]*>\s*\{content\.headline\}/);
    expect(src).toMatch(/className="[^"]*font-display[^"]*"[^>]*>\s*\{item\.title\}/);
  });
});
