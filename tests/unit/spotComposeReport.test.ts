import { describe, it, expect } from 'vitest';
import { composeReport } from '@/lib/spot/composeReport';
import {
  COMPOSE_REPORT_TOOL,
  SPOT_REPORT_SEVERITY_LABEL,
  SPOT_REPORT_DISCLAIMER,
  SPOT_REPORT_CLEAR_HEADLINE,
  SPOT_REPORT_NO_READ_HEADLINE,
  type ComposeReportInput,
} from '@/lib/spot/reportSchema';
import type { PhotoAnalysisOutput, PhotoFinding } from '@/types/db';

const finding = (over: Partial<PhotoFinding> = {}): PhotoFinding => ({
  title_standard: 'Door hardware',
  finding_standard: 'Handle may require tight grasping.',
  severity: 'major',
  standard: '§404.2.7',
  confidence: 0.7,
  confirmable: true,
  ...over,
});

const source = (over: Partial<PhotoAnalysisOutput> = {}): PhotoAnalysisOutput => ({
  scene: { standard: 'Entrance' },
  summary: { standard: 'One possible barrier.' },
  overall_risk: 'medium',
  positive_findings: { standard: [] },
  findings: [finding()],
  meta: { tool_call_present: true, stop_reason: 'tool_use' },
  ...over,
});

const modelOut = (over: Partial<ComposeReportInput> = {}): ComposeReportInput => ({
  overview: 'The entrance has one possible barrier worth addressing.',
  areas: [
    { title: 'Front door', concern: 'Round knob is hard to grasp.', remediation: 'Swap to a lever handle.', severity: 'major', cited_section: '§404.2.7', confirmable: true },
  ],
  ...over,
});

describe('composeReport', () => {
  it('drops citations the analyses never returned (no invented sections)', () => {
    const out = composeReport(
      modelOut({ areas: [{ title: 'X', concern: 'c', remediation: 'r', severity: 'minor', cited_section: '§999.9', confirmable: true }] }),
      [source()],
    );
    expect(out.items[0].citedSection).toBeUndefined();
  });

  it('keeps + links a citation the analyses did return', () => {
    const out = composeReport(modelOut(), [source()]);
    expect(out.items[0].citedSection).toBe('§404.2.7');
    expect(out.items[0].citedUrl).toMatch(/^https?:\/\//);
  });

  it('attaches plain-language education (title + rule) for a cataloged citation', () => {
    const out = composeReport(modelOut(), [source()]);
    expect(out.items[0].ruleTitle).toBeTruthy();
    expect(out.items[0].ruleExplanation).toBeTruthy();
  });

  it('adds no education when the citation was dropped as invalid', () => {
    const out = composeReport(
      modelOut({ areas: [{ title: 'X', concern: 'c', remediation: 'r', severity: 'minor', cited_section: '§999.9', confirmable: true }] }),
      [source()],
    );
    expect(out.items[0].citedSection).toBeUndefined();
    expect(out.items[0].ruleExplanation).toBeUndefined();
  });

  it('preserves an unconfirmable area as hedged — never dropped', () => {
    const out = composeReport(
      modelOut({ areas: [{ title: 'Ramp', concern: 'Slope may be steep.', remediation: 'Measure and regrade.', severity: 'major', confirmable: false }] }),
      [source({ findings: [finding({ confirmable: false })] })],
    );
    expect(out.kind).toBe('findings');
    expect(out.items).toHaveLength(1);
    expect(out.items[0].hedged).toBe(true);
    expect(out.items[0].hedgeNote).toBeTruthy();
  });

  it('absence-honesty: all-no-read sources → no_read, no fabricated areas', () => {
    const out = composeReport(modelOut(), [
      source({ findings: [], meta: { tool_call_present: false, stop_reason: 'end_turn' } }),
    ]);
    expect(out.kind).toBe('no_read');
    expect(out.items).toHaveLength(0);
    expect(out.headline).toBe(SPOT_REPORT_NO_READ_HEADLINE);
  });

  it('absence-honesty: read but nothing found + no model areas → clear', () => {
    const out = composeReport(modelOut({ areas: [] }), [source({ findings: [] })]);
    expect(out.kind).toBe('clear');
    expect(out.headline).toBe(SPOT_REPORT_CLEAR_HEADLINE);
  });

  it('always embeds the disclaimer', () => {
    expect(composeReport(modelOut(), [source()]).disclaimer).toBe(SPOT_REPORT_DISCLAIMER);
    expect(composeReport(modelOut({ areas: [] }), [source({ findings: [] })]).disclaimer).toBe(SPOT_REPORT_DISCLAIMER);
  });

  it('screening language only — no certifying verbs in labels/disclaimer/headlines', () => {
    const strings = [
      ...Object.values(SPOT_REPORT_SEVERITY_LABEL),
      SPOT_REPORT_DISCLAIMER,
      SPOT_REPORT_CLEAR_HEADLINE,
      SPOT_REPORT_NO_READ_HEADLINE,
    ].join(' ').toLowerCase();
    for (const banned of ['violation', 'compliant', 'certified', 'certify', 'in compliance']) {
      expect(strings).not.toContain(banned);
    }
  });

  it('exposes a well-formed compose_report tool definition', () => {
    expect(COMPOSE_REPORT_TOOL.name).toBe('compose_report');
    expect(COMPOSE_REPORT_TOOL.input_schema.required).toEqual(expect.arrayContaining(['overview', 'areas']));
  });
});
