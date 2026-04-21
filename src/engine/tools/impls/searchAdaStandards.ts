/**
 * search_ada_standards tool.
 *
 * On-demand knowledge-base search. The turn-level KB retrieval in
 * processAdaTurn embeds the user's message once and injects results
 * into the system prompt. This tool is for the cases where THAT
 * isn't enough — specifically:
 *
 *   1. Follow-up questions within a turn. Ada already answered the
 *      user's direct question, but as she's composing a follow-up
 *      she realizes she needs regulation text she didn't get in the
 *      turn-open prompt injection. She can search for it directly.
 *
 *   2. Verification before citing. Ada wants to cite a specific
 *      section number, but the section wasn't in the original
 *      retrieval — she uses this to confirm it says what she thinks.
 *
 *   3. Exploratory questions from the user like "what else is in
 *      §36" where the initial retrieval surfaced only the most
 *      relevant chunks but there's more material Ada might want to
 *      share.
 *
 * The tool returns the same KnowledgeChunkHit shape the prompt
 * assembler uses — same citation discipline rules apply (cite by
 * section number, never invent a citation).
 *
 * Design note: we do NOT auto-inject tool results back into the
 * system prompt. Ada sees them in her conversation history as the
 * tool_result block, which is the intended pattern — the AI reads
 * the tool output and decides how to incorporate it.
 *
 * Ref: docs/ARCHITECTURE.md §7, §10.5
 */

import type { AdaTool, ToolResult, ToolExecuteContext } from '../types.js';

interface SearchAdaStandardsInput {
  query: string;
  topic?: string;
  limit?: number;
}

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;

const VALID_TOPICS = [
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
];

export const searchAdaStandardsTool: AdaTool<SearchAdaStandardsInput> = {
  name: 'search_ada_standards',
  description:
    'Search the ADA regulations knowledge base for specific sections, rules, or guidance. ' +
    'Use this when you need to verify a citation, look up regulation text you don\'t have in ' +
    'front of you, or answer a follow-up question that references regulations. The search ' +
    'combines semantic similarity with exact citation match, so queries like "service animal ' +
    'fees" or "§36.302(c)(8)" both work. Returns up to 5 matching excerpts. When you quote ' +
    'or paraphrase returned text, cite the section number (e.g., "§36.302(c)(1)"). Never ' +
    'invent a citation not present in the results.',
  inputSchema: {
    type: 'object',
    required: ['query'],
    properties: {
      query: {
        type: 'string',
        description:
          'The search query. Can be a natural-language question ("can a restaurant charge ' +
          'extra for a service animal") or an explicit citation ("§36.302(c)(8)") or a mix ' +
          '("what does §36.303 say about auxiliary aids for people who are deaf").',
        minLength: 3,
      },
      topic: {
        type: 'string',
        description:
          'Optional topic filter to narrow the search. One of: ' +
          VALID_TOPICS.join(', ') +
          '.',
        enum: VALID_TOPICS,
      },
      limit: {
        type: 'number',
        description: `Max results to return (default ${DEFAULT_LIMIT}, max ${MAX_LIMIT}).`,
        minimum: 1,
        maximum: MAX_LIMIT,
      },
    },
  },
  validateInput(raw) {
    if (raw === null || raw === undefined || typeof raw !== 'object') {
      throw new Error('search_ada_standards: input must be an object with a query field');
    }
    const r = raw as Record<string, unknown>;
    if (typeof r.query !== 'string' || r.query.trim().length < 3) {
      throw new Error(
        'search_ada_standards: query is required and must be at least 3 characters',
      );
    }
    if (r.topic !== undefined) {
      if (typeof r.topic !== 'string' || !VALID_TOPICS.includes(r.topic)) {
        throw new Error(
          `search_ada_standards: topic must be one of: ${VALID_TOPICS.join(', ')}`,
        );
      }
    }
    if (r.limit !== undefined) {
      if (
        typeof r.limit !== 'number' ||
        r.limit < 1 ||
        r.limit > MAX_LIMIT ||
        !Number.isInteger(r.limit)
      ) {
        throw new Error(
          `search_ada_standards: limit must be an integer between 1 and ${MAX_LIMIT}`,
        );
      }
    }
    return {
      query: r.query.trim(),
      topic: typeof r.topic === 'string' ? r.topic : undefined,
      limit: typeof r.limit === 'number' ? r.limit : DEFAULT_LIMIT,
    };
  },
  async execute({ clients }: ToolExecuteContext, input): Promise<ToolResult> {
    // Optional semantic component: embed the query if an embeddings
    // client is available. Tolerant of failures — citation-only
    // search still runs.
    let queryEmbedding: number[] | undefined;
    if (clients.embeddings) {
      try {
        queryEmbedding = await clients.embeddings.embedQuery(input.query);
      } catch {
        // Proceed without embedding; citation-exact-match will still
        // hit anything with an explicit §-citation in the query.
      }
    }

    const hits = await clients.db.searchKnowledgeBase({
      query: input.query,
      queryEmbedding,
      k: input.limit,
      topic: input.topic,
    });

    return {
      ok: true,
      content: {
        count: hits.length,
        results: hits.map((h) => ({
          title: h.title,
          topic: h.topic,
          content: h.content,
          source: h.source,
          standard_refs: h.standardRefs,
          match_type: h.matchType,
          ...(h.similarity !== null ? { similarity: Number(h.similarity.toFixed(3)) } : {}),
        })),
      },
    };
  },
};
