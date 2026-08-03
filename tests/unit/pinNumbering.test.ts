import { describe, it, expect } from 'vitest';
import { buildPinNumbering } from '@/lib/spot/pinNumbering';
import type { SpotReportItem } from '@/lib/spot/reportSchema';
import type { PhotoAnnotation, PhotoPin } from '@/lib/spot/annotationTypes';

const pin = (label: string): PhotoPin => ({
  x: 0.4,
  y: 0.8,
  confidence: 0.9,
  label,
  severity: 'critical',
  findingIndex: 0,
});

const item = (title: string): SpotReportItem =>
  ({ title, concern: '', remediation: '', severity: 'critical', severityLabel: '', hedged: false }) as SpotReportItem;

const anns = (pins: PhotoPin[], photoUrl = 'p.jpg'): PhotoAnnotation[] => [{ photoUrl, pins }];

describe('buildPinNumbering', () => {
  it('numbers a confirmed row and its matching pin the same', () => {
    const items = [item('Raised curb/step from garage floor up to the landing')];
    const n = buildPinNumbering(items, anns([pin('Raised curb/step')]));
    expect(n.numberForItem(items[0])).toBe(1);
    expect(n.pinsForPhoto('p.jpg')[0].number).toBe(1);
  });

  it('numbers rows 1,2,3 in display order and matches each pin', () => {
    const items = [item('Raised curb/step at the landing'), item('Door clear width at the entry')];
    // Pins supplied in the opposite order to prove numbering follows the rows.
    const n = buildPinNumbering(items, anns([pin('Door clear width'), pin('Raised curb/step')]));
    expect(n.numberForItem(items[0])).toBe(1);
    expect(n.numberForItem(items[1])).toBe(2);
    const pins = n.pinsForPhoto('p.jpg');
    expect(pins.find((p) => p.label === 'Raised curb/step')?.number).toBe(1);
    expect(pins.find((p) => p.label === 'Door clear width')?.number).toBe(2);
  });

  it('gives an unmatched row no number (never a wrong one)', () => {
    const items = [item('Turning space may be too tight')];
    const n = buildPinNumbering(items, anns([pin('Raised curb')]));
    expect(n.numberForItem(items[0])).toBeNull();
  });

  it('still numbers a pin that has no row, so it is labelled on the photo', () => {
    const n = buildPinNumbering([], anns([pin('Raised curb')]));
    expect(n.pinsForPhoto('p.jpg')[0].number).toBe(1);
  });

  it('returns [] for a photo with no annotations', () => {
    const n = buildPinNumbering([item('x')], undefined);
    expect(n.pinsForPhoto('p.jpg')).toEqual([]);
    expect(n.numberForItem(item('x'))).toBeNull();
  });
});
