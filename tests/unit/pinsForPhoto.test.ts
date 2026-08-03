import { describe, it, expect } from 'vitest';
import { pinsForPhoto } from '@/lib/spot/pinsForPhoto';
import type { SpotReportContent } from '@/lib/spot/reportSchema';
import type { PhotoPin } from '@/lib/spot/annotationTypes';

const pin = (label: string): PhotoPin => ({
  x: 0.3,
  y: 0.6,
  confidence: 0.9,
  label,
  severity: 'major',
  findingIndex: 0,
});

function content(photoAnnotations?: SpotReportContent['photoAnnotations']): SpotReportContent {
  return {
    kind: 'findings',
    headline: 'h',
    overview: 'o',
    items: [],
    disclaimer: 'd',
    photoAnnotations,
  };
}

describe('pinsForPhoto', () => {
  it('returns [] when the report has no annotations', () => {
    expect(pinsForPhoto(content(undefined), 'a.jpg')).toEqual([]);
  });

  it('returns the pins for the matching photo URL', () => {
    const c = content([
      { photoUrl: 'a.jpg', pins: [pin('Curb')] },
      { photoUrl: 'b.jpg', pins: [pin('Bench'), pin('Bars')] },
    ]);
    expect(pinsForPhoto(c, 'b.jpg').map((p) => p.label)).toEqual(['Bench', 'Bars']);
  });

  it('returns [] for a photo URL with no annotation entry (no orphan pins)', () => {
    const c = content([{ photoUrl: 'a.jpg', pins: [pin('Curb')] }]);
    expect(pinsForPhoto(c, 'z.jpg')).toEqual([]);
  });

  it('returns [] for a matched entry that has no pins', () => {
    const c = content([{ photoUrl: 'a.jpg', pins: [] }]);
    expect(pinsForPhoto(c, 'a.jpg')).toEqual([]);
  });
});
