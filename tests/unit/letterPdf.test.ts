/**
 * Tests for the demand-letter PDF module (/plan ADALL #2, Phase 1).
 *
 * Mirrors transcriptPdf.test.ts: we don't byte-compare the PDF (brittle
 * across @react-pdf bumps). We assert it renders a non-empty PDF (the
 * %PDF magic number) and that the slug -> PDF core honors the
 * not-found / malformed / no-letter paths against the in-memory client.
 * The thin HTTP wrapper (api/packages/[slug]/letter.pdf.ts) just maps
 * a null return to 404; the load+render logic lives here and is tested
 * directly, same pattern as resolveAttorneyContext.
 *
 * Ref: /plan ADALL #2, Phase 1.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { buildLetterPdf, renderLetterPdfForSlug } from '@/engine/package/letterPdf';

const SAMPLE_LETTER = [
  '[Your name]',
  '[Your address]',
  '',
  'October 1, 2026',
  '',
  "Joe's Diner",
  '[Business street address]',
  '[City], [State] [ZIP]',
  '',
  'To whom it may concern,',
  '',
  'Recently, I visited your restaurant. I am writing to let you know about',
  'an accessibility barrier I experienced and to ask that it be addressed.',
  '',
  'Sincerely,',
  '[Your printed name]',
].join('\n');

const SESSION = '00000000-0000-4000-8000-000000000abc';
const SLUG = 's-abcdefghjkmn';

function isPdf(bytes: Uint8Array): boolean {
  return (
    bytes.length > 500 &&
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 // F
  );
}

describe('buildLetterPdf', () => {
  it('renders a non-empty PDF (starts with %PDF)', async () => {
    const buf = await buildLetterPdf(SAMPLE_LETTER);
    expect(buf).toBeInstanceOf(Buffer);
    expect(isPdf(new Uint8Array(buf))).toBe(true);
  });

  it('renders a single-line letter without throwing', async () => {
    const buf = await buildLetterPdf('A short note.');
    expect(isPdf(new Uint8Array(buf))).toBe(true);
  });
});

describe('renderLetterPdfForSlug', () => {
  async function seed(
    db: ReturnType<typeof makeInMemoryClients>['db'],
    slug: string,
    demandLetter: unknown,
    classificationTitle: string | null,
  ) {
    await db.writeSessionPackage({
      slug,
      sessionId: SESSION,
      payload: { slug, demandLetter },
      classificationTitle,
      generatedAt: '2026-04-22T12:00:00.000Z',
      expiresAt: null,
    });
  }

  it('renders the letter for a seeded package', async () => {
    const clients = makeInMemoryClients();
    await seed(clients.db, SLUG, SAMPLE_LETTER, 'III');
    const buf = await renderLetterPdfForSlug(clients.db, SLUG);
    expect(buf).not.toBeNull();
    expect(isPdf(new Uint8Array(buf!))).toBe(true);
  });

  it('accepts case-insensitive slugs', async () => {
    const clients = makeInMemoryClients();
    await seed(clients.db, SLUG, SAMPLE_LETTER, 'III');
    const buf = await renderLetterPdfForSlug(clients.db, SLUG.toUpperCase());
    expect(buf).not.toBeNull();
  });

  it('returns null for a valid-but-unknown slug', async () => {
    const clients = makeInMemoryClients();
    expect(await renderLetterPdfForSlug(clients.db, 's-23456789abcd')).toBeNull();
  });

  it('returns null for a malformed slug', async () => {
    const clients = makeInMemoryClients();
    expect(await renderLetterPdfForSlug(clients.db, 'not a slug!!')).toBeNull();
  });

  it('returns null when the package has no demand letter', async () => {
    const clients = makeInMemoryClients();
    await seed(clients.db, 's-abcdef234567', null, 'I');
    expect(await renderLetterPdfForSlug(clients.db, 's-abcdef234567')).toBeNull();
  });
});
