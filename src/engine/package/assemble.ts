/**
 * Package assembler.
 *
 * Pure function. Given session state + context, returns a
 * SessionPackage ready for rendering.
 *
 * The assembler is deterministic — same inputs always produce the
 * same package. No AI calls at package time. All the intelligence
 * (classification, extracted facts, retrieved regulations) has
 * already happened during the conversation and is baked into the
 * session state.
 *
 * Ref: Step 18 plan, Commit 3.
 */

import type { AdaSessionState } from '../types.js';
import type { KnowledgeChunkHit } from '../clients/types.js';
import { routeFor } from '../routing/destinations.js';
import { generatePackageSlug } from './slug.js';
import { labelFor } from './labels.js';
import { extractNarrative, buildSummary } from './extract.js';
import { buildDemandLetter } from './demandLetter.js';
import type { SessionPackage, CitedRegulation } from './types.js';

export interface AssemblePackageContext {
  /** The session being packaged. Assumed to be a completed session. */
  state: AdaSessionState;
  /**
   * Knowledge-base chunks retrieved during the session. Optional —
   * when absent, the package has an empty citedRegulations array.
   * In practice the engine can pass the most-recently-retrieved set
   * or an aggregation.
   */
  knowledgeHits?: ReadonlyArray<KnowledgeChunkHit>;
  /**
   * Whether a matched attorney was found during the session (via
   * search_attorneys). Controls whether Title III routes offer the
   * attorney handoff as primary.
   */
  attorneyMatched?: boolean;
  /**
   * Pre-generated slug, if the caller has one (e.g. a second
   * assembly after persistence). When null/undefined, a fresh slug
   * is generated.
   */
  slug?: string;
  /**
   * Generation timestamp as ISO string. Injected for determinism in
   * tests. Defaults to now().
   */
  now?: string;
}

/**
 * Standing disclaimer. Exported so tests and the rendering layer can
 * reference the exact wording.
 *
 * Voice: first person, direct. This disclaimer is what the user reads
 * last on every summary, so it has to sound like Ada, not like legal
 * boilerplate from a third party writing about her. It still covers
 * the same ground — not a lawyer, not legal advice, review before
 * acting, talk to an attorney if possible. See docs/ADA_VOICE_GUIDE.md.
 */
export const PACKAGE_DISCLAIMER =
  'I wrote this summary based on what you told me. I am an AI assistant — not a lawyer, ' +
  'and this is not legal advice. Before you take any formal step — filing a complaint, ' +
  'sending a demand letter, or moving forward with an attorney — read through what I wrote ' +
  'and make sure it reflects what actually happened. If you can talk to a qualified attorney, ' +
  'do that. What I captured here is what came up in our conversation, and a lawyer may want ' +
  'details we did not get to.';

export function assemblePackage(ctx: AssemblePackageContext): SessionPackage {
  const { state } = ctx;
  const classification = state.classification;

  if (!classification) {
    // Guard: the caller should not package an unclassified session.
    // Throwing is appropriate because this is a programmer error,
    // not user input.
    throw new Error(
      'assemblePackage: cannot build a package for an unclassified session ' +
        `(sessionId=${state.sessionId}). Ada must call set_classification first.`,
    );
  }

  const slug = ctx.slug ?? generatePackageSlug();
  const generatedAt = ctx.now ?? new Date().toISOString();
  const userNarrative = extractNarrative(state.conversationHistory);
  const summary = buildSummary(state.extractedFields, classification);
  const classificationLabel = labelFor(classification.title);
  const photos = state.metadata.photos ?? [];
  const citedRegulations = mapKnowledgeToCitations(ctx.knowledgeHits);

  // State code from extracted facts, if present.
  const state2Letter = extractStateCode(state.extractedFields);
  const route = routeFor({
    title: classification.title,
    state: state2Letter,
    attorneyMatched: ctx.attorneyMatched === true,
  });

  // Demand letter only for Title III (and class_action placeholder
  // which routes via Title III). Other classifications do not get a
  // letter — the destination is a formal complaint filing, not a
  // demand on a private business.
  const shouldGenerateLetter =
    classification.title === 'III' || classification.title === 'class_action';
  const demandLetter = shouldGenerateLetter
    ? buildDemandLetter({
        facts: state.extractedFields,
        classification,
        userNarrative,
        generatedOn: generatedAt,
      })
    : null;

  return {
    slug,
    sessionId: state.sessionId,
    generatedAt,
    userNarrative,
    summary,
    classification,
    classificationLabel,
    facts: state.extractedFields,
    photos,
    citedRegulations,
    primaryAction: route.primary,
    alternateActions: route.alternates,
    infoDestinations: route.info,
    demandLetter,
    classActionPlaceholder: classification.title === 'class_action',
    disclaimer: PACKAGE_DISCLAIMER,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Map knowledge-base hits to plain citations for the package.
 * Deduplicates by citation string and caps at 6 entries (the
 * package is for humans, not an index). One hit can contain
 * multiple standardRefs (e.g. a chunk that references both §36.302
 * and §36.303); we emit one citation per unique ref.
 */
function mapKnowledgeToCitations(
  hits: ReadonlyArray<KnowledgeChunkHit> | undefined,
): CitedRegulation[] {
  if (!hits || hits.length === 0) return [];
  const seen = new Set<string>();
  const out: CitedRegulation[] = [];
  for (const hit of hits) {
    // A hit can carry multiple standardRefs. Use the first one as
    // the primary citation. If a second chunk cites the same ref,
    // we skip it (the first chunk's excerpt wins).
    const primaryRef = hit.standardRefs[0];
    if (!primaryRef) continue;
    if (seen.has(primaryRef)) continue;
    seen.add(primaryRef);
    out.push({
      citation: primaryRef,
      excerpt: trimExcerpt(hit.content),
    });
    if (out.length >= 6) break;
  }
  return out;
}

function trimExcerpt(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 300) return cleaned;
  const cut = cleaned.slice(0, 300);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 250 ? cut.slice(0, lastSpace) : cut) + '\u2026';
}

function extractStateCode(facts: Record<string, { value: unknown }>): string | null {
  const f = facts['location_state'];
  if (!f) return null;
  if (typeof f.value !== 'string') return null;
  const v = f.value.trim();
  return v.length > 0 ? v : null;
}
