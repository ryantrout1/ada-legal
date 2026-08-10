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

describe('numbering follows pins, not the hedged flag', () => {
  /**
   * The runtime defect this closes: pins are chosen by locatable+severity, but
   * numbering still skipped anything hedged. A hedged-but-pinned fixed shower
   * bench was skipped by the numbering walk, then picked up by the defensive
   * fallback at the end — so its marker read "3" while its detail row showed no
   * number at all, and the caption ran 1, 3, 2. Two filters disagreeing about
   * which items count is the same conflation the pin filter already fixed.
   */
  const item = (title: string, hedged: boolean): SpotReportItem =>
    ({
      title,
      concern: '',
      remediation: '',
      severity: 'major',
      severityLabel: 'Major',
      hedged,
      locatable: true,
    }) as SpotReportItem;

  it('numbers a hedged item that has a pin, in item order', () => {
    const curb = item('Raised curb', false);
    const bench = item('Fixed bench', true); // hedged, but pinned
    const cabinet = item('Closed cabinet', false);
    const items = [curb, bench, cabinet];

    const annotations = [
      {
        photoUrl: 'https://blob/a.jpg',
        pins: [
          { x: 0.3, y: 0.7, confidence: 0.9, label: 'Raised curb', severity: 'critical', itemIndex: 0 },
          { x: 0.5, y: 0.6, confidence: 0.8, label: 'Fixed bench', severity: 'major', itemIndex: 1 },
          { x: 0.8, y: 0.8, confidence: 0.8, label: 'Closed cabinet', severity: 'major', itemIndex: 2 },
        ],
      },
    ];

    const n = buildPinNumbering(items, annotations as never);
    expect(n.numberForItem(curb)).toBe(1);
    expect(n.numberForItem(bench)).toBe(2);
    expect(n.numberForItem(cabinet)).toBe(3);
    // Markers agree with the rows.
    expect(n.pinsForPhoto('https://blob/a.jpg').map((p) => p.number)).toEqual([1, 2, 3]);
  });

  it('still gives no number to an item with no pin', () => {
    const curb = item('Raised curb', false);
    const grabBars = item('No grab bars', true); // no pin: nothing to point at
    const annotations = [
      {
        photoUrl: 'https://blob/a.jpg',
        pins: [
          { x: 0.3, y: 0.7, confidence: 0.9, label: 'Raised curb', severity: 'critical', itemIndex: 0 },
        ],
      },
    ];
    const n = buildPinNumbering([curb, grabBars], annotations as never);
    expect(n.numberForItem(curb)).toBe(1);
    expect(n.numberForItem(grabBars)).toBeNull();
  });
});
