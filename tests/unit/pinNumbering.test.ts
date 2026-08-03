import { describe, it, expect } from 'vitest';
import { buildPinNumbering } from '@/lib/spot/pinNumbering';
import type { SpotReportItem } from '@/lib/spot/reportSchema';
import type { PhotoAnnotation, PhotoPin } from '@/lib/spot/annotationTypes';

const pin = (itemIndex: number): PhotoPin => ({
  x: 0.4,
  y: 0.8,
  confidence: 0.9,
  label: 'x',
  severity: 'critical',
  itemIndex,
});

const item = (over: Partial<SpotReportItem> = {}): SpotReportItem =>
  ({
    title: 't',
    concern: '',
    remediation: '',
    severity: 'critical',
    severityLabel: '',
    hedged: false,
    ...over,
  }) as SpotReportItem;

const anns = (pins: PhotoPin[], photoUrl = 'p.jpg'): PhotoAnnotation[] => [{ photoUrl, pins }];

describe('buildPinNumbering', () => {
  it('numbers a confirmed item and its pin the same, by itemIndex', () => {
    const items = [item()];
    const n = buildPinNumbering(items, anns([pin(0)]));
    expect(n.numberForItem(items[0])).toBe(1);
    expect(n.pinsForPhoto('p.jpg')[0].number).toBe(1);
  });

  it('numbers items 1,2 in display order regardless of pin order', () => {
    const items = [item(), item()];
    // Pins supplied for index 1 then 0 — numbering still follows item order.
    const n = buildPinNumbering(items, anns([pin(1), pin(0)]));
    expect(n.numberForItem(items[0])).toBe(1);
    expect(n.numberForItem(items[1])).toBe(2);
    const pins = n.pinsForPhoto('p.jpg');
    expect(pins.find((p) => p.itemIndex === 0)?.number).toBe(1);
    expect(pins.find((p) => p.itemIndex === 1)?.number).toBe(2);
  });

  it('skips a hedged item over a confirmed one when numbering', () => {
    const items = [item({ hedged: true }), item()];
    const n = buildPinNumbering(items, anns([pin(1)]));
    expect(n.numberForItem(items[0])).toBeNull();
    expect(n.numberForItem(items[1])).toBe(1);
  });

  it('gives a confirmed item with no pin no number', () => {
    const items = [item()];
    const n = buildPinNumbering(items, anns([]));
    expect(n.numberForItem(items[0])).toBeNull();
  });

  it('returns [] for a photo with no annotations', () => {
    const items = [item()];
    const n = buildPinNumbering(items, undefined);
    expect(n.pinsForPhoto('p.jpg')).toEqual([]);
    expect(n.numberForItem(items[0])).toBeNull();
  });
});
