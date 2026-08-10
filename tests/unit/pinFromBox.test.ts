/**
 * boxPinForItem — pin a composed item from the analyzer's own bounding box
 * (/plan phase 1, AC1–AC3).
 *
 * The defect this closes: on the run that prompted it, the analyzer boxed the
 * shower curb well (y 0.72, h 0.05) and the pipeline threw that away, calling a
 * separate full-frame placement model that landed on the floor at 0.87. The
 * good answer was computed and discarded.
 *
 * Items are joined to findings by ADA section, which is measured stable — 13
 * runs of the curb produced 7 distinct titles but exactly one section, and 0 of
 * 371 stored findings lack one. Titles are not usable as a key.
 */

import { describe, it, expect } from 'vitest';
import { boxPinForItem } from '../../src/lib/spot/pinFromBox.js';
import type { SpotReportItem } from '../../src/lib/spot/reportSchema.js';
import type { PhotoAnalysisOutput } from '../../src/types/db.js';

const item = (over: Partial<SpotReportItem> = {}): SpotReportItem =>
  ({
    title: 'Raised shower curb',
    concern: 'Blocks roll-in entry.',
    remediation: 'Curbless conversion.',
    severity: 'critical',
    severityLabel: 'Critical',
    hedged: false,
    locatable: true,
    citedSection: '§608.7',
    ...over,
  }) as SpotReportItem;

const analysis = (findings: unknown[]): PhotoAnalysisOutput =>
  ({
    scene: { standard: 'Bathroom' },
    summary: { standard: '' },
    overall_risk: 'high',
    positive_findings: { standard: [] },
    findings,
    meta: { tool_call_present: true, stop_reason: 'tool_use' },
  }) as unknown as PhotoAnalysisOutput;

const curbFinding = {
  title_standard: 'Shower Threshold — Raised Curb Blocks Roll-In Entry',
  finding_standard: 'A raised curb.',
  severity: 'critical',
  standard: '§608.7',
  confidence: 0.9,
  confirmable: true,
  bounding_box: { x: 0.08, y: 0.72, w: 0.5, h: 0.05 },
};

describe('boxPinForItem', () => {
  it('pins at the center of the matching finding box', () => {
    const pin = boxPinForItem(item(), [analysis([curbFinding])]);
    // Curb-shaped box (0.5 wide, 0.05 tall) is a linear feature, so the pin
    // sits just below its top edge — the step line — not at 0.745, the middle
    // of the band.
    expect(pin).toMatchObject({ x: 0.33, y: 0.735, confidence: 0.9 });
  });

  it('marks the pin as box-derived so the renderer knows the location is known', () => {
    expect(boxPinForItem(item(), [analysis([curbFinding])])?.source).toBe('box');
  });

  it('is pure — identical inputs give identical output, with no model call', () => {
    const analyses = [analysis([curbFinding])];
    expect(boxPinForItem(item(), analyses)).toEqual(boxPinForItem(item(), analyses));
  });

  it('matches despite the analyzer rewording the title', () => {
    const reworded = { ...curbFinding, title_standard: 'Raised Shower Curb Blocks Wheelchair Entry' };
    expect(boxPinForItem(item(), [analysis([reworded])])?.y).toBe(0.735);
  });

  it('normalizes section formatting differences', () => {
    const noSign = { ...curbFinding, standard: '608.7' };
    expect(boxPinForItem(item({ citedSection: '§608.7 ' }), [analysis([noSign])])).not.toBeNull();
  });

  it('returns null when the item has no cited section — falls back to placement', () => {
    expect(boxPinForItem(item({ citedSection: undefined }), [analysis([curbFinding])])).toBeNull();
  });

  it('returns null when no finding cites that section', () => {
    expect(boxPinForItem(item({ citedSection: '§999' }), [analysis([curbFinding])])).toBeNull();
  });

  it('returns null when the matching finding has no box', () => {
    const boxless = { ...curbFinding, bounding_box: undefined };
    expect(boxPinForItem(item(), [analysis([boxless])])).toBeNull();
  });

  it('disambiguates a shared section by severity, then confidence', () => {
    // Measured: 4.5% of section groups collide. Mirror and faucet both cite 606.
    const mirror = {
      ...curbFinding,
      title_standard: 'Mirror Height',
      standard: '§606',
      severity: 'minor',
      confidence: 0.8,
      bounding_box: { x: 0.6, y: 0.08, w: 0.3, h: 0.2 },
    };
    const cabinet = {
      ...curbFinding,
      title_standard: 'Lavatory Cabinet',
      standard: '§606',
      severity: 'major',
      confidence: 0.7,
      bounding_box: { x: 0.6, y: 0.7, w: 0.3, h: 0.2 },
    };
    const pin = boxPinForItem(
      item({ citedSection: '§606', severity: 'major' }),
      [analysis([mirror, cabinet])],
    );
    // Severity match wins over the higher-confidence wrong-severity finding.
    expect(pin?.y).toBeCloseTo(0.8, 5);
  });

  it('picks the highest-confidence box when several share section and severity', () => {
    const a = { ...curbFinding, confidence: 0.6, bounding_box: { x: 0, y: 0.2, w: 0.2, h: 0.2 } };
    const b = { ...curbFinding, confidence: 0.95, bounding_box: { x: 0, y: 0.6, w: 0.2, h: 0.2 } };
    expect(boxPinForItem(item(), [analysis([a, b])])?.y).toBeCloseTo(0.7, 5);
  });
});

describe('reference point by box shape', () => {
  /**
   * A curb is an edge, not an area. Across 8 runs the analyzer boxed it as a
   * wide thin band (avg y 0.744, h 0.058) — correct — but the pin took the
   * box's vertical CENTER, 0.773, which lands on the curb's face or the tile
   * just below it. The point a person would indicate on a raised threshold is
   * the step line: the top edge. Crop-guided placement, which only answers
   * when it can actually see the object, independently put the curb at 0.73 —
   * matching the box top, not the box center.
   *
   * Keyed on shape, not on the word "curb", so it covers any threshold, ramp
   * lip or floor transition without naming them.
   */
  const boxFinding = (box: { x: number; y: number; w: number; h: number }) => ({
    ...curbFinding,
    bounding_box: box,
  });

  it('pins a wide thin band near its top edge, not its center', () => {
    // The real curb shape: 0.43 wide, 0.058 tall.
    const pin = boxPinForItem(item(), [analysis([boxFinding({ x: 0.09, y: 0.744, w: 0.43, h: 0.058 })])]);
    expect(pin!.y).toBeCloseTo(0.759, 3); // 0.744 + 0.015, not 0.773
    expect(pin!.x).toBeCloseTo(0.305, 3); // x still centred
  });

  it('keeps the center for an object-shaped box', () => {
    // A vanity cabinet: roughly square. Its center is the right place to point.
    const pin = boxPinForItem(item(), [analysis([boxFinding({ x: 0.6, y: 0.7, w: 0.3, h: 0.28 })])]);
    expect(pin!.y).toBeCloseTo(0.84, 3);
  });

  it('keeps the center for a tall thin box — vertical features are not step lines', () => {
    const pin = boxPinForItem(item(), [analysis([boxFinding({ x: 0.5, y: 0.2, w: 0.05, h: 0.4 })])]);
    expect(pin!.y).toBeCloseTo(0.4, 3);
  });

  it('never places the pin outside a very thin box', () => {
    const box = { x: 0.1, y: 0.8, w: 0.5, h: 0.02 };
    const pin = boxPinForItem(item(), [analysis([boxFinding(box)])])!;
    expect(pin.y).toBeGreaterThanOrEqual(box.y);
    expect(pin.y).toBeLessThanOrEqual(box.y + box.h);
  });
});
