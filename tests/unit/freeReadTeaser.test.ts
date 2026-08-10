/**
 * Ada Spot — the free read is a teaser, not the report.
 *
 * The free read used to hand the browser the entire analyzer output: every
 * finding, every explanation, the full summary paragraph. The paid report was
 * therefore selling something the visitor had already been given. This pins
 * the boundary: a few names, an honest count of what is held back, and nothing
 * else.
 *
 * The three integrity rules still bind — a teaser is allowed to withhold, it
 * is NOT allowed to lie:
 *   - Absence-honesty: no findings means "nothing stands out", never a teaser
 *     implying there is more behind the paywall. A model that could not read
 *     the photo says so.
 *   - Hedge-don't-drop: a shown finding that needs on-site confirmation stays
 *     flagged hedged.
 *   - Never certify: no verdict language anywhere in this layer.
 *
 * Ref: /plan Spot free-read teaser (no markers), Phase 1, criteria 1-3.
 */

import { describe, it, expect } from 'vitest';
import {
  buildFreeReadTeaser,
  FREE_READ_TEASER_MAX,
} from '@/lib/spot/freeReadTeaser';
import type { PhotoAnalysisOutput, PhotoFinding } from '@/types/db';

function finding(over: Partial<PhotoFinding> = {}): PhotoFinding {
  return {
    title_standard: 'A concern',
    finding_standard: 'The long explanation the buyer is paying for.',
    severity: 'major',
    standard: '603.1',
    confidence: 0.8,
    confirmable: true,
    ...over,
  };
}

function output(over: Partial<PhotoAnalysisOutput> = {}): PhotoAnalysisOutput {
  return {
    scene: { standard: 'A residential bathroom with a walk-in shower.' },
    summary: { standard: 'The headline concern is the raised curb, plus a fixed bench and no grab bars.' },
    overall_risk: 'high',
    positive_findings: { standard: ['Lever door handle'] },
    findings: [],
    ...over,
  };
}

/** The bathroom photo, as the analyzer actually reads it: 7 findings. */
const BATHROOM = output({
  findings: [
    finding({ title_standard: 'Fixed shower bench', severity: 'major', standard: '610.3', confirmable: false }),
    finding({ title_standard: 'Raised shower curb blocks entry', severity: 'critical', standard: '608.7' }),
    finding({ title_standard: 'No grab bars at the shower', severity: 'critical', standard: '609.1' }),
    finding({ title_standard: 'Closed vanity blocks knee clearance', severity: 'major', standard: '606.2' }),
    finding({ title_standard: 'Turning space may be tight', severity: 'major', standard: '304.3', confirmable: false }),
    finding({ title_standard: 'Mirror height', severity: 'minor', standard: '603.3' }),
    finding({ title_standard: 'Towel hook reach range', severity: 'advisory', standard: '308.2' }),
  ],
});

describe('buildFreeReadTeaser — what the free read is allowed to say', () => {
  it('shows at most three findings even when the analyzer found seven', () => {
    const t = buildFreeReadTeaser(BATHROOM);
    expect(t.kind).toBe('findings');
    expect(t.shown).toHaveLength(FREE_READ_TEASER_MAX);
    expect(FREE_READ_TEASER_MAX).toBe(3);
  });

  it('leads with the most serious barrier, not the first one the model listed', () => {
    // The bench (major) is findings[0]; the curb (critical) is findings[1].
    const t = buildFreeReadTeaser(BATHROOM);
    expect(t.shown[0]!.title).toBe('Raised shower curb blocks entry');
    expect(t.shown.map((s) => s.severity)).toEqual(['critical', 'critical', 'major']);
  });

  it('counts what it is holding back, and the two numbers agree', () => {
    const t = buildFreeReadTeaser(BATHROOM);
    expect(t.totalCount).toBe(7);
    expect(t.withheldCount).toBe(4);
    expect(t.shown.length + t.withheldCount).toBe(t.totalCount);
  });

  it('carries NOTHING but a name, a severity and the hedge flag', () => {
    const t = buildFreeReadTeaser(BATHROOM);
    // The explanation, the ADA section and the fix are the product. A row that
    // grew a `body` or a `citedSection` would give the report away one field
    // at a time.
    for (const row of t.shown) {
      expect(Object.keys(row).sort()).toEqual(['hedged', 'severity', 'title']);
    }
  });

  it('never lets a withheld finding reach the wire, even serialized', () => {
    const wire = JSON.stringify(buildFreeReadTeaser(BATHROOM));
    // Held back entirely — name and all.
    expect(wire).not.toContain('Mirror height');
    expect(wire).not.toContain('Towel hook reach range');
    expect(wire).not.toContain('Closed vanity blocks knee clearance');
    // No explanation for ANY finding, including the ones it shows.
    expect(wire).not.toContain('The long explanation the buyer is paying for.');
    // No ADA sections, and not the full summary paragraph either.
    expect(wire).not.toContain('608.7');
    expect(wire).not.toContain('The headline concern is the raised curb');
  });

  it('hedge-don\'t-drop: a shown finding that needs on-site confirmation stays flagged', () => {
    const t = buildFreeReadTeaser(
      output({
        findings: [
          finding({ title_standard: 'Fixed shower bench', severity: 'critical', standard: '610.3', confirmable: false }),
        ],
      }),
    );
    expect(t.shown[0]!.hedged).toBe(true);
  });

  it('counts one barrier once when the model cites the same section twice', () => {
    // Two findings, one section — the same barrier described twice. Counting
    // it as two would inflate the "and N more" promise the report has to keep.
    const t = buildFreeReadTeaser(
      output({
        findings: [
          finding({ title_standard: 'Curb at the shower', severity: 'major', standard: '608.7' }),
          finding({ title_standard: 'Raised threshold into shower', severity: 'critical', standard: '§608.7 ' }),
        ],
      }),
    );
    expect(t.totalCount).toBe(1);
    expect(t.withheldCount).toBe(0);
    // The more serious wording of the same barrier is the one that survives.
    expect(t.shown).toHaveLength(1);
    expect(t.shown[0]!.severity).toBe('critical');
  });

  it('keeps findings that cite no section distinct from each other', () => {
    const t = buildFreeReadTeaser(
      output({
        findings: [
          finding({ title_standard: 'Something odd', severity: 'major', standard: '' }),
          finding({ title_standard: 'Something else odd', severity: 'major', standard: '' }),
        ],
      }),
    );
    expect(t.totalCount).toBe(2);
  });

  it('says nothing stands out rather than teasing content it does not have', () => {
    const t = buildFreeReadTeaser(output({ findings: [] }));
    expect(t.kind).toBe('clear');
    expect(t.shown).toEqual([]);
    expect(t.withheldCount).toBe(0);
    expect(t.totalCount).toBe(0);
  });

  it('absence-honesty: an unreadable photo is no_read, never a clear or a teaser', () => {
    const t = buildFreeReadTeaser(
      output({ findings: [], meta: { tool_call_present: false, stop_reason: 'end_turn' } }),
    );
    expect(t.kind).toBe('no_read');
    expect(t.shown).toEqual([]);
    expect(t.withheldCount).toBe(0);
  });

  it('carries the scene so the reader knows what was read, but not the summary', () => {
    const t = buildFreeReadTeaser(BATHROOM);
    expect(t.scene).toBe('A residential bathroom with a walk-in shower.');
    expect(JSON.stringify(t)).not.toContain('summary');
  });

  it('withholds nothing when there are three or fewer findings', () => {
    const t = buildFreeReadTeaser(
      output({
        findings: [
          finding({ title_standard: 'One', standard: '1' }),
          finding({ title_standard: 'Two', standard: '2' }),
        ],
      }),
    );
    expect(t.shown).toHaveLength(2);
    expect(t.withheldCount).toBe(0);
  });
});
