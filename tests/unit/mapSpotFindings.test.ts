import { describe, it, expect } from 'vitest';
import {
  mapSpotFindings,
  SPOT_SEVERITY_LABEL,
  SPOT_HEDGE_NOTE,
  SPOT_CLEAR_HEADLINE,
  SPOT_NO_READ_HEADLINE,
} from '@/lib/spot/mapSpotFindings';
import type { PhotoAnalysisOutput, PhotoFinding } from '@/types/db';

const finding = (over: Partial<PhotoFinding> = {}): PhotoFinding => ({
  title_standard: 'Door Pull Hardware',
  finding_standard: 'The handle looks like it may require tight grasping to operate.',
  severity: 'major',
  standard: '§404.2.7',
  confidence: 0.7,
  confirmable: true,
  ...over,
});

const output = (over: Partial<PhotoAnalysisOutput> = {}): PhotoAnalysisOutput => ({
  scene: { standard: 'Storefront entrance with a single glass door.' },
  summary: { standard: 'One possible barrier at the entry.' },
  overall_risk: 'medium',
  positive_findings: { standard: ['Curb cut present at the corner'] },
  findings: [finding()],
  ...over,
});

describe('mapSpotFindings', () => {
  it('returns no_read when the model could not read the photos (tool_call_present false)', () => {
    const view = mapSpotFindings(output({ findings: [], meta: { tool_call_present: false, stop_reason: 'end_turn' } }));
    expect(view.kind).toBe('no_read');
  });

  it('returns clear (not no_read) when the model read the photos and found nothing', () => {
    const withMeta = mapSpotFindings(output({ findings: [], meta: { tool_call_present: true, stop_reason: 'tool_use' } }));
    expect(withMeta.kind).toBe('clear');
    // meta absent (older rows) is treated as a real read, not a refusal
    const noMeta = mapSpotFindings(output({ findings: [] }));
    expect(noMeta.kind).toBe('clear');
    expect(noMeta.summary).toContain('possible barrier');
  });

  it('maps findings and NEVER drops an unconfirmable one — it renders hedged', () => {
    const view = mapSpotFindings(
      output({ findings: [finding(), finding({ title_standard: 'Ramp slope', confirmable: false })] }),
    );
    expect(view.kind).toBe('findings');
    expect(view.items).toHaveLength(2); // both present — nothing dropped
    const ramp = view.items.find((i) => i.title === 'Ramp slope')!;
    expect(ramp.hedged).toBe(true);
    expect(view.items.find((i) => i.title === 'Door Pull Hardware')!.hedged).toBe(false);
  });

  it('carries scene, summary, cited section, severity, and positives through', () => {
    const view = mapSpotFindings(output());
    expect(view.scene).toContain('Storefront');
    expect(view.items[0].citedSection).toBe('§404.2.7');
    expect(view.items[0].severity).toBe('major');
    expect(view.positives).toEqual(['Curb cut present at the corner']);
  });

  it('uses screening language only — no certifying verbs anywhere in the labels', () => {
    const strings = [
      ...Object.values(SPOT_SEVERITY_LABEL),
      SPOT_HEDGE_NOTE,
      SPOT_CLEAR_HEADLINE,
      SPOT_NO_READ_HEADLINE,
    ].join(' ').toLowerCase();
    for (const banned of ['violation', 'compliant', 'certified', 'certify', 'in compliance']) {
      expect(strings).not.toContain(banned);
    }
  });
});
