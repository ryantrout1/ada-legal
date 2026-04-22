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
   * class_action. Signals the rendering layer to surface the
   * "class-action matching coming soon" note. Phase D Step 26 will
   * populate real class-action details.
   */
  classActionPlaceholder: boolean;

  /**
   * Standing disclaimer. Always present, always the same wording.
   * Surfaced prominently in the rendering layer.
   */
  disclaimer: string;
}
