/**
 * The free-read endpoint hands over a teaser, and only a teaser.
 *
 * Truncating the list in the browser would have been a paywall in name only:
 * the withheld findings would still be sitting in the network payload, one
 * DevTools tab away. The withholding has to happen on the server, and it has
 * to hold on BOTH ways out — the `done` frame and the JSON body — plus the
 * progress frames that stream while the analysis is still running.
 *
 * The progress leak is the one that is easy to miss. The streaming panel used
 * to paint the full summary and every finding title as they landed, so a
 * visitor who watched the spinner saw the entire report before the teaser
 * replaced it.
 *
 * Following this repo's convention (see stripeWebhook.test.ts), the business
 * logic is exercised directly rather than through a mocked req/res; the HTTP
 * surface is asserted at the source level, the same way spotPriceConsistency
 * pins the price across files that cannot import each other.
 *
 * Ref: /plan Spot free-read teaser (no markers), Phase 1, criterion 2.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { buildFreeReadTeaser } from '@/lib/spot/freeReadTeaser';
import { mapSpotProgress } from '@/lib/spot/mapSpotProgress';
import type { PhotoAnalysisOutput } from '@/types/db';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8');

const ANALYSIS: PhotoAnalysisOutput = {
  scene: { standard: 'A residential bathroom.' },
  summary: { standard: 'The headline concern is the raised shower curb, plus a fixed bench.' },
  overall_risk: 'high',
  positive_findings: { standard: ['Lever door handle'] },
  findings: [
    {
      title_standard: 'Raised shower curb blocks entry',
      finding_standard: 'A wheelchair cannot roll over this curb, so the shower is unusable.',
      severity: 'critical',
      standard: '608.7',
      confidence: 0.9,
      confirmable: true,
    },
    {
      title_standard: 'No grab bars at the shower',
      finding_standard: 'No grab bars are visible on any wall of the shower enclosure.',
      severity: 'critical',
      standard: '609.1',
      confidence: 0.85,
      confirmable: true,
    },
    {
      title_standard: 'Fixed shower bench',
      finding_standard: 'The bench does not fold, which limits how the shower can be used.',
      severity: 'major',
      standard: '610.3',
      confidence: 0.8,
      confirmable: false,
    },
    {
      title_standard: 'Closed vanity blocks knee clearance',
      finding_standard: 'The cabinet under the sink prevents a forward approach.',
      severity: 'major',
      standard: '606.2',
      confidence: 0.75,
      confirmable: true,
    },
    {
      title_standard: 'Turning space may be tight',
      finding_standard: 'The floor area may not allow a 60-inch turning circle.',
      severity: 'major',
      standard: '304.3',
      confidence: 0.6,
      confirmable: false,
    },
    {
      title_standard: 'Mirror height',
      finding_standard: 'The mirror bottom edge may sit above the maximum height.',
      severity: 'minor',
      standard: '603.3',
      confidence: 0.5,
      confirmable: false,
    },
    {
      title_standard: 'Towel hook reach range',
      finding_standard: 'The hook may be mounted above the maximum reach range.',
      severity: 'advisory',
      standard: '308.2',
      confidence: 0.4,
      confirmable: false,
    },
  ],
};

/** Everything a paying buyer gets that a free visitor must not. */
const PAID_ONLY_STRINGS = [
  'A wheelchair cannot roll over this curb',
  'No grab bars are visible on any wall',
  'The bench does not fold',
  'The cabinet under the sink prevents a forward approach',
  'The mirror bottom edge may sit above',
  'The headline concern is the raised shower curb',
  'Mirror height',
  'Towel hook reach range',
];

describe('the free-read payload withholds the report', () => {
  it('serializes a teaser that contains none of the paid content', () => {
    const wire = JSON.stringify({
      tier: 'allowed',
      teaser: buildFreeReadTeaser(ANALYSIS),
      upsell: { price_usd: 79 },
    });

    for (const secret of PAID_ONLY_STRINGS) {
      expect(wire).not.toContain(secret);
    }
    // What it DOES carry: three names and an honest count.
    expect(wire).toContain('Raised shower curb blocks entry');
    expect(JSON.parse(wire).teaser.withheldCount).toBe(4);
  });

  it('streams no findings and no summary while the analysis is still running', () => {
    // The raw mid-flight tool JSON — the shape analyzeStream hands over.
    const snapshot = {
      scene: 'A residential bathroom.',
      summary: 'The headline concern is the raised shower curb, plus a fixed bench.',
      positive_findings: ['Lever door handle'],
      findings: [
        {
          title: 'Raised shower curb blocks entry',
          finding: 'A wheelchair cannot roll over this curb.',
          severity: 'critical',
          confirmable: true,
        },
        {
          title: 'Mirror height',
          finding: 'The mirror may sit too high.',
          severity: 'minor',
          confirmable: false,
        },
      ],
    };

    const frame = JSON.stringify(mapSpotProgress(snapshot));

    expect(frame).not.toContain('Mirror height');
    expect(frame).not.toContain('A wheelchair cannot roll over this curb');
    expect(frame).not.toContain('The headline concern');
    // The scene is the one thing it may say: it names what is being read
    // without naming a single barrier.
    expect(JSON.parse(frame).scene).toBe('A residential bathroom.');
  });
});

describe('both ways out of the endpoint carry the teaser', () => {
  const src = read('api/spot/analyze.ts');

  it('the done frame sends the teaser, not the analyzer output', () => {
    const doneFrame = src.match(/writeSseFrame\(res, 'done', ([^;]+)\);/);
    expect(doneFrame?.[1]).toContain('teaser');
    expect(doneFrame?.[1]).not.toContain('result: result.output');
  });

  it('the JSON body sends the teaser, not the analyzer output', () => {
    const jsonBody = src.match(/return res\.status\(200\)\.json\(([^;]+)\);/);
    expect(jsonBody?.[1]).toContain('teaser');
    expect(jsonBody?.[1]).not.toContain('result: result.output');
  });

  it('still persists the full analysis server-side for the review queue', () => {
    // Withholding is a presentation boundary, not data loss: Ryan and Gina
    // review free reads in admin, and the analyzer improves off these rows.
    expect(src).toContain('result: result.output');
    expect(src).toMatch(/store\.insertRead\(/);
  });
});
