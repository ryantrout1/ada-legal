import { describe, it, expect } from 'vitest';
import { composeReport, SpotCompositionError } from '@/lib/spot/composeReport';
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

/**
 * The failure these pin actually shipped. A model returned valid JSON whose
 * `overview` held the prose PLUS its own tool-call XML plus the entire
 * findings array serialized as text, and never emitted `areas`. It composed
 * to zero items under the "What these photos show" headline, passed review,
 * was released, and was emailed to a paying customer.
 *
 * Every rule above this point checks what a report SAYS. None of them asked
 * whether a report exists.
 *
 * Ref: /triage Spot report generation.
 */
describe('composition failure — refuses to render a report that is not there', () => {
  it('throws when the model returns no areas but the analyses found some', () => {
    // The observed failure exactly: sources found barriers, compose_report
    // came back empty.
    expect(() => composeReport(modelOut({ areas: [] }), [source()])).toThrow(SpotCompositionError);
  });

  it('does not quietly downgrade that case to "clear"', () => {
    // The alternative to throwing. It would state that nothing stands out
    // while the analyses were flagging barriers — the exact claim
    // absence-honesty exists to forbid, which makes silence the worst
    // option available here.
    try {
      composeReport(modelOut({ areas: [] }), [source()]);
      throw new Error('expected a throw');
    } catch (err) {
      expect(err).toBeInstanceOf(SpotCompositionError);
      expect((err as Error).message).toMatch(/no areas/i);
    }
  });

  it('still allows a genuinely clear read', () => {
    // Empty areas with empty source findings is not a failure, it is a
    // clean space. The guard must not swallow it.
    const out = composeReport(modelOut({ areas: [] }), [source({ findings: [] })]);
    expect(out.kind).toBe('clear');
  });

  it('still allows an all-no-read result', () => {
    const out = composeReport(modelOut({ areas: [] }), [
      source({ findings: [], meta: { tool_call_present: false, stop_reason: 'end_turn' } }),
    ]);
    expect(out.kind).toBe('no_read');
  });

  it('rejects an overview carrying tool-call syntax', () => {
    const leaked = 'Prose about the landing.</parameter> <parameter name="areas">[{"title":"x"}]';
    expect(() => composeReport(modelOut({ overview: leaked }), [source()])).toThrow(
      /tool-call syntax/i,
    );
  });

  it('rejects an overview far past its stated length', () => {
    // Specified as 2-4 sentences; the healthy reports on record run
    // 571-710 characters. The failure wrote 4,439.
    expect(() => composeReport(modelOut({ overview: 'x'.repeat(4439) }), [source()])).toThrow(
      /max/i,
    );
  });

  it('leaves a normal overview alone', () => {
    expect(composeReport(modelOut(), [source()]).overview).toBe(
      'The entrance has one possible barrier worth addressing.',
    );
  });
});

describe('item ordering', () => {
  /**
   * The markers on the photo are numbered by item order, so item order IS the
   * marker order. Composer output order is arbitrary — the curb came back
   * first one run and third the next, which meant the critical barrier was
   * marker 1 sometimes and marker 2 other times. Sort by severity so the most
   * serious concern is always number one, in the photo and in the list below
   * it, which are the same sequence.
   */
  const area = (title: string, severity: string) => ({
    title,
    concern: 'c',
    remediation: 'r',
    severity,
    confirmable: true,
    locatable: true,
  });

  it('orders items most critical first', () => {
    const out = composeReport(
      {
        overview: 'o',
        areas: [
          area('Cabinet', 'major'),
          area('Dispenser', 'minor'),
          area('Curb', 'critical'),
          area('Bench', 'major'),
        ],
      } as unknown as ComposeReportInput,
      [source()],
    );
    expect(out.items.map((i) => i.title)).toEqual(['Curb', 'Cabinet', 'Bench', 'Dispenser']);
  });

  it('is stable within a severity tier — composer order is preserved', () => {
    const out = composeReport(
      {
        overview: 'o',
        areas: [area('Cabinet', 'major'), area('Bench', 'major'), area('Grab bars', 'major')],
      } as unknown as ComposeReportInput,
      [source()],
    );
    expect(out.items.map((i) => i.title)).toEqual(['Cabinet', 'Bench', 'Grab bars']);
  });
});
