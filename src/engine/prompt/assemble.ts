/**
 * Prompt assembler.
 *
 * Pure function. Given a session context, returns the system prompt text
 * the AI will see for this turn. No I/O, no randomness, no DB lookups —
 * the caller supplies everything. Tests call it with hand-built contexts
 * and assert on the returned string.
 *
 * Six sections in fixed order (per brief §8):
 *   1. Identity     — who Ada is, her goals, Title I/II/III routing rules
 *   2. Org context  — display name + any org-specific instructions
 *   3. Listing      — Ch1 per-listing overlay (null in Ch0)
 *   4. Reading      — detailed style guide for simple / standard / professional
 *   5. Tools        — auto-generated catalog from CH0_TOOLS registry
 *   6. Session ctx  — classification, extracted fields, status
 *
 * Design principles:
 *   - Deterministic for fixed inputs: same inputs → same output. The
 *     `now` field IS one of those inputs — production passes the wall
 *     clock; tests pass a fixed Date for snapshot-stable output.
 *   - Ordered: the six sections always appear in the same order, even
 *     when one is empty. Predictable layout lets us diff prompt output
 *     in tests without noise.
 *   - Human-authored content lives in /content-migration/prompts/*.md.
 *     This file is the scaffolding; the words live there.
 *
 * Ref: docs/ARCHITECTURE.md §8
 */

import type { AdaSessionState } from '../types.js';
import type { ReadingLevel } from '../../types/db.js';
import type { AnyAdaTool } from '../tools/types.js';
import type { KnowledgeChunkHit } from '../clients/types.js';
import { CH0_TOOLS } from '../tools/registry.js';
import { CH1_TOOLS } from '../tools/registryCh1.js';

/** Default tool set when caller doesn't specify. Ch0 + Ch1 combined. */
const DEFAULT_TOOLS: ReadonlyArray<AnyAdaTool> = [...CH0_TOOLS, ...CH1_TOOLS];

import adaIdentity from '../../../content-migration/prompts/ada-identity.js';
import readingLevelsDoc from '../../../content-migration/prompts/reading-levels.js';
import type {
  ListingRow,
  ListingConfigRow,
  ActiveListingRow,
} from '../clients/types.js';
import {
  renderBoundListingContext,
  renderDiscoveryListingIndex,
} from './listingContext.js';
import { renderStandardsIndexForPrompt } from '../../lib/standardsIndex.js';
import type { PageContext } from '../../types/db.js';

// ─── Inputs ───────────────────────────────────────────────────────────────────

export interface AssemblePromptContext {
  state: AdaSessionState;
  /** Org display name for the greeting. */
  orgDisplayName: string;
  /** Org-specific instructions appended after the base identity. Null ⇒ none. */
  orgAdaIntroPrompt: string | null;
  /**
   * Ch1: per-listing overlay — deprecated in Step 21 in favor of
   * passing the full listing + config objects (see boundListing below).
   * Kept for backwards compatibility with callers that haven't been
   * updated yet; if both are set, boundListing wins.
   */
  listingAdaPromptOverride?: string | null;
  /**
   * Step 21: when session is bound to an active listing
   * (session_type='class_action_intake' + listingId set), the engine
   * loads the listing row + its config and passes them here so the
   * assembler can render the full LISTING CONTEXT section.
   */
  boundListing?: { listing: ListingRow; config: ListingConfigRow } | null;
  /**
   * Step 21: for public_ada discovery sessions, a condensed index of
   * currently-active listings so Ada can recognize matches. When non-
   * empty, renders as part of the LISTING CONTEXT section (discovery
   * mode). Ignored if boundListing is set.
   */
  discoveryListings?: ReadonlyArray<ActiveListingRow>;
  /**
   * Step 22: routing matches evaluated this turn. When non-empty, a
   * ROUTING DESTINATIONS section is rendered telling Ada which partner
   * organizations can handle this kind of complaint. Ada decides
   * whether to surface the option; the user decides whether to accept.
   */
  routingMatches?: ReadonlyArray<import('../routing/evaluate.js').RoutingMatch>;
  /** Tool registry to render into the prompt. Defaults to CH0_TOOLS + CH1_TOOLS. */
  tools?: ReadonlyArray<AnyAdaTool>;
  /**
   * Retrieved knowledge-base chunks for this turn. Optional — when
   * empty or omitted, the KNOWLEDGE section is dropped entirely. The
   * engine passes results from DbClient.searchKnowledgeBase() here.
   * Order matters: the first chunk is shown first in the prompt.
   */
  knowledgeChunks?: ReadonlyArray<KnowledgeChunkHit>;
  /**
   * Current date/time for the conversation. Threaded in by the caller
   * (api/ada/turn.ts) so Ada can reason about relative time —
   * 'last month', 'a few months ago', statute-of-limitations checks.
   *
   * Optional only because tests can omit it; production always passes
   * the wall clock. When omitted the TIME section is dropped, which
   * preserves the deterministic-snapshot behavior the assembler had
   * before this field was added.
   */
  now?: Date;
}

// ─── Assembler ────────────────────────────────────────────────────────────────

export function assemblePrompt(ctx: AssemblePromptContext): string {
  const { cachedPrefix, volatileSuffix } = assemblePromptStructured(ctx);
  return [cachedPrefix, volatileSuffix].filter((s) => s.trim().length > 0).join('\n\n');
}

/**
 * Same content as `assemblePrompt`, but split into a cacheable prefix
 * and a volatile suffix so the AI client can mark the prefix with
 * Anthropic prompt-caching headers.
 *
 * To preserve the section ordering Ada has been trained against and
 * to keep snapshot tests stable, we cache ONLY the IDENTITY block —
 * the largest single static portion (~6k tokens) and the only one
 * guaranteed fully stable across a session. Everything else stays in
 * the volatile suffix in its original order, so model behavior and
 * snapshot output are byte-for-byte identical to the pre-caching
 * assembler.
 *
 * Why not cache TOOLS or READING LEVEL too:
 *   - They sit AFTER volatile sections (KNOWLEDGE, LISTING) in the
 *     legacy ordering. Caching a non-prefix range would either require
 *     reordering (breaks behavior) or multiple cache_control markers
 *     (more complex; the gain over a single 6k-token cached prefix
 *     is small).
 *   - Anthropic's cache breakpoint is positional: everything up to
 *     the marker is cached. So only contiguous prefixes are eligible.
 */
export function assemblePromptStructured(
  ctx: AssemblePromptContext,
): { cachedPrefix: string; volatileSuffix: string } {
  // Cached prefix: content stable across most turns within a session.
  // Anthropic caches up to the cache_control boundary; same-prefix
  // turns within the ~5min TTL skip prefill on this entire block.
  // - IDENTITY: Ada's persona, never changes
  // - ORG CONTEXT: bound at session start, stable thereafter
  // - LISTING CONTEXT: bound or discovery, both session-stable
  // - READING LEVEL: changes occasionally; one cache miss per change
  // - TOOLS: never changes within a session
  //
  // Volatile suffix: per-turn or per-state content.
  // - TIME: changes every turn (date string)
  // - PAGE CONTEXT: technically stable but has guidance text mixed
  //   with stable index; kept volatile to avoid coupling
  // - KNOWLEDGE: RAG hits change with each user message
  // - ROUTING DESTINATIONS: state-dependent, may change as session
  //   accumulates extracted fields
  // - CURRENT SESSION: classification + extracted fields change
  //   every few turns
  const prefixSections = [
    section('IDENTITY', buildIdentitySection(ctx)),
    section('ORG CONTEXT', buildOrgSection(ctx)),
    section('LISTING CONTEXT', buildListingSection(ctx)),
    section('READING LEVEL', buildReadingLevelSection(ctx.state.readingLevel)),
    section('TOOLS', buildToolsSection(ctx.tools ?? DEFAULT_TOOLS)),
  ];

  const suffixSections = [
    section('TIME', buildTimeSection(ctx.now)),
    section('PAGE CONTEXT', buildPageContextSection(ctx.state.metadata.page_context)),
    section('KNOWLEDGE', buildKnowledgeSection(ctx.knowledgeChunks)),
    section('ROUTING DESTINATIONS', buildRoutingSection(ctx.routingMatches)),
    section('CURRENT SESSION', buildSessionContextSection(ctx.state)),
  ];
  return {
    cachedPrefix: prefixSections.filter((s) => s.trim().length > 0).join('\n\n').trim(),
    volatileSuffix: suffixSections.filter((s) => s.trim().length > 0).join('\n\n'),
  };
}

// ─── Section builders ─────────────────────────────────────────────────────────

function buildIdentitySection(_ctx: AssemblePromptContext): string {
  return adaIdentity.trim();
}

function buildTimeSection(now?: Date): string {
  if (!now) return '';
  // Format: "Today is Monday, April 27, 2026."
  // Long form so Ada can reason about month + year + day-of-week.
  const formatted = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return [
    `Today is ${formatted}.`,
    `Use this when the user mentions relative dates ("last month", "a few weeks ago", "recently") so you can resolve them to a real month and year. Pay special attention to statute-of-limitations windows for ADA Title III claims (typically 2 years from the date of the incident, varying by state).`,
  ].join(' ');
}

function buildOrgSection(ctx: AssemblePromptContext): string {
  const parts: string[] = [];
  parts.push(`This session belongs to the **${ctx.orgDisplayName}** organization.`);
  if (ctx.orgAdaIntroPrompt && ctx.orgAdaIntroPrompt.trim().length > 0) {
    parts.push(ctx.orgAdaIntroPrompt.trim());
  }
  return parts.join('\n\n');
}

/**
 * Render retrieved knowledge-base chunks as a structured reference
 * block. Designed to be maximally skimmable by Claude: each chunk has
 * a clear header with its citation, its content, and a footer that
 * tells Ada how to cite if she uses the content.
 *
 * When no chunks are retrieved (or the retrieval system is offline),
 * this section is dropped entirely rather than showing "no knowledge
 * available" — empty state wastes tokens and teaches the model
 * nothing.
 *
 * Citation discipline: the prompt instructs Ada to cite by section
 * number (e.g., "§36.302(c)(6)") when she uses retrieved content,
 * but NOT to fabricate citations when she isn't using it. The
 * distinction matters because Ada should never invent a citation —
 * only reuse one she was handed.
 */
function buildKnowledgeSection(
  chunks: ReadonlyArray<KnowledgeChunkHit> | undefined,
): string {
  if (!chunks || chunks.length === 0) return '';

  const parts: string[] = [];
  parts.push(
    'The following excerpts from the ADA regulations may be relevant to this turn. They were retrieved by semantic similarity and/or direct citation match against the user\'s message.',
  );
  parts.push(
    'Use them to ground your answer when they apply. When you quote or paraphrase from these excerpts, cite the section number in your response (e.g., "§36.302(c)(6)"). If none of them are actually relevant, ignore them — do not force a citation just because an excerpt was retrieved. Never invent citations; only reuse ones shown here.',
  );

  for (const c of chunks) {
    parts.push('');
    parts.push(`## ${c.title}`);
    if (c.source) {
      parts.push(`Source: ${c.source}`);
    }
    parts.push('');
    parts.push(c.content);
  }
  return parts.join('\n');
}

/**
 * Render a PAGE CONTEXT section from session.metadata.page_context.
 * When the user hit Talk-to-Ada from a Standards Guide chapter or
 * deep-dive guide page, we set page_context in the session metadata
 * (see Commit 5). This section surfaces that context to Ada so:
 *
 *   1. She knows the user was just reading about a specific topic.
 *      Her classifier can bias toward the matching ADA title; her
 *      first question can lean on the topic instead of asking open.
 *   2. When she quotes a standard in her reply, she can link back
 *      into the guide — section → URL mapping comes from
 *      standardsIndex.ts.
 *
 * Kept deliberately compact — two paragraphs of context + the index
 * table. The standards index is static across all sessions; the
 * page_context line is the only per-session variable.
 *
 * When page_context is absent, this section is dropped entirely.
 */
function buildPageContextSection(pc: PageContext | undefined): string {
  if (!pc) return '';
  const parts: string[] = [];

  const fromWhere =
    pc.kind === 'chapter'
      ? `the "${pc.title}" chapter (Chapter ${pc.ref})`
      : `the "${pc.title}" deep-dive guide`;
  const url =
    pc.kind === 'chapter'
      ? `/standards-guide/chapter/${pc.ref}`
      : `/standards-guide/guide/${pc.ref}`;

  parts.push(
    `The user came to this conversation from ${fromWhere} in the Standards Guide (URL: ${url}). They were reading about that topic when they clicked "Talk to Ada." Use this as a signal about what they probably want to talk about — their first message may not mention the topic explicitly, but the context is strong.`,
  );
  parts.push(
    'When you quote or paraphrase an ADA standard in your reply, consult the index below. If the section you are citing has a matching guide URL, include it in your reply so the user can read further. Format the link as a plain URL at the end of the relevant paragraph. Do not force a link where none is appropriate — only link when you are genuinely citing the section.',
  );
  parts.push('');
  parts.push(renderStandardsIndexForPrompt());
  return parts.join('\n\n');
}

function buildListingSection(ctx: AssemblePromptContext): string {
  // Bound mode: session is attached to a specific listing. Full context.
  if (ctx.boundListing) {
    return renderBoundListingContext(ctx.boundListing);
  }

  // Discovery mode: public_ada session with active listings available.
  // Renders a condensed index so Ada can propose matches.
  if (ctx.discoveryListings && ctx.discoveryListings.length > 0) {
    return renderDiscoveryListingIndex([...ctx.discoveryListings]);
  }

  // Backwards-compat fallback: old listingAdaPromptOverride-only path.
  const override = ctx.listingAdaPromptOverride;
  if (!override || override.trim().length === 0) return '';
  return override.trim();
}

function buildRoutingSection(
  matches: AssemblePromptContext['routingMatches'],
): string {
  if (!matches || matches.length === 0) return '';

  const parts: string[] = [];
  parts.push(
    `Based on this conversation, the following partner organizations may be able to help the user. You can offer these options — the user decides whether to accept. To route the user to one of them, call the \`route\` tool with destination='external', the matching target_org_id, and user_agreed=true AFTER the user has explicitly said yes.`,
  );
  parts.push('');
  for (const m of matches) {
    parts.push(
      `- **${m.targetOrgDisplayName}** (target_org_id: \`${m.targetOrgId}\`, code: \`${m.targetOrgCode}\`)`,
    );
  }
  return parts.join('\n');
}

function buildReadingLevelSection(level: ReadingLevel): string {
  // Extract the matching section from the reading-levels doc. The doc uses
  // '## simple (…)', '## standard (…)', '## professional (…)' headers.
  const labelMap: Record<ReadingLevel, string> = {
    simple: 'simple',
    standard: 'standard',
    professional: 'professional',
  };
  const wanted = labelMap[level];
  const sections = readingLevelsDoc.split(/^## /m).slice(1);
  for (const s of sections) {
    if (s.toLowerCase().startsWith(wanted)) {
      return `## Reading level: ${wanted}\n\n${s.replace(/^[^\n]*\n\n/, '').trim()}`;
    }
  }
  // Fallback: return all of it so something still shows up if the doc changes shape.
  return readingLevelsDoc.trim();
}

function buildToolsSection(tools: ReadonlyArray<AnyAdaTool>): string {
  if (tools.length === 0) return 'No tools available this turn.';
  const lines: string[] = [
    'The following tools are available. Use them whenever they apply — do not ask the user before using a tool.',
  ];
  for (const tool of tools) {
    lines.push('');
    lines.push(`### ${tool.name}`);
    lines.push(tool.description);
    lines.push('Input schema:');
    lines.push('```json');
    lines.push(JSON.stringify(tool.inputSchema, null, 2));
    lines.push('```');
  }
  return lines.join('\n');
}

function buildSessionContextSection(state: AdaSessionState): string {
  const parts: string[] = [];
  parts.push(`Session status: **${state.status}**.`);

  if (state.classification) {
    const c = state.classification;
    parts.push(
      `You have already classified this session as **Title ${c.title}** with tier **${c.tier}** (reasoning: ${c.reasoning}; cited ${c.standard}). Do not call \`set_classification\` again unless your assessment has materially changed.`,
    );
  } else {
    parts.push('No classification set yet. Call `set_classification` as soon as you have medium or high confidence.');
  }

  const fieldKeys = Object.keys(state.extractedFields);
  if (fieldKeys.length > 0) {
    const fieldsLine = fieldKeys
      .map((k) => {
        const entry = state.extractedFields[k];
        const valueStr = entry.value === null ? 'null' : JSON.stringify(entry.value);
        return `${k}=${valueStr}`;
      })
      .join(', ');
    parts.push(`Fields already extracted: ${fieldsLine}. Don't re-ask questions you have answers for.`);
  } else {
    parts.push('No fields extracted yet.');
  }

  return parts.join('\n\n');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function section(title: string, body: string): string {
  const trimmed = body.trim();
  if (trimmed.length === 0) return '';
  return `---\n# ${title}\n\n${trimmed}`;
}
