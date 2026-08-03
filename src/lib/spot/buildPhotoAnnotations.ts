/**
 * Ada Spot — build photo annotations from stored analyses (pure).
 *
 * Two gates decide whether a finding earns a pin, and both fail safe toward
 * "no pin":
 *   - confirmable gate: a finding the photo could not settle (confirmable ===
 *     false) has no visible object to point at — it stays in the report prose,
 *     never gets a pin.
 *   - confidence gate: even for a confirmable finding, if the model's placement
 *     confidence is below the floor, no pin. The finding still reads in prose.
 *
 * A finding with no pin is the normal, safe outcome. The alternative — a pin on
 * the wrong surface — is the exact failure the screening product exists to
 * avoid, and it is worse than silence. Ref: /plan Spot photo annotation Ph.1.
 *
 * Pure: the model call arrives already wrapped as `place`, so this is
 * deterministic given a stubbed placer and is the unit-tested core.
 */

import type { PhotoFinding } from '../../types/db.js';
import type { PhotoAnnotation, PhotoPin, PlacedPin } from './annotationTypes.js';

/** One source photo and the findings from its stored per-photo analysis. */
export interface AnnotationSource {
  photoUrl: string;
  findings: PhotoFinding[];
}

/** Placement of one finding on one photo; null when it can't be placed. */
export type PlaceFn = (photoUrl: string, finding: PhotoFinding) => Promise<PlacedPin | null>;

export interface BuildAnnotationsOptions {
  /** Minimum placement confidence to draw a pin. Below this → no pin. */
  minConfidence: number;
}

/**
 * Build one PhotoAnnotation per source photo, placing a pin only for findings
 * that clear both gates. Order is preserved; a photo with no qualifying
 * findings still returns an entry with an empty pins array so the caller can
 * show the photo unannotated rather than dropping it.
 */
export async function buildPhotoAnnotations(
  sources: readonly AnnotationSource[],
  place: PlaceFn,
  opts: BuildAnnotationsOptions,
): Promise<PhotoAnnotation[]> {
  const out: PhotoAnnotation[] = [];
  for (const src of sources) {
    const findings = src.findings ?? [];
    const pins: PhotoPin[] = [];
    for (let i = 0; i < findings.length; i++) {
      const f = findings[i];
      // Confirmable gate: absence / unmeasurable → prose only.
      if (f.confirmable === false) continue;
      const placed = await place(src.photoUrl, f);
      // Model could not place it (declined, errored, or out of range).
      if (!placed) continue;
      // Confidence gate: uncertain placement draws nothing.
      if (placed.confidence < opts.minConfidence) continue;
      pins.push({
        x: placed.x,
        y: placed.y,
        confidence: placed.confidence,
        label: f.title_standard,
        severity: f.severity,
        findingIndex: i,
      });
    }
    out.push({ photoUrl: src.photoUrl, pins });
  }
  return out;
}
