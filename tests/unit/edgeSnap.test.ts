/**
 * snapToHorizontalEdge — find a curb's real edge in the pixels.
 *
 * The analyzer's box for an edge drifts about 6% of the frame between runs, so
 * a marker placed from the box alone lands on the curb some runs and the floor
 * others. The image itself does not drift. A curb's top edge — where the light
 * shower pan meets the dark curb — is the largest brightness change anywhere
 * near it, so we can find it directly and stop guessing.
 *
 * These tests generate images where the correct answer is known by
 * construction. That is the ground truth this work has never had.
 */

import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { snapToHorizontalEdge } from '../../src/lib/spot/edgeSnap.js';

/** Build a JPEG from a per-row brightness function, so edges are exact. */
async function image(
  width: number,
  height: number,
  brightnessAtRow: (y: number) => number,
  noise = 0,
): Promise<Buffer> {
  const px = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    const base = brightnessAtRow(y);
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      // Deterministic pseudo-noise: keeps the test repeatable.
      const n = noise === 0 ? 0 : ((x * 7 + y * 13) % noise);
      const v = Math.min(255, base + n);
      px[i] = v;
      px[i + 1] = v;
      px[i + 2] = v;
    }
  }
  return sharp(px, { raw: { width, height, channels: 3 } }).jpeg({ quality: 75 }).toBuffer();
}

const fullFrame = { x: 0, y: 0, w: 1, h: 1 };

describe('snapToHorizontalEdge', () => {
  it('finds a clean edge at the row where it actually is', async () => {
    // Light above row 72, dark below.
    const buf = await image(200, 100, (y) => (y < 72 ? 200 : 60));
    const y = await snapToHorizontalEdge(buf, fullFrame);
    expect(y).not.toBeNull();
    expect(y!).toBeCloseTo(0.72, 2);
  });

  it('picks the curb over grout-line decoys in a dark-on-dark scene', async () => {
    // The real hard case: light shower pan, dark curb, dark floor, grout lines.
    const buf = await image(
      300,
      120,
      (y) => {
        if (y === 90 || y === 105) return 88; // grout decoys on the floor
        if (y < 60) return 185; // light shower pan
        if (y < 72) return 48; // dark curb band
        return 62; // dark floor
      },
      16,
    );
    const y = await snapToHorizontalEdge(buf, fullFrame);
    expect(y).not.toBeNull();
    // The curb's TOP edge — the step line — not the grout at 0.75 or 0.88.
    expect(y!).toBeCloseTo(0.5, 2);
  });

  it('returns null on a flat image rather than snapping to noise', async () => {
    const buf = await image(200, 100, () => 120, 12);
    expect(await snapToHorizontalEdge(buf, fullFrame)).toBeNull();
  });

  it('returns null when no edge dominates — two equal transitions', async () => {
    // Ambiguous: the caller should keep its existing position, not guess.
    const buf = await image(200, 120, (y) => (y < 40 ? 200 : y < 80 ? 60 : 200));
    expect(await snapToHorizontalEdge(buf, fullFrame)).toBeNull();
  });

  it('searches only inside the given box, ignoring edges elsewhere', async () => {
    // Strong edge at 0.20 (outside the box) and a weaker one at 0.70 (inside).
    const buf = await image(200, 200, (y) => {
      if (y < 40) return 240;
      if (y < 140) return 40;
      return 110;
    });
    const y = await snapToHorizontalEdge(buf, { x: 0, y: 0.6, w: 1, h: 0.2 });
    expect(y).not.toBeNull();
    expect(y!).toBeCloseTo(0.7, 2);
  });

  it('is deterministic — the same image gives the same answer', async () => {
    const buf = await image(200, 100, (y) => (y < 72 ? 200 : 60));
    const a = await snapToHorizontalEdge(buf, fullFrame);
    const b = await snapToHorizontalEdge(buf, fullFrame);
    expect(a).toBe(b);
  });

  it('returns null on an unreadable buffer instead of throwing', async () => {
    expect(await snapToHorizontalEdge(Buffer.from('not an image'), fullFrame)).toBeNull();
  });
});
