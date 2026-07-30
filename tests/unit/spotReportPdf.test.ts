/**
 * The Spot report as a downloadable PDF.
 *
 * Mirrors letterPdf.test.ts and transcriptPdf.test.ts: no byte comparison —
 * that breaks on every @react-pdf bump and tells you nothing when it does. We
 * assert a non-empty buffer carrying the %PDF magic number, and we test the
 * slug paths directly against a fake store rather than through the HTTP
 * wrapper, which only maps null to 404.
 *
 * THE ONE THAT MATTERS. A released report is the only thing this may render.
 * The review queue exists because a person reads every report before it goes
 * out; an endpoint that served a pending draft would walk straight around
 * that gate, and the slug is guessable to anyone who already has one for a
 * different report in the same format.
 *
 * The parity assertions are the other half. Two renderings of one document is
 * exactly the shape that put two email palettes below the AAA floor without
 * anyone noticing. The PDF composes from reportLayout so the grouping and the
 * summary line have one definition; only the styling is written twice.
 *
 * Encodes acceptance criteria 1-4 from /plan phase 1 (Download the Spot
 * report as a PDF).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readCode } from '../support/sourceText.js';
import {
  buildSpotReportPdf,
  renderSpotReportPdfForSlug,
  type SpotReportPdfStore,
} from '@/engine/spot/reportPdf';
import type { SpotReportContent } from '@/lib/spot/reportSchema';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const CONTENT: SpotReportContent = {
  kind: 'findings',
  headline: 'What these photos show — and how to address it',
  overview: 'You photographed one spot: the glass front entrance.',
  disclaimer: 'This report is an automated accessibility screening.',
  items: [
    {
      title: 'Trash and ash receptacles in front of the entrance door',
      concern: 'Two bins sit in the approach to the door.',
      remediation: 'Move both receptacles at least 5 feet to the side.',
      severity: 'major',
      severityLabel: 'Possible barrier',
      citedSection: '§404.2.4',
      citedUrl: 'https://adalegallink.com/standards-guide/guide/entrances',
      ruleTitle: 'Doors, Doorways, and Gates',
      ruleExplanation: 'Clear opening width 32 in min.',
      hedged: false,
    },
    {
      title: 'Door pull handle — height and grip',
      concern: 'The photo cannot show how high it is mounted.',
      remediation: 'Measure from the ground to the middle of the bar.',
      severity: 'minor',
      severityLabel: 'Worth a look',
      hedged: true,
      hedgeNote: 'Worth a quick check in person to be sure.',
      target: { value: '34-48 in', label: 'height of the pull bar' },
    },
  ],
};

const isPdf = (buf: Buffer) => buf.subarray(0, 5).toString('latin1') === '%PDF-';

/** A 1x1 PNG, so an image path is exercised without touching the network. */
const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function store(over: Partial<SpotReportPdfStore> = {}): SpotReportPdfStore {
  return {
    async getReleasedReportBySlug(slug) {
      return slug === 's-live' ? { content: CONTENT, sessionId: 'sess-1' } : null;
    },
    async sessionPhotoState() {
      return { urls: [], purged: false };
    },
    ...over,
  };
}

describe('buildSpotReportPdf', () => {
  it('renders a non-empty PDF', async () => {
    const buf = await buildSpotReportPdf(CONTENT, []);
    expect(isPdf(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(1000);
  });

  it('renders a report whose photos have been swept', async () => {
    // spot_photo runs a 90-day clock while the report is permanent, so a
    // report with no photos is the eventual state of every report.
    const buf = await buildSpotReportPdf(CONTENT, []);
    expect(isPdf(buf)).toBe(true);
  });

  it('renders with photos', async () => {
    const buf = await buildSpotReportPdf(CONTENT, [PIXEL]);
    expect(isPdf(buf)).toBe(true);
  });

  it('renders a report with no findings at all', async () => {
    // `clear` and `no_read` reports both arrive with items: [].
    const buf = await buildSpotReportPdf(
      { ...CONTENT, kind: 'clear', items: [] },
      [],
    );
    expect(isPdf(buf)).toBe(true);
  });
});

describe('renderSpotReportPdfForSlug', () => {
  it('renders a released report', async () => {
    const buf = await renderSpotReportPdfForSlug(store(), 's-live');
    expect(buf).not.toBeNull();
    expect(isPdf(buf!)).toBe(true);
  });

  it('returns null for a slug that is not a released report', async () => {
    // getReleasedReportBySlug already refuses pending and rejected drafts —
    // the same function the JSON endpoint uses. Unknown, malformed and
    // not-yet-approved are one answer here so the caller cannot tell them
    // apart.
    for (const slug of ['s-unknown', '', '../etc/passwd', 's-LIVE']) {
      expect(await renderSpotReportPdfForSlug(store(), slug)).toBeNull();
    }
  });

  it('asks the store for photos belonging to that report’s session', async () => {
    let askedFor: string | null = null;
    await renderSpotReportPdfForSlug(
      store({
        async sessionPhotoState(sessionId) {
          askedFor = sessionId;
          return { urls: [], purged: true };
        },
      }),
      's-live',
    );
    expect(askedFor).toBe('sess-1');
  });

  it('still renders when the photo lookup fails', async () => {
    // A buyer who paid should get their findings even if the photo join
    // errors. The photographs are supporting evidence; the report is the
    // thing they bought.
    const buf = await renderSpotReportPdfForSlug(
      store({
        async sessionPhotoState() {
          throw new Error('blob store unavailable');
        },
      }),
      's-live',
    );
    expect(buf).not.toBeNull();
    expect(isPdf(buf!)).toBe(true);
  });
});

describe('the PDF and the page cannot disagree about structure', () => {
  const code = readCode(resolve(root, 'src/engine/spot/reportPdf.ts'));

  it('composes from the shared layout seam', () => {
    expect(code).toContain('groupFindings');
    expect(code).toContain('summaryLine');
  });

  it('does not re-implement the split', () => {
    // Two definitions of "which findings did the photo settle" is how the
    // PDF ends up grouping differently from the page it came from.
    expect(code).not.toMatch(/\.filter\(\s*\(?\s*\w+\s*\)?\s*=>\s*\w+\.hedged/);
  });
});
