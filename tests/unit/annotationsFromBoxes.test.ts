/**
 * annotationsFromBoxes — the /photo harness pin source after /triage found the
 * re-placement pass clustering distinct findings on hard photos.
 *
 * Guards the three gates (confirmable, confidence, box), the box→center math,
 * and the itemIndex mapping numberPins relies on. Mirrors the style of
 * buildPhotoAnnotations.test.ts, which covers the re-placement path this
 * replaces on the harness.
 */

import { describe, it, expect } from 'vitest';
import { annotationsFromBoxes } from '../../src/lib/spot/annotationsFromBoxes.js';
import type { PhotoFinding } from '../../src/types/db.js';

function finding(over: Partial<PhotoFinding>): PhotoFinding {
  return {
    title_standard: 'X',
    finding_standard: 'x',
    severity: 'major',
    standard: '§1',
    confirmable: true,
    confidence: 0.9,
    bounding_box: { x: 0.2, y: 0.3, w: 0.2, h: 0.2 },
    ...over,
  } as unknown as PhotoFinding;
}

const URL = 'photo-1';

describe('annotationsFromBoxes', () => {
  it('places a pin at the box center for a confirmable, confident finding', () => {
    const out = annotationsFromBoxes(
      URL,
      [finding({ title_standard: 'Curb', severity: 'critical', bounding_box: { x: 0.08, y: 0.79, w: 0.5, h: 0.09 } })],
      { minConfidence: 0.5 },
    );
    expect(out).toHaveLength(1);
    expect(out[0].pins).toHaveLength(1);
    expect(out[0].pins[0]).toMatchObject({
      x: 0.33, // 0.08 + 0.5/2
      y: 0.835, // 0.79 + 0.09/2
      label: 'Curb',
      severity: 'critical',
      itemIndex: 0,
      // The source box rides along so the renderer can choose point vs region.
      box: { x: 0.08, y: 0.79, w: 0.5, h: 0.09 },
    });
  });

  it('confirmable gate: an unconfirmable finding never gets a pin', () => {
    const out = annotationsFromBoxes(URL, [finding({ confirmable: false })], { minConfidence: 0.5 });
    expect(out[0].pins).toHaveLength(0);
  });

  it('confidence gate: a finding below the floor draws nothing', () => {
    const out = annotationsFromBoxes(URL, [finding({ confidence: 0.4 })], { minConfidence: 0.5 });
    expect(out[0].pins).toHaveLength(0);
  });

  it('box gate: a confirmable, confident finding with no box gets no pin', () => {
    const out = annotationsFromBoxes(URL, [finding({ bounding_box: undefined })], { minConfidence: 0.5 });
    expect(out[0].pins).toHaveLength(0);
  });

  it('box gate: a center outside 0..1 is rejected', () => {
    // x 0.9 + w 0.4 → center 1.1, out of frame.
    const out = annotationsFromBoxes(
      URL,
      [finding({ bounding_box: { x: 0.9, y: 0.2, w: 0.4, h: 0.2 } })],
      { minConfidence: 0.5 },
    );
    expect(out[0].pins).toHaveLength(0);
  });

  it('keeps itemIndex aligned to the finding position, gaps and all', () => {
    const out = annotationsFromBoxes(
      URL,
      [
        finding({ title_standard: 'A' }), // index 0 — pinned
        finding({ title_standard: 'B', confirmable: false }), // index 1 — dropped
        finding({ title_standard: 'C' }), // index 2 — pinned
      ],
      { minConfidence: 0.5 },
    );
    expect(out[0].pins.map((p) => [p.label, p.itemIndex])).toEqual([
      ['A', 0],
      ['C', 2],
    ]);
  });

  it('always returns one entry so the photo renders even with no pins', () => {
    const out = annotationsFromBoxes(URL, [], { minConfidence: 0.5 });
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({ photoUrl: URL, pins: [] });
  });

  it('tolerates undefined findings', () => {
    expect(annotationsFromBoxes(URL, undefined, { minConfidence: 0.5 })).toEqual([
      { photoUrl: URL, pins: [] },
    ]);
  });
});
