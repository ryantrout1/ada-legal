import { describe, it, expect } from 'vitest';
import { assignMarkerOffsets } from '@/lib/spot/markerOffsets';

describe('assignMarkerOffsets', () => {
  it('leaves well-separated markers at zero offset', () => {
    const out = assignMarkerOffsets([
      { x: 0.2, y: 0.2 },
      { x: 0.8, y: 0.8 },
    ]);
    expect(out).toEqual([0, 0]);
  });

  it('pushes a close second marker down by one step', () => {
    const out = assignMarkerOffsets([
      { x: 0.45, y: 0.82 },
      { x: 0.46, y: 0.83 },
    ]);
    expect(out[0]).toBe(0);
    expect(out[1]).toBe(28);
  });

  it('stacks three coincident markers 0, step, 2*step', () => {
    const p = { x: 0.5, y: 0.5 };
    const out = assignMarkerOffsets([p, p, p], { step: 30 });
    expect(out).toEqual([0, 30, 60]);
  });

  it('only offsets against markers within the threshold', () => {
    const out = assignMarkerOffsets(
      [
        { x: 0.1, y: 0.1 },
        { x: 0.11, y: 0.1 }, // close to #0
        { x: 0.9, y: 0.9 }, // far from both
      ],
      { threshold: 0.05, step: 20 },
    );
    expect(out).toEqual([0, 20, 0]);
  });

  it('returns [] for no markers', () => {
    expect(assignMarkerOffsets([])).toEqual([]);
  });
});
