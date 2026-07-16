import { describe, it, expect } from 'vitest';
import { mapSpotProgress } from '@/lib/spot/mapSpotProgress';

describe('mapSpotProgress', () => {
  it('returns an empty view for a snapshot with nothing in it yet', () => {
    expect(mapSpotProgress({})).toEqual({ positives: [], items: [] });
  });

  it('tolerates a non-object snapshot', () => {
    expect(mapSpotProgress(null)).toEqual({ positives: [], items: [] });
    expect(mapSpotProgress('nope')).toEqual({ positives: [], items: [] });
    expect(mapSpotProgress([1, 2])).toEqual({ positives: [], items: [] });
  });

  it('surfaces scene and summary once present', () => {
    const v = mapSpotProgress({ scene: 'A concrete entrance', summary: 'One concern.' });
    expect(v.scene).toBe('A concrete entrance');
    expect(v.summary).toBe('One concern.');
  });

  it('emits only fully-formed findings and skips in-progress ones', () => {
    const v = mapSpotProgress({
      scene: 'S',
      findings: [
        {
          title: 'No ramp',
          finding: 'Steps only.',
          severity: 'critical',
          standard: '§206.2.1',
          confidence: 0.9,
          confirmable: true,
        },
        {}, // still being written
      ],
    });
    expect(v.items).toHaveLength(1);
    expect(v.items[0].title).toBe('No ramp');
    expect(v.items[0].citedSection).toBe('§206.2.1');
    expect(v.items[0].hedged).toBe(false);
  });

  it('never renders a claim that is missing any required field', () => {
    // Each case drops exactly one required field — none may render.
    const base = {
      title: 'Door hardware',
      finding: 'Round knob.',
      severity: 'major',
      confirmable: true,
    };
    for (const drop of ['title', 'finding', 'severity', 'confirmable'] as const) {
      const partial: Record<string, unknown> = { ...base };
      delete partial[drop];
      expect(mapSpotProgress({ findings: [partial] }).items).toHaveLength(0);
    }
    // A garbage severity is not a severity.
    expect(
      mapSpotProgress({ findings: [{ ...base, severity: 'catastrophic' }] }).items,
    ).toHaveLength(0);
  });

  it('hedge-don\'t-drop: an unconfirmable finding streams in flagged, not omitted', () => {
    const v = mapSpotProgress({
      findings: [
        {
          title: 'Door closer speed',
          finding: 'Cannot time it from a photo.',
          severity: 'minor',
          confidence: 0.4,
          confirmable: false,
        },
      ],
    });
    expect(v.items).toHaveLength(1);
    expect(v.items[0].hedged).toBe(true);
  });

  it('carries no verdict — an empty findings array mid-stream is not "clear"', () => {
    const v = mapSpotProgress({ scene: 'S', summary: 'Sum.', findings: [] });
    expect(v.items).toEqual([]);
    // The progress view has no kind / overallRisk to render a verdict from.
    expect('kind' in v).toBe(false);
    expect('overallRisk' in v).toBe(false);
  });

  it('filters non-string entries out of positive_findings', () => {
    expect(mapSpotProgress({ positive_findings: ['curb cut present', '', 7, null] }).positives).toEqual([
      'curb cut present',
    ]);
  });

  it('maps real fragments the way the SDK parser actually hands them over', async () => {
    // Drive the mapper with the SDK's own tolerant parser — the same one
    // MessageStream uses to build the inputJson snapshot — so this pins the
    // real contract, not an imagined one.
    const { partialParse } = (await import(
      '@anthropic-ai/sdk/_vendor/partial-json-parser/parser.js'
    )) as { partialParse: (s: string) => unknown };

    const midScene = '{"scene": "A concrete entra';
    expect(mapSpotProgress(partialParse(midScene)).scene).toBeUndefined();

    const sceneDone =
      '{"scene": "A concrete entrance with two steps", "summary": "The main ent';
    const v1 = mapSpotProgress(partialParse(sceneDone));
    expect(v1.scene).toBe('A concrete entrance with two steps');
    expect(v1.summary).toBeUndefined(); // still mid-write — must not render

    const oneFindingDone =
      '{"scene":"S.","summary":"Sum.","positive_findings":["curb cut present"],' +
      '"findings":[{"title":"No ramp","finding":"Steps only.","severity":"critical",' +
      '"standard":"§206.2.1","confidence":0.9,"confirmable":true},{"title":"Door hard';
    const v2 = mapSpotProgress(partialParse(oneFindingDone));
    expect(v2.items.map((i) => i.title)).toEqual(['No ramp']);
    expect(v2.positives).toEqual(['curb cut present']);
  });
});
