/**
 * Conversation transcript PDF renderer.
 *
 * Step 24, Commit 3. Produces a firm-facing transcript PDF from a
 * session's conversation history + package metadata. Uploaded to
 * Vercel Blob at an unguessable path and returned as a URL attached
 * to the AttorneyPackage before the firm email fires.
 *
 * Design:
 *
 *   1. Rendering. @react-pdf/renderer is the library. It accepts
 *      React elements that compose PDF-native primitives (Document,
 *      Page, Text, View) and produces a Buffer. Server-side only —
 *      never run in the browser bundle.
 *
 *   2. Upload. The rendered Buffer goes to Vercel Blob with a
 *      per-session unguessable key:
 *        transcripts/<sessionId>-<hex-slug>.pdf
 *      The hex slug gives 128 bits of unguessable randomness, which
 *      is overkill for URL-obscurity but cheap to produce.
 *
 *   3. URL lifetime. The current BlobClient writes public blobs (no
 *      native signed URLs in the Vercel adapter yet). That means the
 *      URL is reachable by anyone who has it. For the pilot this is
 *      acceptable because:
 *        - The URL is only ever sent to the verified firm email.
 *        - The path is unguessable (2^128 search space).
 *        - A nightly job will delete transcripts > 30 days old to
 *          enforce the 30-day-lifetime contract.
 *      When we move off pilot, replace this with a proper
 *      access:'private' + getSignedUrl flow. TODO in the adapter.
 *
 *   4. Interface. renderAndUploadTranscript takes the session state,
 *      the AttorneyPackage, and a BlobClient. Returns a url string.
 *      Pure with respect to the AttorneyPackage — it does not mutate
 *      the input package; the caller (finalize_intake) sets
 *      conversationTranscriptUrl after the upload succeeds.
 *
 * Ref: Step 24, Commit 3.
 */

import React from 'react';
import { randomBytes } from 'node:crypto';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';

import type { AttorneyPackage } from './attorneyPackage.js';
import type { AdaSessionState } from '../types.js';
import type { BlobClient } from '../clients/types.js';

// ─── Styles ──────────────────────────────────────────────────────────────────
// Keep the sheet small. @react-pdf is a tiny CSS subset; style hints
// that work in browsers (e.g., display: flex — wait, that's actually
// required here) don't all translate.

const s = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#222',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  labelCell: {
    width: 110,
    color: '#666',
  },
  valueCell: {
    flex: 1,
  },
  messageBlock: {
    marginBottom: 10,
    padding: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  messageRole: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#666',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 8,
    color: '#999',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
});

// ─── Document composition ────────────────────────────────────────────────────

export interface TranscriptInput {
  state: AdaSessionState;
  pkg: AttorneyPackage;
}

export function buildTranscriptDocument(
  input: TranscriptInput,
): React.ReactElement<React.ComponentProps<typeof Document>> {
  const { state, pkg } = input;

  const metaRows: Array<[string, string]> = [
    ['Case', pkg.listing.title],
    ['Firm', pkg.listing.firmName],
    ['Session', pkg.sessionId],
    ['Outcome', pkg.qualified ? 'Qualified' : 'Not qualified'],
  ];
  if (!pkg.qualified && pkg.disqualifyingReason) {
    metaRows.push(['Reason', pkg.disqualifyingReason]);
  }
  if (pkg.classification) {
    metaRows.push(['Classification', `${pkg.classification.title} (tier ${pkg.classification.tier})`]);
  }
  metaRows.push(['Generated', pkg.generatedAt]);

  // Flatten message content — conversation history can contain text
  // or tool-use blocks, we only render text for the transcript.
  const messages = state.conversationHistory
    .map((m) => ({
      role: m.role,
      text: flattenMessageText(m.content),
    }))
    .filter((m) => m.text.trim() !== '');

  return React.createElement(
    Document,
    {},
    React.createElement(
      Page,
      { size: 'LETTER', style: s.page },
      React.createElement(
        View,
        { style: s.header },
        React.createElement(Text, { style: s.title }, 'Intake transcript'),
        React.createElement(
          Text,
          { style: s.subtitle },
          'ADA Legal Link — generated by Ada',
        ),
      ),

      // Metadata table
      React.createElement(
        View,
        { style: s.section },
        React.createElement(Text, { style: s.sectionHeader }, 'Details'),
        ...metaRows.map(([k, v]) =>
          React.createElement(
            View,
            { style: s.row, key: k },
            React.createElement(Text, { style: s.labelCell }, k),
            React.createElement(Text, { style: s.valueCell }, v),
          ),
        ),
      ),

      // Conversation
      React.createElement(
        View,
        { style: s.section },
        React.createElement(Text, { style: s.sectionHeader }, 'Conversation'),
        ...(messages.length === 0
          ? [React.createElement(Text, { key: 'empty', style: { color: '#999' } }, '(no messages recorded)')]
          : messages.map((m, i) =>
              React.createElement(
                View,
                { style: s.messageBlock, key: String(i) },
                React.createElement(Text, { style: s.messageRole }, m.role),
                React.createElement(Text, { style: s.messageText }, m.text),
              ),
            )),
      ),

      React.createElement(
        Text,
        { style: s.footer, fixed: true },
        `Session ${pkg.sessionId} · Confidential — firm-only`,
      ),
    ),
  );
}

// ─── Render + upload ─────────────────────────────────────────────────────────

/**
 * Render the transcript to a PDF buffer and upload to Blob. Returns
 * the public URL. Caller (finalize_intake) writes this to the
 * AttorneyPackage.conversationTranscriptUrl before sending the firm
 * email.
 *
 * The upload key uses a per-session UUID prefix plus 128 bits of
 * random hex so URLs are unguessable without being stored in a lookup
 * table. 30-day deletion is enforced by a nightly cleanup (separate
 * job, not this module).
 */
export async function renderAndUploadTranscript(
  input: TranscriptInput,
  blob: BlobClient,
): Promise<string> {
  const doc = buildTranscriptDocument(input);
  const buffer = await renderToBuffer(doc);

  const slug = randomBytes(16).toString('hex'); // 128 bits
  const key = `transcripts/${input.pkg.sessionId}-${slug}.pdf`;

  const result = await blob.upload({
    key,
    contentType: 'application/pdf',
    body: new Uint8Array(buffer),
  });
  return result.url;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Message content can be a string or an array of content blocks
 * (text / tool_use / tool_result). For the transcript we only want
 * the user-visible text; tool plumbing is an implementation detail
 * firms shouldn't see.
 */
function flattenMessageText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  const parts: string[] = [];
  for (const block of content) {
    if (block && typeof block === 'object' && 'type' in block) {
      const b = block as { type: string; text?: string };
      if (b.type === 'text' && typeof b.text === 'string') {
        parts.push(b.text);
      }
    }
  }
  return parts.join('\n\n');
}
