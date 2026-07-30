/**
 * Ada Spot — the report as a downloadable PDF.
 *
 * The buyer's copy to keep, forward, or hand to a contractor. Rendered on
 * demand and never stored, so a paid report does not sit at a public URL —
 * same posture as package/letterPdf.ts, which this mirrors, and the same
 * @react-pdf/renderer → Buffer shape as handoff/transcriptPdf.ts.
 *
 * WHY IT COMPOSES FROM reportLayout. This is the second rendering of one
 * document, and two renderings drifting apart is not hypothetical here — it
 * is what put two of this repo's transactional emails below the AAA contrast
 * floor independently, each looking fine in isolation. So the question the
 * report is organised around — did the photograph settle this finding, or
 * does someone have to go and measure — is answered in exactly one place,
 * reportLayout.ts, and both the screen and this file read the answer. The
 * styling is written twice and that part is accepted; the structure is not.
 *
 * WHAT THIS PDF IS NOT. @react-pdf/renderer does not emit tagged PDF. The
 * text is real text — selectable, searchable, readable by a screen reader —
 * but it carries no heading structure or reading order. The HTML report is
 * the accessible artifact and this is the portable one. That ordering is
 * deliberate, and on a product for disabled people it should stay deliberate:
 * if this ever becomes the primary way people read their report, it needs to
 * be a tagged renderer instead.
 *
 * COLOUR. Named constants rather than tokens — a PDF has no display mode and
 * no stylesheet to inherit from. Values are the light-mode token values so
 * the document matches the page it came from. Same exemption, and same
 * reasoning, as engine/email/emailStyles.ts.
 *
 * Ref: /plan Download the Spot report as a PDF, phase 1.
 */

import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import type { SpotReportContent, SpotReportItem } from '../../lib/spot/reportSchema.js';
import { groupFindings, stripEntries, summaryLine } from '../../lib/spot/reportLayout.js';

/* Light-mode token values. See the header note on why these are literals. */
const INK = '#1E293B';
const BODY = '#3D4A5C';
const META = '#454F5E';
const ACCENT = '#8E2F09';
const LINE = '#E2E8F0';
const LIFT = '#F1F5F9';
const TINT = '#FEF1EC';

const s = StyleSheet.create({
  page: {
    paddingVertical: 48,
    paddingHorizontal: 54,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
    color: BODY,
  },
  eyebrow: { fontSize: 7.5, letterSpacing: 1.2, color: META, fontFamily: 'Helvetica-Bold' },
  headline: { fontSize: 19, color: INK, fontFamily: 'Helvetica-Bold', marginTop: 8, lineHeight: 1.2 },
  summary: { fontSize: 12, color: META, marginTop: 6 },
  overview: { fontSize: 11, color: INK, marginTop: 14 },
  photo: { width: '100%', marginTop: 14, borderRadius: 4 },
  photoNote: { fontSize: 7.5, color: META, marginTop: 5 },

  strip: { flexDirection: 'row', marginTop: 16, borderWidth: 1, borderColor: LINE, borderRadius: 4 },
  stripCell: { flexGrow: 1, flexBasis: 0, padding: 9, borderLeftWidth: 1, borderLeftColor: LINE },
  stripFirst: { borderLeftWidth: 0 },
  stripValue: { fontSize: 12, color: ACCENT, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  stripLabel: { fontSize: 7, color: META, marginTop: 4, textAlign: 'center' },

  groupHeading: {
    fontSize: 8,
    letterSpacing: 1.2,
    color: META,
    fontFamily: 'Helvetica-Bold',
    marginTop: 22,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },

  card: { marginTop: 11, borderWidth: 1, borderColor: LINE, borderRadius: 4 },
  cardBody: { padding: 12 },
  chip: { fontSize: 7, letterSpacing: 0.8, color: ACCENT, fontFamily: 'Helvetica-Bold' },
  title: { fontSize: 12, color: INK, fontFamily: 'Helvetica-Bold', marginTop: 5 },
  concern: { marginTop: 6 },

  target: { marginTop: 9, padding: 8, backgroundColor: TINT, borderRadius: 3 },
  targetWhat: { fontSize: 7, letterSpacing: 0.8, color: ACCENT, fontFamily: 'Helvetica-Bold' },
  targetValue: { fontSize: 16, color: INK, fontFamily: 'Helvetica-Bold', marginTop: 3 },
  targetLabel: { fontSize: 7.5, color: META, marginTop: 3 },

  how: { padding: 12, backgroundColor: LIFT, borderTopWidth: 1, borderTopColor: LINE },
  howKey: { fontSize: 7, letterSpacing: 0.8, color: ACCENT, fontFamily: 'Helvetica-Bold' },
  hedge: { fontSize: 8.5, color: META, marginTop: 7 },

  rule: { padding: 12, borderTopWidth: 1, borderTopColor: LINE },
  ruleKey: { fontSize: 7, letterSpacing: 0.8, color: META, fontFamily: 'Helvetica-Bold' },
  ruleBody: { fontSize: 8.5, color: BODY, marginTop: 4 },
  cite: { fontSize: 8, color: META, marginTop: 6 },

  disclaimer: { fontSize: 7.5, color: META, marginTop: 24, paddingTop: 10, borderTopWidth: 1, borderTopColor: LINE },
});

const el = React.createElement;

/**
 * `Text` is overloaded — @react-pdf exports one for documents and one for
 * SVG, and passing a widened style type through a helper makes TypeScript
 * pick the SVG one. letterPdf.ts sidesteps this by inlining concrete style
 * objects at every call. This aliases the document variant once instead, so
 * the helper below stays readable.
 */
type PdfStyle = Record<string, unknown> | Array<Record<string, unknown>>;
const TextNode = Text as unknown as React.ComponentType<{
  style?: PdfStyle;
  children?: React.ReactNode;
}>;
const txt = (style: PdfStyle, value: string) => el(TextNode, { style }, value);

function finding(item: SpotReportItem, key: number) {
  const parts: React.ReactNode[] = [
    el(
      View,
      { key: 'b', style: s.cardBody },
      txt(s.chip, item.severityLabel.toUpperCase()),
      txt(s.title, item.title),
      txt(s.concern, item.concern),
      item.target
        ? el(
            View,
            { key: 't', style: s.target },
            txt(s.targetWhat, 'TARGET'),
            txt(s.targetValue, item.target.value),
            txt(s.targetLabel, item.target.label),
          )
        : null,
    ),
    el(
      View,
      { key: 'h', style: s.how },
      txt(s.howKey, 'HOW TO ADDRESS IT'),
      txt({ marginTop: 4 }, item.remediation),
      item.hedged && item.hedgeNote ? txt(s.hedge, item.hedgeNote) : null,
    ),
  ];

  // The rule explanation is collapsed on screen because it repeats under
  // every finding citing the same section. On paper there is nothing to
  // expand, so it is printed — the same reason app.css opens the <details>
  // when printing.
  if (item.ruleExplanation || item.citedSection) {
    parts.push(
      el(
        View,
        { key: 'r', style: s.rule },
        item.ruleExplanation
          ? el(
              React.Fragment,
              { key: 'e' },
              txt(
                s.ruleKey,
                `WHAT THIS RULE MEANS${item.ruleTitle ? ` — ${item.ruleTitle.toUpperCase()}` : ''}`,
              ),
              txt(s.ruleBody, item.ruleExplanation),
            )
          : null,
        item.citedSection ? txt(s.cite, `Related standard: ${item.citedSection}`) : null,
      ),
    );
  }

  // wrap:false keeps a finding from splitting across a page boundary, the
  // print stylesheet's `break-inside: avoid` in PDF terms.
  return el(View, { key, style: s.card, wrap: false }, ...parts);
}

function group(heading: string, items: SpotReportItem[], key: string) {
  // An empty group prints nothing — not a heading over blank paper.
  if (items.length === 0) return null;
  return el(
    React.Fragment,
    { key },
    txt(s.groupHeading, heading.toUpperCase()),
    ...items.map((item, i) => finding(item, i)),
  );
}

/** Render the report to a PDF Buffer. Photos are optional and may be empty. */
export async function buildSpotReportPdf(
  content: SpotReportContent,
  photos: readonly string[] = [],
): Promise<Buffer> {
  const groups = groupFindings(content.items);
  const summary = summaryLine(groups);
  const targets = stripEntries(content.items);

  const body: React.ReactNode[] = [
    txt(s.eyebrow, 'ACCESSIBILITY SCREENING'),
    txt(s.headline, content.headline),
    summary ? txt(s.summary, summary) : null,
  ];

  if (targets.length > 0) {
    body.push(
      el(
        View,
        { key: 'strip', style: s.strip, wrap: false },
        ...targets.map((t, i) =>
          el(
            View,
            { key: i, style: i === 0 ? [s.stripCell, s.stripFirst] : s.stripCell },
            txt(s.stripValue, t.value),
            txt(s.stripLabel, t.label),
          ),
        ),
      ),
    );
  }

  photos.forEach((url, i) => {
    body.push(el(Image, { key: `p${i}`, src: url, style: s.photo }));
  });
  if (photos.length > 0) {
    body.push(
      txt(s.photoNote, 'Photos are deleted after 90 days; the report stays available.'),
    );
  }

  if (content.overview) body.push(txt(s.overview, content.overview));

  body.push(group('Visible in the photo', groups.confirmed, 'g1'));
  body.push(group('A photo can’t settle these — go measure', groups.unconfirmed, 'g2'));
  body.push(txt(s.disclaimer, content.disclaimer));

  return renderToBuffer(
    el(Document, null, el(Page, { size: 'LETTER', style: s.page }, ...body)),
  );
}

/** The slice of the Spot store this needs. Narrow on purpose — it makes the
 *  module testable with a plain object and keeps the database out of here. */
export interface SpotReportPdfStore {
  getReleasedReportBySlug(slug: string): Promise<{ content: unknown; sessionId: string } | null>;
  sessionPhotoState(sessionId: string): Promise<{ urls: string[]; purged: boolean }>;
}

/**
 * Load a RELEASED report by slug and render it. Null for anything else.
 *
 * getReleasedReportBySlug is the same function the JSON endpoint uses, so a
 * pending or rejected draft is refused here for the same reason it is
 * refused there: a person reads every report before it goes out, and an
 * endpoint that served a draft would walk around that gate. Unknown,
 * malformed and not-yet-approved all return null so the caller cannot tell
 * them apart.
 */
export async function renderSpotReportPdfForSlug(
  store: SpotReportPdfStore,
  slug: string,
): Promise<Buffer | null> {
  if (!slug) return null;
  const report = await store.getReleasedReportBySlug(slug);
  if (!report) return null;

  // Photos are supporting evidence; the findings are what was paid for. A
  // failing photo lookup costs the images, not the report.
  let photos: string[] = [];
  try {
    photos = (await store.sessionPhotoState(report.sessionId)).urls;
  } catch (err) {
    console.error('spot report pdf: photo lookup failed, rendering without', err);
  }

  return buildSpotReportPdf(report.content as SpotReportContent, photos);
}
