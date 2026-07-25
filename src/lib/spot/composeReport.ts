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
 *
 * THROWS on a composition that cannot be honest. Every rule above is about
 * what a report SAYS; none of them asked whether a report exists. A model
 * returned valid JSON containing no report at all — prose plus its own
 * tool-call XML serialized inside the overview string, `areas` never emitted
 * — and it composed to zero items under the "What these photos show"
 * headline, was reviewed, released and emailed to a paying customer.
 *
 * Failing loudly is the only honest option here. Downgrading a zero-item
 * composition to `clear` would state that nothing stands out while the
 * per-photo analyses were flagging barriers, which is precisely the claim
 * absence-honesty exists to forbid. Ref: /triage Spot report generation.
 */

/** A composition that cannot be rendered honestly. Caller regenerates. */
export class SpotCompositionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SpotCompositionError';
  }
}

/**
 * The overview is specified as 2-4 sentences; the healthy reports on record
 * run 571-710 characters. This ceiling is not a style rule, it is a
 * corruption signal: the failure wrote 4,439.
 */
const MAX_OVERVIEW_CHARS = 1500;

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

  // A composition step that returned nothing while the sources returned
  // findings has failed. There is no honest `kind` for it: not `findings`
  // (there are none to show), not `clear` (the analyses disagree), not
  // `no_read` (the read succeeded).
  if (!allReadFailed && items.length === 0 && anySourceFindings) {
    throw new SpotCompositionError(
      'compose_report returned no areas while the photo analyses found some',
    );
  }

  // Corruption signatures in the overview. The observed failure serialized
  // the entire findings array into this string along with the literal
  // tool-call delimiters, so both the markers and the length are checked —
  // a future malformation may carry only one of them.
  const overview = modelOutput.overview ?? '';
  if (overview.includes('<parameter') || overview.includes('</parameter')) {
    throw new SpotCompositionError('compose_report overview contains tool-call syntax');
  }
  if (overview.length > MAX_OVERVIEW_CHARS) {
    throw new SpotCompositionError(
      `compose_report overview is ${overview.length} chars (max ${MAX_OVERVIEW_CHARS})`,
    );
  }

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
