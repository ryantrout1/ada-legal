/**
 * Ada Spot — what the screen says after a buyer pays and finishes uploading.
 *
 * The branching lives here rather than in SpotUpload because this repo has no
 * React render testing (no @testing-library/react, vitest runs on `node`), so
 * anything left inside a component can only be verified by eye. Pulling the
 * decision out means the part that can be wrong is the part that gets tested,
 * and the component keeps only markup.
 *
 * Three states, three different honest things to say:
 *
 *   found    — name the address. Someone who mistyped it can catch that now
 *              instead of after hours of waiting for mail that never arrives.
 *   none     — say there is no address and where to write. Never promise an
 *              email that has nowhere to go.
 *   unknown  — the lookup failed, so we know neither way. Say an email is
 *              coming and name no address. Telling a buyer who typed theirs
 *              correctly that we never got one would be a confident lie
 *              produced by a network timeout.
 *
 * Ref: /plan phase 1 (Spot post-payment waiting screen).
 */

/** Where a buyer writes when we have no address for their purchase. */
export const SPOT_SUPPORT_EMAIL = 'support@adalegallink.com';

/**
 * The no-address sentence, split either side of the address.
 *
 * The screen renders the address as a mailto link, so it cannot print
 * `addressLine` verbatim for that branch — it has to interleave an anchor.
 * Exporting the halves means the component composes the same sentence rather
 * than restating it, so the two cannot drift apart and leave the test passing
 * against prose nobody sees.
 */
export const NO_ADDRESS_BEFORE = 'We don’t have an email address for this purchase. Write to ';
export const NO_ADDRESS_AFTER = ' and we’ll get your report to you.';

/** What the client managed to learn about the buyer's address. */
export type EmailLookup =
  | { state: 'found'; email: string | null }
  | { state: 'none' }
  | { state: 'unknown' };

export interface ConfirmationCopy {
  /**
   * Which of the three states produced this copy. The screen switches on
   * this rather than re-reading the lookup, so the branching lives in exactly
   * one place — here, where it is tested.
   */
  kind: 'found' | 'none' | 'unknown';
  heading: string;
  /** The one line that differs per state. */
  addressLine: string;
  /** Why the wait is hours rather than seconds. Same in every state. */
  reviewLine: string;
  closingLine: string;
  /** True only when an address was found and is renderable. */
  hasEmail: boolean;
}

const HEADING = 'Payment received — photos in';

// A person really does read every report before release — api/spot/admin/release.ts
// is the only path that emails one, and it needs an admin. Saying so turns dead
// air into a reason the wait exists.
const REVIEW_LINE =
  'A person reads every report before it goes out — that’s why this takes hours rather than seconds.';

const CLOSING_LINE = 'You can close this page; nothing here needs you.';

export function buildConfirmationCopy(lookup: EmailLookup): ConfirmationCopy {
  const base = { heading: HEADING, reviewLine: REVIEW_LINE, closingLine: CLOSING_LINE };

  if (lookup.state === 'found') {
    // markPaid stores whatever Stripe resolved, which can be an empty string.
    // An empty string is not an address, and "on its way to " reads as a bug.
    const email = lookup.email?.trim() ?? '';
    if (email) {
      return {
        ...base,
        kind: 'found',
        addressLine: `Your report is on its way to ${email}.`,
        hasEmail: true,
      };
    }
    // Stripe resolved to a blank. We hold no usable address, which is the
    // same thing the buyer needs to hear as an outright missing one.
    return { ...base, kind: 'none', addressLine: noAddressLine(), hasEmail: false };
  }

  if (lookup.state === 'none') {
    return { ...base, kind: 'none', addressLine: noAddressLine(), hasEmail: false };
  }

  return {
    ...base,
    kind: 'unknown',
    addressLine: 'Your report is being prepared and will be emailed to you.',
    hasEmail: false,
  };
}

function noAddressLine(): string {
  return `${NO_ADDRESS_BEFORE}${SPOT_SUPPORT_EMAIL}${NO_ADDRESS_AFTER}`;
}
