/**
 * Ada Spot — summarize the analyzer's bounding box across repeated runs.
 *
 * Ten runs of one bathroom photo produced curb boxes whose top edge ranged
 * 0.72–0.85 with no code change at all. That spread is wider than most of the
 * differences we were judging from single screenshots, which is how several
 * "fixes" looked convincing and changed nothing. This module replaces that with
 * counts: across N runs of the SAME photo, how many put the concern inside the
 * box, and how far the box wanders on its own.
 *
 * Containment is the grounding metric. Spread is the noise floor — a change
 * that moves the box less than the spread has not been shown to do anything.
 *
 * Pure and deterministic; the model never runs here. Ref: /plan repeat-run.
 */

import type { PhotoBoundingBox } from '../../types/db.js';
import { boxContains, type Point } from './boxAccuracy.js';

export interface PreviewFindingBox {
  title: string;
  box?: PhotoBoundingBox | null;
}

/** One analyzer run's findings. */
export interface PreviewRun {
  findings: PreviewFindingBox[];
}

export interface RunSummary {
  /** The needle used to match the finding across runs. */
  needle: string;
  /** Runs in which a finding matching the needle appeared. */
  matchedRuns: number;
  /** Runs where the finding appeared but was absent — the analyzer skipped it. */
  missingRuns: number;
  /** Of the matched runs, how many carried a bounding box. */
  boxedRuns: number;
  /**
   * How many boxed runs contained the ground-truth point. Null without a truth
   * point (nothing to contain) — never silently reported as zero.
   */
  containment: { inside: number; total: number } | null;
  /** Spread of the box's top edge across boxed runs. Null when none were boxed. */
  ySpread: { min: number; max: number; range: number } | null;
  /** Every observed box top edge, in run order — the raw evidence. */
  observedY: number[];
}

const round3 = (n: number): number => Math.round(n * 1000) / 1000;

/**
 * Summarize one finding (matched by case-insensitive title substring) across
 * repeated runs of the same photo.
 */
export function summarizeRuns(
  runs: readonly PreviewRun[],
  needle: string,
  truth: Point | undefined,
): RunSummary {
  const lower = needle.toLowerCase();
  const matched: PreviewFindingBox[] = [];
  let missingRuns = 0;

  for (const run of runs) {
    const hit = run.findings.find((f) => f.title.toLowerCase().includes(lower));
    if (hit) matched.push(hit);
    else missingRuns++;
  }

  const boxed = matched.filter((f): f is PreviewFindingBox & { box: PhotoBoundingBox } =>
    Boolean(f.box),
  );
  const observedY = boxed.map((f) => f.box.y);

  return {
    needle,
    matchedRuns: matched.length,
    missingRuns,
    boxedRuns: boxed.length,
    containment:
      truth && boxed.length > 0
        ? { inside: boxed.filter((f) => boxContains(f.box, truth)).length, total: boxed.length }
        : null,
    ySpread:
      observedY.length > 0
        ? {
            min: round3(Math.min(...observedY)),
            max: round3(Math.max(...observedY)),
            range: round3(Math.max(...observedY) - Math.min(...observedY)),
          }
        : null,
    observedY,
  };
}
