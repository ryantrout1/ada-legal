/**
 * Chunking strategy for ADA regulatory text.
 *
 * ADA regulations have natural structure: Part → Subpart → Section →
 * Subsection → Paragraph. The citation unit that matters in practice
 * is the LEAF paragraph — people cite "§36.302(c)(1)" not "§36". So
 * the chunking strategy is: one chunk per leaf paragraph, with the
 * parent section context folded into the chunk so semantic search
 * still finds the right material even when the leaf itself is short.
 *
 * Chunk shape:
 *   {
 *     title:           "§36.302(c)(1) — Service animals",
 *     content:         "Generally, a public accommodation shall modify...",
 *     standard_refs:   ["36.302(c)(1)", "Title III"],
 *     topic:           "service_animals",
 *     source:          "28 CFR §36 (2016 revision)",
 *   }
 *
 * The title gets concatenated with the content at embed time so the
 * section number participates in semantic similarity. Keyword exact
 * match on standard_refs is layered on top at retrieval time as a
 * deterministic fallback (the "§4.13" scenario).
 *
 * Ref: docs/ARCHITECTURE.md §10.5
 */

export interface RawSection {
  /** Citation as users write it, e.g. "36.302(c)(1)" */
  citation: string;
  /** Human-readable title, e.g. "Service animals" */
  title: string;
  /** Body text of this leaf paragraph */
  text: string;
  /** Parent breadcrumb, e.g. ["Part 36", "Subpart C — Specific Requirements", "§36.302 Modifications in policies, practices, or procedures"] */
  breadcrumb: string[];
  /** Topic tag for filtering. One of a fixed set (see TOPICS). */
  topic: Topic;
  /** Which regulatory source this comes from. */
  source: string;
}

export const TOPICS = [
  'general',
  'public_accommodations',
  'service_animals',
  'mobility_devices',
  'effective_communication',
  'barrier_removal',
  'new_construction',
  'examinations_and_courses',
  'policies_practices_procedures',
  'auxiliary_aids',
  'transportation',
  'parking',
  'signage',
  'web_accessibility',
  'employment',
  'state_local_government',
  // Technical-requirement topics added in Step 10.6 for the 2010
  // Standards corpus. These are finer-grained than the Part 36 topics
  // above because the Standards are organized by building element.
  'accessible_routes',
  'building_blocks',
  'reach_ranges',
  'operable_parts',
  'doors',
  'ramps',
  'elevators',
  'stairways',
  'handrails',
  'drinking_fountains',
  'restrooms',
  'signs',
] as const;
export type Topic = (typeof TOPICS)[number];

export interface PreparedChunk {
  title: string;
  content: string;
  embeddingInput: string;
  standardRefs: string[];
  topic: Topic;
  source: string;
}

/**
 * Convert a RawSection into the shape we store + embed.
 *
 * The embedding input concatenates breadcrumb + title + body so
 * semantic search can match a query to the right section even when
 * the leaf text itself is terse (e.g., "(i) See paragraph (c).").
 */
export function prepareChunk(section: RawSection): PreparedChunk {
  const title = `§${section.citation} — ${section.title}`;
  const content = section.text.trim();

  const breadcrumbLine = section.breadcrumb.join(' › ');
  const embeddingInput = [breadcrumbLine, title, content]
    .filter(Boolean)
    .join('\n\n');

  return {
    title,
    content,
    embeddingInput,
    standardRefs: [section.citation, ...parentRefs(section.citation)],
    topic: section.topic,
    source: section.source,
  };
}

/**
 * Given a leaf citation, return the progressively broader parent
 * citations. Supports two formats:
 *
 *   CFR with parens:   "36.302(c)(1)" → ["36.302(c)", "36.302", "36"]
 *   Standards decimal: "404.2.3"      → ["404.2", "404"]
 *
 * This lets a user who writes "what does §36.302 say" or "§404.2
 * requirements" hit the exact subsection plus every leaf under it.
 */
function parentRefs(leaf: string): string[] {
  const out: string[] = [];
  let current = leaf;

  // Strip trailing parenthesized groups one at a time (CFR style).
  while (/\([^)]+\)$/.test(current)) {
    current = current.replace(/\([^)]+\)$/, '');
    if (current) out.push(current);
  }

  // Strip trailing dotted-decimal segments one at a time (Standards style).
  // e.g., 404.2.3 → 404.2 → 404
  while (/\.\d+$/.test(current) && current.includes('.')) {
    current = current.replace(/\.\d+$/, '');
    if (current && !out.includes(current)) out.push(current);
  }

  return out;
}
