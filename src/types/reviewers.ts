/**
 * The fixed set of people who review photo analyses. The public review page
 * (/review) self-identifies by tapping one of these names — there is no
 * login. Both the page and the public API validate against this list so a
 * stray or spoofed name can't write junk attribution into the labeling loop.
 *
 * Admin (Clerk) reviews attribute by the capitalized local part of the
 * signed-in email (see api/_reviewerName.ts), which is expected to match a
 * name here (e.g. ryan@ -> 'Ryan').
 */
export const PHOTO_REVIEWERS = ['Peter', 'Gina', 'Ryan'] as const;

export type PhotoReviewer = (typeof PHOTO_REVIEWERS)[number];

export function isPhotoReviewer(value: unknown): value is PhotoReviewer {
  return (
    typeof value === 'string' &&
    (PHOTO_REVIEWERS as readonly string[]).includes(value)
  );
}
