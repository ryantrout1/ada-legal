/**
 * Unit tests for buildCaseEvidence (build-list #3) — the pure join of a
 * matter's photos to their stored analyses, carrying each photo's source.
 */

import { describe, it, expect } from 'vitest';
import { buildCaseEvidence } from '@/engine/cases/caseEvidence';
import type { PhotoAnalysisOutput } from '@/types/db';

function analysis(over: Partial<PhotoAnalysisOutput> = {}): PhotoAnalysisOutput {
  return {
    scene: { standard: 'A storefront entrance.' },
    summary: { standard: 'One concern found.' },
    overall_risk: 'medium',
    positive_findings: { standard: [] },
    findings: [],
    ...over,
  };
}

const base = { caseId: 'c1', orgId: 'o1', adaSessionId: 's1' as string | null };
const claimant = (url: string) => ({ url, uploadedAt: '2026-06-01T00:00:00Z', source: 'claimant' as const });

describe('buildCaseEvidence', () => {
  it('a photo with no analysis carries analysis null and keeps its source', () => {
    const ev = buildCaseEvidence({ ...base, photos: [claimant('p1')], analyses: [] });
    expect(ev.photos).toHaveLength(1);
    expect(ev.photos[0]).toMatchObject({ url: 'p1', source: 'claimant', analysis: null, analyzedAt: null });
  });

  it('joins an analysis to its photo by url', () => {
    const a = analysis();
    const ev = buildCaseEvidence({
      ...base,
      photos: [claimant('p1')],
      analyses: [{ photoUrl: 'p1', analysis: a, analyzedAt: '2026-06-02T00:00:00Z' }],
    });
    expect(ev.photos[0]!.analysis).toBe(a);
    expect(ev.photos[0]!.analyzedAt).toBe('2026-06-02T00:00:00Z');
  });

  it('the most recent analysis wins when a photo was analyzed twice', () => {
    const older = analysis({ summary: { standard: 'old' } });
    const newer = analysis({ summary: { standard: 'new' } });
    const ev = buildCaseEvidence({
      ...base,
      photos: [claimant('p1')],
      analyses: [
        { photoUrl: 'p1', analysis: older, analyzedAt: '2026-06-02T00:00:00Z' },
        { photoUrl: 'p1', analysis: newer, analyzedAt: '2026-06-05T00:00:00Z' },
      ],
    });
    expect(ev.photos[0]!.analysis).toBe(newer);
  });

  it('preserves photo order, carries source, and ignores analyses for unknown photos', () => {
    const ev = buildCaseEvidence({
      ...base,
      photos: [
        claimant('p1'),
        { url: 'p2', uploadedAt: '2026-06-03T00:00:00Z', source: 'attorney' as const },
      ],
      analyses: [
        { photoUrl: 'p2', analysis: analysis(), analyzedAt: '2026-06-04T00:00:00Z' },
        { photoUrl: 'ghost', analysis: analysis(), analyzedAt: '2026-06-02T00:00:00Z' },
      ],
    });
    expect(ev.photos.map((p) => [p.url, p.source])).toEqual([
      ['p1', 'claimant'],
      ['p2', 'attorney'],
    ]);
    expect(ev.photos[0]!.analysis).toBeNull();
    expect(ev.photos[1]!.analysis).not.toBeNull();
  });
});
