/**
 * Ada Spot — free-read *progress* mapper (pure).
 *
 * The streamed free read (analyzeStream) hands out the tool's partially
 * parsed JSON as it arrives. This maps that snapshot into the slice of the
 * view that is safe to render mid-flight.
 *
 * Two shapes, deliberately not one:
 *   - the snapshot is RAW tool JSON — `scene: string`, `findings[].title`.
 *   - the final result is PhotoAnalysisOutput — `scene: {standard}`,
 *     `findings[].title_standard` (validateOutput does that transform).
 * So this cannot reuse mapSpotFindings; it maps the raw shape and stops.
 *
 * The integrity rules, restated for the streaming case:
 *   - NO verdict mid-stream. SpotProgressView carries no `kind` and no
 *     `overallRisk`. An empty findings array at t=4s means "not generated
 *     yet", NOT 'clear' — rendering an all-clear over a half-finished
 *     analysis is exactly the false-negative absence-honesty exists to
 *     prevent. Only the final mapSpotFindings call decides a verdict.
 *   - Fully-formed only. A finding is emitted once every required field is
 *     present (the SDK's tolerant parser omits incomplete values rather
 *     than truncating them, so partial entries surface as `{}`). This is
 *     what keeps a half-written "no accessible route" — which was going to
 *     end "...visible from this angle" — off the screen.
 *   - Hedge-don't-drop still applies to what IS emitted: an unconfirmable
 *     finding streams in flagged, never dropped.
 */

import type { PhotoFindingSeverity } from '../../types/db.js';
import type { SpotResultItem } from './mapSpotFindings.js';

export interface SpotProgressView {
  scene?: string;
  summary?: string;
  positives: string[];
  /** Only findings whose every required field has arrived. */
  items: SpotResultItem[];
}

const SEVERITIES: readonly PhotoFindingSeverity[] = [
  'critical',
  'major',
  'minor',
  'advisory',
];

function isSeverity(v: unknown): v is PhotoFindingSeverity {
  return typeof v === 'string' && (SEVERITIES as readonly string[]).includes(v);
}

function nonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

/**
 * A finding is renderable only when the whole claim has landed: what it is
 * (title), why (finding), how serious (severity), and the confirmable flag
 * that decides whether it renders hedged. Anything missing → not yet.
 * `standard` (the citation) is optional here for the same reason the final
 * mapper treats it as optional.
 */
function mapRawFinding(raw: unknown): SpotResultItem | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const f = raw as Record<string, unknown>;
  if (!nonEmptyString(f.title)) return null;
  if (!nonEmptyString(f.finding)) return null;
  if (!isSeverity(f.severity)) return null;
  if (typeof f.confirmable !== 'boolean') return null;
  return {
    title: f.title,
    body: f.finding,
    citedSection: nonEmptyString(f.standard) ? f.standard : undefined,
    severity: f.severity,
    hedged: f.confirmable === false,
  };
}

export function mapSpotProgress(snapshot: unknown): SpotProgressView {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return { positives: [], items: [] };
  }
  const s = snapshot as Record<string, unknown>;

  const rawFindings = Array.isArray(s.findings) ? s.findings : [];
  const items: SpotResultItem[] = [];
  for (const raw of rawFindings) {
    const mapped = mapRawFinding(raw);
    // Skip in-progress entries rather than stopping — findings can only
    // complete in order, but tolerating a gap costs nothing and means an
    // out-of-order model can't stall the whole list.
    if (mapped) items.push(mapped);
  }

  const positives = Array.isArray(s.positive_findings)
    ? s.positive_findings.filter(nonEmptyString)
    : [];

  return {
    scene: nonEmptyString(s.scene) ? s.scene : undefined,
    summary: nonEmptyString(s.summary) ? s.summary : undefined,
    positives,
    items,
  };
}
