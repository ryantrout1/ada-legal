/**
 * The one number a reader can go and check.
 *
 * Three of the four findings in the sample report say, in their own words,
 * that a photograph cannot settle them — and each then hands the reader a
 * measurement: 32 inches of clear width, 34 to 48 inches to the pull bar, a
 * quarter-inch threshold lip. Those numbers are the most useful thing in the
 * report and they are currently buried mid-paragraph in `remediation`.
 *
 * They are not parsed out of that prose. One paragraph contains "at least 5
 * feet", "32 inches", "5 feet deep by 5 feet wide" and "1/4 inch"; a regex
 * would pick one of them confidently and sometimes pick wrong, and a wrong
 * measurement on an accessibility report is worse than no measurement. So the
 * model states the target as its own field, or there is no target.
 *
 * The guards below matter more than the passthrough. A model that returns a
 * paragraph in `value`, or a number with nothing saying what it measures, has
 * given us something unusable — and a target rail rendering a sentence
 * fragment in 31px type is worse than a card with no rail. In both cases the
 * whole target is dropped rather than half-rendered.
 *
 * Encodes acceptance criterion 6 from /plan phase 3 (Spot report redesign).
 */

import { describe, it, expect } from 'vitest';
import { composeReport } from '@/lib/spot/composeReport';
import { COMPOSE_REPORT_TOOL, type ComposeReportInput } from '@/lib/spot/reportSchema';
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

const area = (over: Record<string, unknown> = {}) => ({
  title: 'Front door',
  concern: 'Round knob is hard to grasp.',
  remediation: 'Swap to a lever handle.',
  severity: 'major' as const,
  cited_section: '§404.2.7',
  confirmable: true,
  ...over,
});

const run = (over: Record<string, unknown>) =>
  composeReport(
    { overview: 'The entrance has one possible barrier.', areas: [area(over)] } as ComposeReportInput,
    [source()],
  ).items[0];

describe('the compose tool asks for a target', () => {
  const areaProps = (
    COMPOSE_REPORT_TOOL.input_schema as {
      properties: { areas: { items: { properties: Record<string, unknown>; required: string[] } } };
    }
  ).properties.areas.items;

  it('declares the field', () => {
    expect(areaProps.properties).toHaveProperty('target');
  });

  it('does not require it', () => {
    // Most findings have no single number to check. Requiring one would make
    // the model invent them, which is the failure this whole design avoids.
    expect(areaProps.required).not.toContain('target');
  });
});

describe('composeReport — target passthrough', () => {
  it('carries a well-formed target onto the item', () => {
    const item = run({ target: { value: '32 in', label: 'clear width once the door is open' } });
    expect(item.target).toEqual({ value: '32 in', label: 'clear width once the door is open' });
  });

  it('omits the field entirely when the model gave none', () => {
    const item = run({});
    expect(item.target).toBeUndefined();
    // Not a null, not an empty object: the key should simply not serialize.
    expect(JSON.stringify(item)).not.toContain('target');
  });

  it('drops a target whose value is a paragraph, not a number', () => {
    const item = run({
      target: {
        value:
          'Measure from the ground up to the middle of the pull bar and confirm it sits between 34 and 48 inches',
        label: 'handle height',
      },
    });
    expect(item.target).toBeUndefined();
  });

  it('drops a target with no label saying what is measured', () => {
    expect(run({ target: { value: '32 in', label: '' } }).target).toBeUndefined();
    expect(run({ target: { value: '32 in' } }).target).toBeUndefined();
  });

  it('drops a target with no value', () => {
    expect(run({ target: { value: '', label: 'clear width' } }).target).toBeUndefined();
    expect(run({ target: { label: 'clear width' } }).target).toBeUndefined();
  });

  it('drops a malformed target rather than throwing', () => {
    // A bad target must not cost the buyer the whole report.
    expect(run({ target: 'thirty-two inches' }).target).toBeUndefined();
    expect(run({ target: null }).target).toBeUndefined();
    expect(run({ target: {} }).target).toBeUndefined();
  });

  it('trims surrounding whitespace rather than rendering it', () => {
    const item = run({ target: { value: '  32 in  ', label: '  clear width  ' } });
    expect(item.target).toEqual({ value: '32 in', label: 'clear width' });
  });
});
