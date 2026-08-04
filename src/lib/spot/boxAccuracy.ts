/**
 * Ada Spot — box accuracy scoring for the analyzer-grounding eval.
 *
 * /triage established that the analyzer boxes some fixtures low (a shower curb
 * drawn on the floor in front of it), and three placement methods inherited
 * the error. Three prompt-level guesses at a fix all looked plausible and none
 * moved it. This module exists so the next change is judged by a number:
 * distance from each method's point to a human-recorded ground truth, plus
 * whether ground truth even falls inside the analyzer's box.
 *
 * Distances are in normalized image units — same 0..1 space as the boxes, so
 * the full diagonal is ~1.41. A missing method scores null, never 0: a method
 * that declined to place must not look perfect next to one that placed badly.
 *
 * Pure and deterministic; the model never runs here. Ref: /plan phase 1.
 */

import type { PhotoBoundingBox } from '../../types/db.js';

export interface Point {
  x: number;
  y: number;
}

/** The methods compared, in report order. */
export const PLACEMENT_METHODS = ['boxCenter', 'placement', 'cropPlacement'] as const;
export type PlacementMethod = (typeof PLACEMENT_METHODS)[number];

/** One human-recorded correct location for one finding on one photo. */
export interface GroundTruthFinding {
  /** Fixture id for the photo (not a blob URL — fixtures outlive blobs). */
  photoId: string;
  /** Case-insensitive substring identifying the finding, e.g. "curb". */
  findingTitleContains: string;
  /** Where the concern actually is, normalized from the top-left. */
  truth: Point;
  /** Optional human note (what was clicked, and why). */
  note?: string;
}

/** The analyzer + placement output for one finding, as the debug route returns. */
export interface MethodPoints {
  title: string;
  box: PhotoBoundingBox | null;
  boxCenter: Point | null;
  placement: Point | null;
  cropPlacement: Point | null;
}

export interface MethodScore {
  method: PlacementMethod;
  /** Normalized distance to ground truth, or null when the method produced nothing. */
  distance: number | null;
}

export interface FindingScore {
  photoId: string;
  title: string;
  /** Did ground truth fall inside the analyzer's own box? The grounding question. */
  insideBox: boolean;
  methods: MethodScore[];
}

export interface MethodAggregate {
  method: PlacementMethod;
  /** How many findings this method actually produced a point for. */
  scored: number;
  /** Mean distance over those, or null when it never placed. */
  meanDistance: number | null;
}

export function pointDistance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Whether the truth point lies within the analyzer box (inclusive edges). */
export function boxContains(box: PhotoBoundingBox | null, p: Point): boolean {
  if (!box) return false;
  return p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h;
}

export function scoreFinding(truth: GroundTruthFinding, points: MethodPoints): FindingScore {
  return {
    photoId: truth.photoId,
    title: points.title,
    insideBox: boxContains(points.box, truth.truth),
    methods: PLACEMENT_METHODS.map((method) => {
      const p = points[method];
      return { method, distance: p ? pointDistance(p, truth.truth) : null };
    }),
  };
}

/** Mean distance per method across scored findings; missing points are excluded. */
export function scoreSet(rows: readonly FindingScore[]): MethodAggregate[] {
  return PLACEMENT_METHODS.map((method) => {
    const ds = rows
      .map((r) => r.methods.find((m) => m.method === method)?.distance ?? null)
      .filter((d): d is number => d !== null);
    return {
      method,
      scored: ds.length,
      meanDistance: ds.length > 0 ? ds.reduce((a, b) => a + b, 0) / ds.length : null,
    };
  });
}

/** Share of findings whose ground truth fell inside the analyzer box. */
export function boxContainmentRate(rows: readonly FindingScore[]): number | null {
  if (rows.length === 0) return null;
  return rows.filter((r) => r.insideBox).length / rows.length;
}
