/**
 * Ada Spot: markers on the free read.
 *
 * The analyzer already boxes each barrier it finds, and the paid report pins
 * from those boxes. The free read threw the boxes away when it became a
 * teaser, so the one photo a free visitor sees carried no markers. This pins
 * the fix: each NAMED barrier carries the point to mark, taken from its own
 * box, and nothing about a withheld barrier (not even where it is) reaches the
 * wire.
 *
 * Off unless asked for: the endpoint passes the spot_show_annotations flag, so
 * the same kill switch pulls markers from the free read and the paid report.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFreeReadTeaser } from '@/lib/spot/freeReadTeaser';
import { teaserPins } from '@/lib/spot/teaserPins';
import type { PhotoAnalysisOutput, PhotoFinding } from '@/types/db';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function finding(over: Partial<PhotoFinding> = {}): PhotoFinding {
  return {
    title_standard: 'A concern',
    finding_standard: 'The long explanation the buyer is paying for.',
    severity: 'major',
    standard: '603.1',
    confidence: 0.8,
    confirmable: true,
    ...over,
  };
}

/** Seven findings. The three shown are the curb, the grab bars and the bench. */
const BATHROOM: PhotoAnalysisOutput = {
  scene: { standard: 'A residential bathroom.' },
  summary: { standard: 'Summary the buyer pays for.' },
  overall_risk: 'high',
  positive_findings: { standard: [] },
  findings: [
    // Object-shaped box: the marker sits at its centre.
    finding({
      title_standard: 'Fixed shower bench',
      severity: 'major',
      standard: '610.3',
      confirmable: false,
      bounding_box: { x: 0.6, y: 0.4, w: 0.2, h: 0.2 },
    }),
    // Edge-shaped box (wide and thin): the marker sits on the step line.
    finding({
      title_standard: 'Raised shower curb blocks entry',
      severity: 'critical',
      standard: '608.7',
      bounding_box: { x: 0.2, y: 0.72, w: 0.5, h: 0.05 },
    }),
    // Shown, but the analyzer drew no box: named, not marked.
    finding({ title_standard: 'No grab bars at the shower', severity: 'critical', standard: '609.1' }),
    // Withheld. Distinctive coordinates so a leak is easy to spot.
    finding({
      title_standard: 'Closed vanity blocks knee clearance',
      severity: 'major',
      standard: '606.2',
      bounding_box: { x: 0.123, y: 0.456, w: 0.111, h: 0.222 },
    }),
    finding({ title_standard: 'Turning space may be tight', severity: 'major', standard: '304.3' }),
    finding({ title_standard: 'Mirror height', severity: 'minor', standard: '603.3' }),
    finding({ title_standard: 'Towel hook reach range', severity: 'advisory', standard: '308.2' }),
  ],
};

describe('free-read markers come from the named barriers only', () => {
  it('carries no marker data unless markers are switched on', () => {
    const t = buildFreeReadTeaser(BATHROOM);
    for (const row of t.shown) expect(row).not.toHaveProperty('pin');
  });

  it('gives each shown barrier with a box the point to mark', () => {
    const t = buildFreeReadTeaser(BATHROOM, { pins: true });
    const curb = t.shown.find((r) => r.title.startsWith('Raised shower curb'));
    const bench = t.shown.find((r) => r.title === 'Fixed shower bench');
    // Edge: 0.015 below the top edge, 0.02 in from the left end (pinFromBox).
    expect(curb?.pin).toEqual({ x: 0.22, y: 0.735, box: { x: 0.2, y: 0.72, w: 0.5, h: 0.05 } });
    // Object: the centre.
    expect(bench?.pin).toEqual({ x: 0.7, y: 0.5, box: { x: 0.6, y: 0.4, w: 0.2, h: 0.2 } });
  });

  it('leaves a shown barrier with no box unmarked rather than guessing', () => {
    const t = buildFreeReadTeaser(BATHROOM, { pins: true });
    const grab = t.shown.find((r) => r.title === 'No grab bars at the shower');
    expect(grab).toBeDefined();
    expect(grab).not.toHaveProperty('pin');
  });

  it('adds only the marker: still no explanation, section or fix', () => {
    const t = buildFreeReadTeaser(BATHROOM, { pins: true });
    for (const row of t.shown) {
      const keys = Object.keys(row).filter((k) => k !== 'pin').sort();
      expect(keys).toEqual(['hedged', 'severity', 'title']);
      if (row.pin) expect(Object.keys(row.pin).sort()).toEqual(['box', 'x', 'y']);
    }
  });

  it('never puts a withheld barrier, or where it is, on the wire', () => {
    const wire = JSON.stringify(buildFreeReadTeaser(BATHROOM, { pins: true }));
    expect(wire).not.toContain('Closed vanity');
    expect(wire).not.toContain('0.123');
    expect(wire).not.toContain('0.456');
    expect(wire).not.toContain('603.1');
    expect(wire).not.toContain('The long explanation');
  });
});

describe('teaserPins numbers the markers to match the list', () => {
  it('numbers marked rows in list order and skips unmarked ones', () => {
    const t = buildFreeReadTeaser(BATHROOM, { pins: true });
    const { pins, numberForRow } = teaserPins(t);

    expect(t.shown.map((r) => r.title)).toEqual([
      'Raised shower curb blocks entry',
      'No grab bars at the shower',
      'Fixed shower bench',
    ]);
    expect(numberForRow).toEqual([1, null, 2]);
    expect(pins.map((p) => [p.number, p.label])).toEqual([
      [1, 'Raised shower curb blocks entry'],
      [2, 'Fixed shower bench'],
    ]);
  });

  it('marks every pin as box-derived so it renders approximate', () => {
    const { pins } = teaserPins(buildFreeReadTeaser(BATHROOM, { pins: true }));
    for (const p of pins) {
      expect(p.source).toBe('box');
      expect(p.box).toBeDefined();
    }
    expect(pins[0]).toMatchObject({ x: 0.22, y: 0.735, severity: 'critical', itemIndex: 0 });
  });

  it('returns nothing to draw when the teaser carries no markers', () => {
    const { pins, numberForRow } = teaserPins(buildFreeReadTeaser(BATHROOM));
    expect(pins).toEqual([]);
    expect(numberForRow).toEqual([null, null, null]);
  });
});

describe('the endpoint and page are wired to the markers', () => {
  it('the free-read endpoint asks for markers behind the annotations flag', () => {
    const src = readFileSync(resolve(root, 'api/spot/analyze.ts'), 'utf8');
    expect(src).toMatch(/readSpotShowAnnotations\(clients\.db\)/);
    expect(src).toMatch(/buildFreeReadTeaser\(result\.output, \{ pins: /);
  });

  it('the free-read page draws the photo through the marker component', () => {
    const src = readFileSync(resolve(root, 'src/app/routes/public/SpotLanding.tsx'), 'utf8');
    expect(src).toContain('<PinnedPhoto');
    expect(src).toContain('teaserPins(');
  });
});
