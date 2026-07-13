/**
 * Ada Spot — compose the final report (pure).
 *
 * Takes the model's structured compose_report output + the source per-photo
 * analyses, and assembles the validated SpotReportContent. Enforces the
 * integrity rules in code rather than trusting model prose:
 *   - Citation-validity: keep a cited section only if an analysis actually
 *     returned it (never surface an invented §).
 *   - Hedge-don't-drop: an unconfirmable area is kept and flagged hedged.
 *   - Absence-honesty at the whole-space level: all-no-read → no_read (no
 *     fabricated areas); read-but-nothing-found → clear; else findings.
 *   - Disclaimer always embedded from the fixed string.
 * Framing (labels, hedge note, headlines, disclaimer) is ours, so screening
 * language can't drift. Ref: /plan Ada Spot Phase 3a.
 */

import { guideUrlForStandard } from '../../engine/package/standardsGuideLink.js';
import { educationForSection } from '../adaCatalog.js';
import type { PhotoAnalysisOutput } from '../../types/db.js';
import {
  SPOT_REPORT_SEVERITY_LABEL,
  SPOT_REPORT_HEDGE_NOTE,
  SPOT_REPORT_CLEAR_HEADLINE,
  SPOT_REPORT_NO_READ_HEADLINE,
  SPOT_REPORT_FINDINGS_HEADLINE,
  SPOT_REPORT_DISCLAIMER,
  type ComposeReportInput,
  type SpotReportContent,
  type SpotReportItem,
} from './reportSchema.js';

export function composeReport(
  modelOutput: ComposeReportInput,
  sources: PhotoAnalysisOutput[],
): SpotReportContent {
  // The only citations we'll surface are ones an analysis actually produced.
  const validSections = new Set<string>();
  for (const s of sources) {
    for (const f of s.findings ?? []) {
      if (f.standard) validSections.add(f.standard);
    }
  }

  // Read-quality signals from the sources (not from the model).
  const allReadFailed =
    sources.length > 0 && sources.every((s) => s.meta?.tool_call_present === false);
  const anySourceFindings = sources.some((s) => (s.findings ?? []).length > 0);

  const items: SpotReportItem[] = (modelOutput.areas ?? []).map((a) => {
    const citedSection = a.cited_section && validSections.has(a.cited_section) ? a.cited_section : undefined;
    const education = citedSection ? educationForSection(citedSection) : undefined;
    const hedged = a.confirmable === false;
    return {
      title: a.title,
      concern: a.concern,
      remediation: a.remediation,
      severity: a.severity,
      severityLabel: SPOT_REPORT_SEVERITY_LABEL[a.severity],
      citedSection,
      // Prefer the section-specific guide page from the catalog; fall back to
      // the chapter-level link.
      citedUrl: citedSection ? (education?.guideUrl ?? guideUrlForStandard(citedSection)) : undefined,
      ruleTitle: education?.ruleTitle,
      ruleExplanation: education?.ruleExplanation,
      hedged,
      hedgeNote: hedged ? SPOT_REPORT_HEDGE_NOTE : undefined,
    };
  });

  let kind: SpotReportContent['kind'];
  let headline: string;
  if (allReadFailed) {
    kind = 'no_read';
    headline = SPOT_REPORT_NO_READ_HEADLINE;
  } else if (items.length === 0 && !anySourceFindings) {
    kind = 'clear';
    headline = SPOT_REPORT_CLEAR_HEADLINE;
  } else {
    kind = 'findings';
    headline = SPOT_REPORT_FINDINGS_HEADLINE;
  }

  return {
    kind,
    headline,
    overview: kind === 'no_read' ? SPOT_REPORT_NO_READ_HEADLINE : modelOutput.overview,
    items: kind === 'no_read' ? [] : items,
    disclaimer: SPOT_REPORT_DISCLAIMER,
  };
}
