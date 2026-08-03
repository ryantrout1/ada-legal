import { describe, it, expect } from 'vitest';
import {
  buildPhotoAnnotations,
  type AnnotationSource,
  type PlaceFn,
} from '@/lib/spot/buildPhotoAnnotations';
import type { PhotoFinding } from '@/types/db';
import reference from '../fixtures/spot-annotation-reference.json';

function finding(over: Partial<PhotoFinding>): PhotoFinding {
  return {
    title_standard: 'X',
    finding_standard: 'x',
    severity: 'major',
    standard: '§1',
    confirmable: true,
    confidence: 0.9,
    ...over,
  } as unknown as PhotoFinding;
}

function source(findings: PhotoFinding[], photoUrl = 'photo-1'): AnnotationSource {
  return { photoUrl, findings };
}

// A placer that always lands the pin at a fixed point with a given confidence.
const placerAt = (confidence: number): PlaceFn => async () => ({ x: 0.3, y: 0.7, confidence });

describe('buildPhotoAnnotations — gates', () => {
  it('draws a pin for a confirmable finding that clears the confidence floor', async () => {
    const out = await buildPhotoAnnotations(
      [source([finding({ title_standard: 'Curb', severity: 'critical' })])],
      placerAt(0.8),
      { minConfidence: 0.5 },
    );
    expect(out).toHaveLength(1);
    expect(out[0].pins).toHaveLength(1);
    expect(out[0].pins[0]).toMatchObject({
      x: 0.3,
      y: 0.7,
      confidence: 0.8,
      label: 'Curb',
      severity: 'critical',
      findingIndex: 0,
    });
  });

  it('prefers the placer short label over the finding title', async () => {
    const labeledPlacer: PlaceFn = async () => ({ x: 0.3, y: 0.7, confidence: 0.9, label: 'Raised curb' });
    const out = await buildPhotoAnnotations(
      [source([finding({ title_standard: 'Shower Curb — Raised Threshold Blocks Entry' })])],
      labeledPlacer,
      { minConfidence: 0.5 },
    );
    expect(out[0].pins[0].label).toBe('Raised curb');
  });

  it('falls back to the finding title when the placer omits a label', async () => {
    const out = await buildPhotoAnnotations(
      [source([finding({ title_standard: 'Curb' })])],
      placerAt(0.8),
      { minConfidence: 0.5 },
    );
    expect(out[0].pins[0].label).toBe('Curb');
  });

  it('confirmable gate: an unconfirmable finding never gets a pin', async () => {
    const out = await buildPhotoAnnotations(
      [source([finding({ confirmable: false })])],
      placerAt(0.99),
      { minConfidence: 0.5 },
    );
    expect(out[0].pins).toHaveLength(0);
  });

  it('confidence gate: a low-confidence placement draws nothing', async () => {
    const out = await buildPhotoAnnotations(
      [source([finding({})])],
      placerAt(0.3),
      { minConfidence: 0.5 },
    );
    expect(out[0].pins).toHaveLength(0);
  });

  it('a placer returning null (model declined) draws nothing', async () => {
    const out = await buildPhotoAnnotations([source([finding({})])], async () => null, {
      minConfidence: 0.5,
    });
    expect(out[0].pins).toHaveLength(0);
  });

  it('keeps a photo with no qualifying findings, with an empty pins array', async () => {
    const out = await buildPhotoAnnotations(
      [source([finding({ confirmable: false })], 'lonely')],
      placerAt(0.9),
      { minConfidence: 0.5 },
    );
    expect(out).toEqual([{ photoUrl: 'lonely', pins: [] }]);
  });

  it('preserves findingIndex against the source order across mixed findings', async () => {
    const out = await buildPhotoAnnotations(
      [
        source([
          finding({ confirmable: false }), // 0 — skipped
          finding({ title_standard: 'Bench' }), // 1 — placed
        ]),
      ],
      placerAt(0.9),
      { minConfidence: 0.5 },
    );
    expect(out[0].pins).toHaveLength(1);
    expect(out[0].pins[0].findingIndex).toBe(1);
    expect(out[0].pins[0].label).toBe('Bench');
  });
});

describe('grab-bar confusion guard (AC5)', () => {
  const findings = reference.findings as unknown as PhotoFinding[];
  const grabBarFindings = findings.filter((f) => /grab bars/i.test(f.title_standard));

  it('the reference analysis has grab-bar findings', () => {
    expect(grabBarFindings.length).toBeGreaterThanOrEqual(1);
  });

  it('grab-bar findings are absence-worded, never presence-worded', () => {
    // The photo is full of long black bars — vanity cabinet pulls, shower
    // fixtures — that look like grab bars. The analyzer must report them as
    // NOT PRESENT, not read the cabinet hardware as installed grab bars.
    for (const f of grabBarFindings) {
      expect(f.finding_standard).toMatch(/no grab bars|none (?:are )?visible|not (?:visible|present)/i);
      expect(f.finding_standard).not.toMatch(/grab bars (?:are )?(?:present|installed|provided|mounted on)/i);
    }
  });
});
