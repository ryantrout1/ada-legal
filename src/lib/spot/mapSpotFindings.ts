/**
 * Ada Spot — free-read result mapper (pure).
 *
 * Maps the analyzer output into a view model the landing renders, enforcing
 * the three integrity rules in one testable place:
 *
 *   - Absence-honesty: distinguish "the model read the photos and nothing
 *     stands out" (kind 'clear') from "the model couldn't read the photos"
 *     (kind 'no_read', via meta.tool_call_present === false). An empty
 *     findings list is NOT automatically an all-clear.
 *   - Hedge-don't-drop: every finding is carried through; an unconfirmable
 *     one (confirmable === false) is flagged `hedged` for the UI to phrase as
 *     "worth verifying on-site", never omitted.
 *   - Never certify: the exported labels/headlines use screening language
 *     only — no "violation / compliant / certified".
 *
 * Renders the `standard` reading-level variant (the register for a business
 * owner). Pure + deterministic.
 */

import type {
  PhotoAnalysisOutput,
  PhotoFinding,
  PhotoFindingSeverity,
  PhotoOverallRisk,
} from '../../types/db.js';

/** Screening-language severity labels — never "violation". */
export const SPOT_SEVERITY_LABEL: Record<PhotoFindingSeverity, string> = {
  critical: 'Likely barrier',
  major: 'Possible barrier',
  minor: 'Worth a look',
  advisory: 'Minor note',
};

export const SPOT_HEDGE_NOTE = 'Based on the photo alone — worth verifying on-site.';
export const SPOT_CLEAR_HEADLINE = 'Nothing in these photos stands out as a likely barrier.';
export const SPOT_NO_READ_HEADLINE = "We couldn't get a clear enough read from these photos.";

export interface SpotResultItem {
  title: string;
  body: string;
  citedSection?: string;
  severity: PhotoFindingSeverity;
  /** True when the model couldn't fully assess this from the photo (confirmable === false). */
  hedged: boolean;
}

export interface SpotResultView {
  kind: 'no_read' | 'clear' | 'findings';
  scene?: string;
  summary?: string;
  overallRisk: PhotoOverallRisk;
  items: SpotResultItem[];
  positives: string[];
}

function mapFinding(f: PhotoFinding): SpotResultItem {
  return {
    title: f.title_standard,
    body: f.finding_standard,
    citedSection: f.standard || undefined,
    severity: f.severity,
    hedged: f.confirmable === false,
  };
}

export function mapSpotFindings(output: PhotoAnalysisOutput): SpotResultView {
  const base = {
    scene: output.scene?.standard,
    summary: output.summary?.standard,
    overallRisk: output.overall_risk,
    positives: output.positive_findings?.standard ?? [],
  };

  // Absence-honesty: an explicit refusal (model returned no tool call) is
  // NEVER shown as all-clear.
  if (output.meta && output.meta.tool_call_present === false) {
    return { kind: 'no_read', overallRisk: base.overallRisk, items: [], positives: [] };
  }

  const findings = output.findings ?? [];
  if (findings.length === 0) {
    return { kind: 'clear', ...base, items: [] };
  }

  // Hedge-don't-drop: map every finding, including unconfirmable ones.
  return { kind: 'findings', ...base, items: findings.map(mapFinding) };
}
