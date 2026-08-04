/**
 * numberPins — the field-test harness's pin numbering.
 *
 * The report path is covered by pinNumbering.test.ts. This guards the far
 * simpler harness path: one photo's pins numbered 1..N in their own order, with
 * no report-item linkage to fabricate.
 */

import { describe, it, expect } from 'vitest';
import { numberPins } from '../../src/lib/spot/numberPins.js';
import type { PhotoAnnotation, PhotoPin } from '../../src/lib/spot/annotationTypes.js';

function pin(over: Partial<PhotoPin> = {}): PhotoPin {
  return {
    x: 0.5,
    y: 0.5,
    confidence: 0.9,
    label: 'Raised curb',
    severity: 'major',
    itemIndex: 0,
    ...over,
  };
}

describe('numberPins', () => {
  it('numbers pins 1..N in pin order', () => {
    const annotation: PhotoAnnotation = {
      photoUrl: 'https://x.public.blob.vercel-storage.com/a.jpg',
      pins: [pin({ label: 'A', itemIndex: 0 }), pin({ label: 'B', itemIndex: 1 }), pin({ label: 'C', itemIndex: 2 })],
    };
    const out = numberPins(annotation);
    expect(out.map((p) => p.number)).toEqual([1, 2, 3]);
    expect(out.map((p) => p.label)).toEqual(['A', 'B', 'C']);
  });

  it('preserves every pin field alongside the number', () => {
    const annotation: PhotoAnnotation = {
      photoUrl: 'https://x.public.blob.vercel-storage.com/a.jpg',
      pins: [pin({ x: 0.1, y: 0.2, confidence: 0.7, label: 'Grab bars', severity: 'minor', itemIndex: 4 })],
    };
    const [p] = numberPins(annotation);
    expect(p).toMatchObject({
      x: 0.1,
      y: 0.2,
      confidence: 0.7,
      label: 'Grab bars',
      severity: 'minor',
      itemIndex: 4,
      number: 1,
    });
  });

  it('returns an empty array for a photo with no pins', () => {
    expect(
      numberPins({ photoUrl: 'https://x.public.blob.vercel-storage.com/a.jpg', pins: [] }),
    ).toEqual([]);
  });

  it('returns an empty array when the annotation is missing', () => {
    expect(numberPins(undefined)).toEqual([]);
  });
});
