/**
 * Ada Spot — paid report schema + the compose_report tool.
 *
 * The model supplies substance (what's wrong per area, how to fix it, the ADA
 * section it maps to) via the structured compose_report tool; WE supply the
 * framing (severity labels, hedge notes, headlines, disclaimer) as fixed
 * strings, so screening-language and the embedded disclaimer are enforced in
 * code (composeReport), not left to model prose. Ref: /plan Ada Spot Phase 3a.
 */

import type { AiToolDefinition } from '../../engine/clients/types.js';
import type { PhotoFindingSeverity } from '../../types/db.js';

/** Screening-language severity labels — never "violation" (shared vocabulary with the free read). */
export const SPOT_REPORT_SEVERITY_LABEL: Record<PhotoFindingSeverity, string> = {
  critical: 'Likely barrier',
  major: 'Possible barrier',
  minor: 'Worth a look',
  advisory: 'Minor note',
};

export const SPOT_REPORT_HEDGE_NOTE = 'Worth a quick check in person to be sure.';
export const SPOT_REPORT_CLEAR_HEADLINE = 'Nothing in these photos stands out as a likely barrier.';
export const SPOT_REPORT_NO_READ_HEADLINE = "We couldn't get a clear enough read from these photos.";
export const SPOT_REPORT_FINDINGS_HEADLINE = 'What these photos show — and how to address it';

export const SPOT_REPORT_DISCLAIMER =
  'This report is an automated accessibility screening based on the photos you provided. ' +
  'It is a starting point for planning remediation — not a professional on-site inspection, ' +
  'a certification, or a legal determination. Measurements and conditions should be confirmed ' +
  'on-site before you rely on them.';

/** Structured output the model returns via compose_report. */
export interface ComposeReportArea {
  title: string;
  concern: string;
  remediation: string;
  severity: PhotoFindingSeverity;
  cited_section?: string;
  confirmable: boolean;
}
export interface ComposeReportInput {
  overview: string;
  areas: ComposeReportArea[];
}

/** The final persisted report content (spot_report.content). */
export interface SpotReportItem {
  title: string;
  concern: string;
  remediation: string;
  severity: PhotoFindingSeverity;
  severityLabel: string;
  citedSection?: string;
  citedUrl?: string;
  hedged: boolean;
  hedgeNote?: string;
}
export interface SpotReportContent {
  kind: 'no_read' | 'clear' | 'findings';
  headline: string;
  overview: string;
  items: SpotReportItem[];
  disclaimer: string;
  modelVersion?: string;
}

export const COMPOSE_REPORT_TOOL: AiToolDefinition = {
  name: 'compose_report',
  description:
    'Compose a remediation-oriented accessibility screening report from the per-photo analyses. ' +
    'Use screening language ("possible", "appears", "worth checking") — never "violation", ' +
    '"compliant", or "certified". For each distinct area, give the concern, what to fix and how, ' +
    'the severity, and the cited ADA section ONLY if an analysis provided one (never invent a section). ' +
    'Mark an area confirmable:false when the photo cannot conclusively establish it.',
  input_schema: {
    type: 'object',
    properties: {
      overview: { type: 'string', description: 'A 2-4 sentence whole-space summary in plain language.' },
      areas: {
        type: 'array',
        description: 'One entry per distinct area/concern. Empty if nothing stands out.',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Short area label, e.g. "Front entrance door".' },
            concern: { type: 'string', description: 'Plain description of the possible barrier.' },
            remediation: { type: 'string', description: 'What to fix and how.' },
            severity: { type: 'string', enum: ['critical', 'major', 'minor', 'advisory'] },
            cited_section: { type: 'string', description: 'ADA section from an analysis, e.g. "§404.2.7". Omit if none.' },
            confirmable: { type: 'boolean', description: 'False when the photo cannot conclusively establish it.' },
          },
          required: ['title', 'concern', 'remediation', 'severity', 'confirmable'],
        },
      },
    },
    required: ['overview', 'areas'],
  },
};
