/**
 * Claimant-facing words for the civil rights complaint page.
 *
 * DRAFT: nothing here is approved until Gina reviews it. When wording
 * changes after launch, bump COPY_VERSION; when a consent sentence
 * changes, bump that consent's `version`. The save endpoint stores the
 * server's copy of the wording for the version the page showed, so the
 * proof of what someone agreed to never depends on what a browser sent.
 */

import type { StateConfig } from './types.js';

export const COPY_VERSION = 'draft-2026-10-19';

export type ConsentKind = 'updates' | 'contact';

export interface ConsentWording {
  kind: ConsentKind;
  version: string;
  wording: string;
}

/** Both optional, unchecked by default, never needed for the PDF. */
export const CONSENTS: readonly ConsentWording[] = [
  {
    kind: 'updates',
    version: '2026-10-19.1',
    wording: 'Send me updates from ADA Legal Link.',
  },
  {
    kind: 'contact',
    version: '2026-10-19.1',
    wording:
      'ADA Legal Link or a partner attorney may contact me about my report. I understand no one is promising to contact me or take my case.',
  },
];

/** Shown on the first and last screens. */
export function disclaimer(config: StateConfig): string {
  return (
    `ADA Legal Link is not the ${config.agencyName}. We do not file this for you ` +
    'and we do not give legal advice. You review it, sign it, and send it yourself.'
  );
}

/**
 * The agency's own deadline wording, as a note. Takes the config only:
 * it never sees the person's dates, so it cannot tell anyone they are late.
 */
export function deadlineNote(config: StateConfig): string {
  const d = config.deadline;
  return `The ${config.agencyName} lists this time limit for ${d.area} complaints: ${d.limit}. ${d.from}.`;
}
