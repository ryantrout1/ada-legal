/**
 * Demand letter template generator.
 *
 * A demand letter is a formal letter the user sends to a business
 * asking them to remedy an ADA accessibility problem. Under Title III,
 * most small- and mid-severity cases resolve through a demand letter
 * without any attorney involvement — the business refunds, fixes the
 * barrier, or changes policy when they receive a serious letter with
 * specific regulations cited.
 *
 * This is genuine leverage for people who cannot afford a lawyer for
 * a \$200 hotel issue or a \$40 restaurant refund. The demand letter
 * is the leverage.
 *
 * LINE IN THE SAND:
 *
 *   Ada does NOT send this letter. The user sends it, from their own
 *   email or by mail, under their own signature. Ada does NOT advise
 *   on whether to send it. Ada does NOT argue for specific damages.
 *   Ada provides a template; the user decides whether to use it and
 *   what to change.
 *
 *   This separation is what keeps the platform on the right side of
 *   unauthorized practice of law. We provide a tool; we do not
 *   practice law.
 *
 * WHAT THE LETTER INCLUDES:
 *
 *   - The user's own name and contact info (empty placeholders —
 *     the user fills in before sending)
 *   - The business's name and address (from extracted facts)
 *   - A factual description in the user's own voice (user's
 *     narrative, preserved)
 *   - A citation to the specific regulation Ada identified
 *   - A specific request (fix the barrier / refund / policy
 *     change) based on the violation subtype
 *   - A response deadline (30 days, a common norm)
 *   - Next-step language that preserves the user's options without
 *     threatening specific legal action
 *
 * WHAT THE LETTER DELIBERATELY DOES NOT INCLUDE:
 *
 *   - Named damages or dollar figures. If the user wants to demand
 *     a specific refund, they type it in. Ada does not generate
 *     a dollar demand.
 *   - A threat of lawsuit. The letter says "I reserve my rights
 *     under the ADA" — not "I will sue you."
 *   - Language claiming the business broke the law. It says "I
 *     believe this violates [citation]" — the user's perspective,
 *     not a legal conclusion.
 *   - A law firm's letterhead. This is the user's letter.
 *
 * Ref: Step 18 plan, Commit 3.
 */

import type { Classification, ExtractedFields } from '../../types/db.js';

export interface DemandLetterInput {
  facts: ExtractedFields;
  classification: Classification;
  userNarrative: string | null;
  /**
   * ISO date string to use as "today" in the letter. Injected rather
   * than read from the clock so generation is deterministic and
   * testable.
   */
  generatedOn: string;
}

/**
 * Build the demand letter as plain text. The rendering layer
 * (Commit 4) handles formatting for display and for PDF.
 *
 * Returns null if the inputs don't support a letter (e.g. no
 * business name extracted). The package page handles the null case
 * by showing "we couldn't build a letter automatically — here are
 * the pieces to include yourself" guidance.
 */
export function buildDemandLetter(input: DemandLetterInput): string | null {
  const { facts, classification, userNarrative, generatedOn } = input;

  const business = fieldString(facts, 'business_name');
  if (!business) {
    // Without a business name, we can't address a letter. Return
    // null; the package page will show the user what to fill in.
    return null;
  }

  const businessType = fieldString(facts, 'business_type');
  const city = fieldString(facts, 'location_city');
  const state = fieldString(facts, 'location_state');
  const incidentDate = fieldString(facts, 'incident_date');
  const subtype = fieldString(facts, 'violation_subtype');

  const dateLine = formatHumanDate(generatedOn);
  const businessAddressBlock = buildBusinessAddressBlock(business, city, state);
  const incidentPhrase = incidentDate
    ? `On ${incidentDate}, I visited your ${businessType?.toLowerCase() ?? 'business'}`
    : `Recently, I visited your ${businessType?.toLowerCase() ?? 'business'}`;

  const narrativeBlock = userNarrative
    ? trimTo(userNarrative, 1000)
    : 'I experienced a barrier related to your business\u2019s accessibility. Details are documented in my records.';

  const specificRequest = requestForSubtype(subtype);

  const citation = classification.standard && classification.standard !== 'n/a'
    ? classification.standard
    : '28 CFR Part 36 (ADA Title III regulations)';

  return [
    `[Your name]`,
    `[Your address]`,
    `[Your city, state, ZIP]`,
    `[Your email]`,
    `[Your phone, optional]`,
    ``,
    dateLine,
    ``,
    businessAddressBlock,
    ``,
    `Re: Request to address an accessibility barrier`,
    ``,
    `To whom it may concern,`,
    ``,
    `${incidentPhrase}${city && state ? ` in ${city}, ${state}` : ''}. I am writing to let you know about an accessibility barrier I experienced and to ask that it be addressed.`,
    ``,
    `What happened, in my own words:`,
    ``,
    narrativeBlock,
    ``,
    `I believe this experience involves requirements under ${citation}. I am sharing this with you before considering other steps because many businesses want to address accessibility issues directly when they are raised.`,
    ``,
    specificRequest,
    ``,
    `Please let me know in writing, within 30 days of the date on this letter, how you plan to address this. You can respond to me at the contact information above.`,
    ``,
    `I reserve all of my rights under the Americans with Disabilities Act and any applicable state accessibility laws.`,
    ``,
    `Thank you for your attention to this matter.`,
    ``,
    `Sincerely,`,
    ``,
    `[Your signature, if sending by mail]`,
    `[Your printed name]`,
  ].join('\n');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fieldString(facts: ExtractedFields, key: string): string | null {
  const f = facts[key];
  if (!f || typeof f.value !== 'string') return null;
  const trimmed = f.value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatHumanDate(iso: string): string {
  // Convert YYYY-MM-DD to "Month D, YYYY". Accepts full ISO too.
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

function buildBusinessAddressBlock(
  business: string,
  city: string | null,
  state: string | null,
): string {
  const lines = [business, `[Business street address]`];
  if (city && state) {
    lines.push(`${city}, ${state} [ZIP]`);
  } else if (state) {
    lines.push(`[City], ${state} [ZIP]`);
  } else if (city) {
    lines.push(`${city}, [State] [ZIP]`);
  } else {
    lines.push(`[City, State, ZIP]`);
  }
  return lines.join('\n');
}

function requestForSubtype(subtype: string | null): string {
  // Keep the ask generic and non-prescriptive. The user can edit
  // before sending. We never name a dollar figure here.
  switch ((subtype ?? '').toLowerCase()) {
    case 'path of travel':
    case 'parking':
    case 'entrance/exit':
    case 'restroom':
      return (
        'I am asking that you address the physical accessibility issue I encountered, ' +
        'and confirm in writing what steps you will take and by when. If you need more ' +
        'details from me, I am happy to provide them.'
      );
    case 'service animal denial':
      return (
        'I am asking that you review your policies so that service animals are accommodated ' +
        'at your business as required under the ADA, and that staff be informed of the ' +
        'correct approach. I would appreciate a written response confirming the steps you ' +
        'plan to take.'
      );
    case 'website/app':
      return (
        'I am asking that you identify and fix the accessibility barriers in your ' +
        'website or app so that people using assistive technology can use it. I would ' +
        'appreciate a written response confirming the steps you plan to take.'
      );
    default:
      return (
        'I am asking that you address the accessibility issue I encountered, and ' +
        'confirm in writing what steps you will take and by when. If you need more ' +
        'details from me, I am happy to provide them.'
      );
  }
}

function trimTo(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > maxChars - 50 ? cut.slice(0, lastSpace) : cut) + '\u2026';
}
