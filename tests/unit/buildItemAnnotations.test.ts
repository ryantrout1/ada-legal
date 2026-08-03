import { describe, it, expect } from 'vitest';
import { buildItemAnnotations, type PlaceItemInput } from '@/lib/spot/buildItemAnnotations';
import type { PlaceFn } from '@/lib/spot/buildPhotoAnnotations';
import type { PlacedPin } from '@/lib/spot/annotationTypes';

const item = (over: Partial<PlaceItemInput> = {}): PlaceItemInput => ({
  itemIndex: 0,
  title: 'Raised curb',
  detail: 'A step up blocks the route.',
  severity: 'critical',
  ...over,
});

/** A placer that returns a fixed pin for every photo. */
const placerAt = (confidence: number, label?: string): PlaceFn => async () => ({
  x: 0.4,
  y: 0.8,
  confidence,
  label,
});

describe('buildItemAnnotations — report path', () => {
  it('places one pin per item, bound to its itemIndex', async () => {
    const out = await buildItemAnnotations(
      [item({ itemIndex: 2, title: 'Step up' })],
      ['p.jpg'],
      placerAt(0.9),
      { minConfidence: 0.5 },
    );
    const pins = out.flatMap((a) => a.pins);
    expect(pins).toHaveLength(1);
    expect(pins[0].itemIndex).toBe(2);
    expect(pins[0].severity).toBe('critical');
  });

  it('returns one entry per photo, preserving order, empty where nothing placed', async () => {
    const out = await buildItemAnnotations([item()], ['a.jpg', 'b.jpg'], placerAt(0.9), {
      minConfidence: 0.5,
    });
    expect(out.map((a) => a.photoUrl)).toEqual(['a.jpg', 'b.jpg']);
    // The single item lands on exactly one photo; the other stays empty.
    expect(out.flatMap((a) => a.pins)).toHaveLength(1);
  });

  it('places the item on the highest-confidence photo', async () => {
    const perPhoto: Record<string, number> = { 'a.jpg': 0.6, 'b.jpg': 0.95 };
    const place: PlaceFn = async (url): Promise<PlacedPin | null> => ({
      x: 0.4,
      y: 0.8,
      confidence: perPhoto[url],
    });
    const out = await buildItemAnnotations([item()], ['a.jpg', 'b.jpg'], place, { minConfidence: 0.5 });
    expect(out.find((a) => a.photoUrl === 'b.jpg')!.pins).toHaveLength(1);
    expect(out.find((a) => a.photoUrl === 'a.jpg')!.pins).toHaveLength(0);
  });

  it('confidence gate: a placement below the floor draws nothing', async () => {
    const out = await buildItemAnnotations([item()], ['p.jpg'], placerAt(0.3), { minConfidence: 0.5 });
    expect(out.flatMap((a) => a.pins)).toHaveLength(0);
  });

  it('unplaceable item (placer returns null) draws nothing', async () => {
    const out = await buildItemAnnotations([item()], ['p.jpg'], async () => null, {
      minConfidence: 0.5,
    });
    expect(out.flatMap((a) => a.pins)).toHaveLength(0);
  });

  it('prefers the placer short label, falls back to the item title', async () => {
    const labeled = await buildItemAnnotations([item({ title: 'Step up from the parking floor' })], ['p.jpg'], placerAt(0.9, 'Raised curb'), { minConfidence: 0.5 });
    expect(labeled.flatMap((a) => a.pins)[0].label).toBe('Raised curb');
    const bare = await buildItemAnnotations([item({ title: 'Curb' })], ['p.jpg'], placerAt(0.9), { minConfidence: 0.5 });
    expect(bare.flatMap((a) => a.pins)[0].label).toBe('Curb');
  });
});
