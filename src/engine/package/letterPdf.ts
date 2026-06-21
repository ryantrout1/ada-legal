/**
 * Demand-letter PDF renderer.
 *
 * Phase 1 (/plan ADALL #2). Renders the user's demand letter — the
 * plain-text body produced by package/demandLetter.ts — into a clean,
 * printable PDF the user can download from their session package page
 * (/s/[slug]).
 *
 * Design mirrors handoff/transcriptPdf.ts: @react-pdf/renderer composes
 * PDF-native primitives into a Buffer, server-side only. Unlike the
 * transcript PDF, this is NOT uploaded to Blob — it is streamed on
 * demand by api/packages/[slug]/letter.pdf.ts so the user's letter
 * (which contains their own narrative) never sits at a public URL.
 *
 * The body is rendered verbatim, line for line, preserving the
 * blank-line spacing and the [bracketed] placeholders the user fills in
 * before sending. We do not reformat or "improve" the letter here — it
 * is the user's letter; the PDF is just a printable rendering of it.
 *
 * Ref: /plan ADALL #2, Phase 1.
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import type { DbClient } from '../clients/types.js';
import { isValidPackageSlug } from './slug.js';

const s = StyleSheet.create({
  page: {
    paddingVertical: 64,
    paddingHorizontal: 64,
    fontFamily: 'Times-Roman',
    fontSize: 11,
    lineHeight: 1.5,
    color: '#1a1a1a',
  },
  // A non-breaking space keeps blank source lines from collapsing, so
  // the letter's paragraph spacing survives in the PDF.
  line: {
    minHeight: 11,
  },
});

/**
 * Build the demand-letter PDF as a Buffer. Renders each source line as
 * its own <Text> so the letter's blank-line spacing is preserved.
 */
export async function buildLetterPdf(letterText: string): Promise<Buffer> {
  const lines = letterText.split('\n');
  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'LETTER', style: s.page },
      ...lines.map((line, i) =>
        React.createElement(
          Text,
          { key: i, style: s.line },
          line.length > 0 ? line : '\u00A0',
        ),
      ),
    ),
  );
  return renderToBuffer(doc);
}

/**
 * Load a session package by slug and render its demand letter to a PDF
 * Buffer. Returns null when there is no package for the slug (unknown,
 * expired, or malformed) or the package has no demand letter (e.g. a
 * non-Title-III classification, which doesn't get a letter). The HTTP
 * wrapper maps null -> 404.
 */
export async function renderLetterPdfForSlug(
  db: DbClient,
  slug: string,
): Promise<Buffer | null> {
  if (!isValidPackageSlug(slug)) return null;
  const row = await db.readSessionPackageBySlug(slug.toLowerCase());
  if (!row) return null;
  const payload = row.payload as { demandLetter?: unknown } | null;
  const letter = payload?.demandLetter;
  if (typeof letter !== 'string' || letter.trim().length === 0) return null;
  return buildLetterPdf(letter);
}
