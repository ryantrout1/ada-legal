/**
 * Session package types.
 *
 * The package is what the user takes away from an Ada conversation.
 * It's rendered as a web page at /s/{slug} (Commit 4) and downloadable
 * as a PDF. The same data structure drives both.
 *
 * Design philosophy:
 *
 *   The package is the user's relationship with what happened to them.
 *   It's addressed to the user first. Its primary job is to say, in
 *   plain language: here's what you told Ada, here's what Ada thinks
 *   this is under the law, and here's what people usually do next.
 *
 *   The user's own words come first, before any translation. Their
 *   narrative is never replaced by a legal-sounding rewrite.
 *
 *   Everything routed here is informational, not directive. The
 *   package describes what destinations exist and what they do. It
 *   does not tell the user what to do. It never predicts outcomes.
 *
 *   The classification labels are plain-language ("Workplace /
 *   Employment", not "Title I"). The technical label appears as
 *   secondary context, not the headline.
 *
 * Ref: Step 18 plan, Commit 3.
 */

import type { Classification, AttachedPhoto, ExtractedFields } from '../../types/db.js';
import type { ActionDestination } from '../routing/destinations.js';

/**
 * A stable, URL-safe identifier for a package. Generated at
 * package-creation time and used in the /s/{slug} URL. Must be:
 *   - Hard to guess (unlisted packages aren't public-browsable)
 *   - URL-safe
 *   - Short enough to share
 */
export type PackageSlug = string;

/**
 * A cited regulation Ada referenced during the conversation.
 * Pulled from the knowledge base (RAG) hits that influenced her
 * answers. In Step 18 we capture them as free text; the package
 * page can link to future /standards anchors when available.
 */
export interface CitedRegulation {
  /** e.g. "28 CFR §36.302" or "§404.2.3" */
  citation: string;
  /** A short, plain-language excerpt or paraphrase (<= 300 chars) */
  excerpt: string;
}

/**
 * Plain-language classification label, user-facing. These are
 * stable strings that drive UI. The `AdaTitle` code value is the
 * source of truth; this is the human label derived from it.
 */
export interface ClassificationLabel {
  /** Short human-readable label, e.g. "Public Accommodation" */
  shortLabel: string;
  /** One-line plain description, e.g. "A private business serving the public" */
  plainDescription: string;
  /** The technical ADA title reference, e.g. "Title III" */
  technicalLabel: string;
}

/**
 * When the session was bound to a specific class-action listing
 * (via match_listing during the conversation), the package surfaces
 * that match prominently. The user is connected to a real, named firm
 * — not just told "matching is coming soon."
 *
 * Null when the session was classified as class_action but did NOT bind
 * to a listing (no active listing fit the facts, or the user declined
 * to pursue a specific case). In that case the rendering layer falls
 * back to the generic class-action placeholder.
 */
export interface MatchedListing {
  /** The listing's slug for /class-actions/{slug} link-back. */
  listingSlug: string;
  /** Listing title, e.g. "Rideshare wheelchair and service animal denials". */
  listingTitle: string;
  /** Listing category, e.g. "ada_title_iii". Drives the chip color. */
  listingCategory: string;
  /** Hosting law firm display name. */
  firmName: string;
  /** Primary contact name at the firm, if set on the firm row. */
  firmPrimaryContact: string | null;
  /** Firm email, if set. */
  firmEmail: string | null;
  /** Firm phone, if set. */
  firmPhone: string | null;
}

/**
 * The package payload. Self-contained — anything the rendering layer
 * needs is in this object.
 */
export interface SessionPackage {
  /** Package identity. */
  slug: PackageSlug;
  sessionId: string;
  generatedAt: string; // ISO8601

  /**
   * The user's narrative in their own words. Extracted from the
   * first substantive user message (or concatenation of the first
   * few). NOT summarized by Ada. NOT translated into legalese. This
   * is the user's voice, preserved.
   *
   * Null when the session didn't produce a meaningful narrative
   * (very short sessions, abandoned intake). The package page
   * handles this gracefully.
   */
  userNarrative: string | null;

  /**
   * A plain-language summary written in Ada's voice, 2-4 sentences.
   * Starts with "You told Ada that ..." or similar user-centered
   * framing. Never begins with legal-sounding language. Never
   * predicts outcomes.
   *
   * Built deterministically from extracted fields + classification
   * (no additional AI call required at package time).
   */
  summary: string;

  /** Ada's classification with full reasoning. */
  classification: Classification;

  /** User-friendly labels derived from classification.title. */
  classificationLabel: ClassificationLabel;

  /** Structured facts extracted during the conversation. */
  facts: ExtractedFields;

  /** Photos the user attached. */
  photos: AttachedPhoto[];

  /**
   * Regulations Ada cited. Empty array when no specific citation was
   * made (e.g. out_of_scope).
   */
  citedRegulations: CitedRegulation[];

  /**
   * Routing destinations. Primary is surfaced prominently; alternates
   * are shown as coequal-but-secondary options; info is support
   * (phone lines, centers) that's always available.
   */
  primaryAction: ActionDestination;
  alternateActions: ActionDestination[];
  infoDestinations: ActionDestination[];

  /**
   * Demand letter text, populated only for Title III (and some
   * class_action placeholder routes). Null otherwise. The letter is
   * plain text — the rendering layer is responsible for formatting
   * it as a downloadable document.
   */
  demandLetter: string | null;

  /**
   * Class-action placeholder flag. True when classification is
   * class_action AND no specific listing was bound. Signals the
   * rendering layer to surface the generic "class-action matching
   * coming soon" note. When matchedListing is set, the rendering layer
   * shows the matched listing prominently instead.
   */
  classActionPlaceholder: boolean;

  /**
   * When the session bound to a specific class-action listing during
   * the conversation, the listing + hosting firm are surfaced here.
   * The rendering layer treats this as the primary call to action,
   * demoting DOJ / state-civil-rights filings to "other options."
   *
   * Null when no listing was bound — including most Title III sessions
   * and class_action sessions where Ada flagged but didn't match.
   */
  matchedListing: MatchedListing | null;

  /**
   * Standing disclaimer. Always present, always the same wording.
   * Surfaced prominently in the rendering layer.
   */
  disclaimer: string;
}
