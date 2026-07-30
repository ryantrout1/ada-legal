/**
 * How a Spot report is arranged before anything renders it.
 *
 * The findings in a report are not four of the same thing. `composeReport`
 * sets `hedged = confirmable === false`, so every item already carries the
 * distinction that matters most to a reader: did the photo settle this, or
 * does someone have to go and look. In the sample report that is one item
 * against three, and the current page renders all four identically.
 *
 * All of that reasoning lives here rather than in the component because this
 * repo has no React render testing — no @testing-library/react, vitest runs on
 * `node`. Anything left inside the view can only be checked by eye, so the
 * part that can be wrong is pulled out to where a test can reach it.
 *
 * Encodes acceptance criteria 1, 2 and 3 from /plan phase 1 (Spot report
 * redesign).
 */

import { describe, it, expect } from 'vitest';
import { groupFindings, stripEntries, summaryLine } from '@/lib/spot/reportLayout';
import type { SpotReportItem } from '@/lib/spot/reportSchema';

function item(title: string, hedged: boolean): SpotReportItem {
  return {
    title,
    concern: 'c',
    remediation: 'r',
    severity: hedged ? 'minor' : 'major',
    severityLabel: hedged ? 'Worth a look' : 'Possible barrier',
    hedged,
  };
}

/** The shape of the live report at s-vwwz4fcdma3r: one settled, three not. */
const SAMPLE: SpotReportItem[] = [
  item('Trash and ash receptacles in front of the entrance door', false),
  item('Door pull handle — height and how hard the door is to open', true),
  item('Metal threshold at the bottom of the doorway', true),
  item('Approach paving and entry mat', true),
];

describe('groupFindings', () => {
  it('splits on whether the photo settled the finding', () => {
    const g = groupFindings(SAMPLE);
    expect(g.confirmed.map((i) => i.title)).toEqual([
      'Trash and ash receptacles in front of the entrance door',
    ]);
    expect(g.unconfirmed).toHaveLength(3);
  });

  it('loses nothing', () => {
    // The failure this guards: a filter that drops an item with an unexpected
    // shape, so a finding somebody paid for silently never renders.
    const g = groupFindings(SAMPLE);
    expect(g.confirmed.length + g.unconfirmed.length).toBe(SAMPLE.length);
  });

  it('keeps the order within each group', () => {
    const g = groupFindings(SAMPLE);
    expect(g.unconfirmed.map((i) => i.title)).toEqual([
      'Door pull handle — height and how hard the door is to open',
      'Metal threshold at the bottom of the doorway',
      'Approach paving and entry mat',
    ]);
  });

  it('returns empty groups for a report with no findings', () => {
    // `clear` and `no_read` reports both arrive here with items: [].
    const g = groupFindings([]);
    expect(g.confirmed).toEqual([]);
    expect(g.unconfirmed).toEqual([]);
  });

  it('handles a report where nothing could be settled', () => {
    const g = groupFindings([item('a', true), item('b', true)]);
    expect(g.confirmed).toEqual([]);
    expect(g.unconfirmed).toHaveLength(2);
  });

  it('handles a report where everything could', () => {
    const g = groupFindings([item('a', false), item('b', false)]);
    expect(g.confirmed).toHaveLength(2);
    expect(g.unconfirmed).toEqual([]);
  });
});

describe('summaryLine', () => {
  it('states the shape of the report in one sentence', () => {
    expect(summaryLine(groupFindings(SAMPLE))).toBe('One thing to fix. Three to measure.');
  });

  it('drops the half that has no items', () => {
    // An empty group must not produce "Zero things to fix."
    expect(summaryLine(groupFindings([item('a', true), item('b', true), item('c', true)]))).toBe(
      'Three things to measure.',
    );
    expect(summaryLine(groupFindings([item('a', false), item('b', false)]))).toBe(
      'Two things to fix.',
    );
  });

  it('gets singular and plural right on both halves', () => {
    expect(summaryLine(groupFindings([item('a', false), item('b', true)]))).toBe(
      'One thing to fix. One to measure.',
    );
    expect(summaryLine(groupFindings([item('a', true)]))).toBe('One thing to measure.');
  });

  it('returns null when there is nothing to summarise', () => {
    // A `clear` report already says so in its headline. A derived line reading
    // "Nothing to fix." underneath it would be a second, weaker claim.
    expect(summaryLine(groupFindings([]))).toBeNull();
  });

  it('spells small numbers and gives up gracefully on large ones', () => {
    const many = Array.from({ length: 12 }, (_, i) => item(`i${i}`, true));
    expect(summaryLine(groupFindings(many))).toBe('12 things to measure.');
    const nine = Array.from({ length: 9 }, (_, i) => item(`i${i}`, true));
    expect(summaryLine(groupFindings(nine))).toBe('Nine things to measure.');
  });

  it('never certifies', () => {
    // Same rule the release email is held to. The findings themselves say
    // "Possible barrier"; a derived summary must not upgrade that to a
    // determination.
    const lines = [
      summaryLine(groupFindings(SAMPLE)),
      summaryLine(groupFindings([item('a', false)])),
      summaryLine(groupFindings([item('a', true)])),
    ];
    for (const line of lines) {
      const blob = (line ?? '').toLowerCase();
      for (const banned of ['violation', 'compliant', 'certified', 'certify', 'non-compliant']) {
        expect(blob).not.toContain(banned);
      }
    }
  });
});

/**
 * Phase 3 — /plan Spot report redesign.
 *
 * The strip across the top of the report is every measurable target in one
 * glance: the numbers you are about to go and check. It is derived, so a
 * report whose findings carry no targets simply has no strip rather than an
 * empty band.
 */
describe('stripEntries', () => {
  const withTarget = (title: string, value: string, label: string): SpotReportItem => ({
    ...item(title, true),
    target: { value, label },
  });

  it('returns one entry per finding that carries a target, in order', () => {
    const entries = stripEntries([
      withTarget('a', '32 in', 'clear doorway width'),
      withTarget('b', '34–48 in', 'handle height'),
    ]);
    expect(entries).toEqual([
      { value: '32 in', label: 'clear doorway width' },
      { value: '34–48 in', label: 'handle height' },
    ]);
  });

  it('skips findings with no target but keeps the rest', () => {
    const entries = stripEntries([
      item('no target', false),
      withTarget('has one', '¼ in', 'threshold lip'),
      item('also none', true),
    ]);
    expect(entries).toEqual([{ value: '¼ in', label: 'threshold lip' }]);
  });

  it('returns nothing when no finding carries a target', () => {
    // Every report generated before this field existed. They are permanent,
    // so this is not a transitional case — it is forever.
    expect(stripEntries(SAMPLE)).toEqual([]);
    expect(stripEntries([])).toEqual([]);
  });
});
