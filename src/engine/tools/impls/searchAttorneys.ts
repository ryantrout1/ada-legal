/**
 * search_attorneys tool.
 *
 * Ada calls this once she has enough information (typically: state +
 * incident type classified) to suggest attorneys for a referral. Returns
 * a short list of attorneys the user can choose from.
 *
 * This tool only *returns* data for Ada to present; it does NOT make a
 * referral automatically. The referral creation step (Ch1 handoff) is a
 * separate flow.
 *
 * Ref: docs/ARCHITECTURE.md §7
 */

import type { AdaTool, ToolResult, ToolExecuteContext } from '../types.js';

interface SearchAttorneysInput {
  state?: string;
  city?: string;
  practice_areas?: string[];
  limit?: number;
}

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;

export const searchAttorneysTool: AdaTool<SearchAttorneysInput> = {
  name: 'search_attorneys',
  description:
    'Look up attorneys who could take this case. Filter by US state (two-letter, e.g. "AZ"), ' +
    'city, and practice areas (e.g. ["ada", "employment"]). Returns up to 5 attorneys by default. ' +
    'Call this only after you know the user\'s location and have classified the incident.',
  inputSchema: {
    type: 'object',
    properties: {
      state: {
        type: 'string',
        description: "Two-letter US state code, e.g. 'AZ', 'CA'. Case-insensitive.",
      },
      city: {
        type: 'string',
        description: "City name, used as a secondary filter.",
      },
      practice_areas: {
        type: 'array',
        items: { type: 'string' },
        description: "Tags to match: 'ada', 'employment', 'housing', 'education', 'public_accommodations', etc.",
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
    if (raw !== undefined && raw !== null && typeof raw !== 'object') {
      throw new Error('search_attorneys: input must be an object or omitted');
    }
    const r = (raw ?? {}) as Record<string, unknown>;
    if (r.state !== undefined && typeof r.state !== 'string') {
      throw new Error('search_attorneys: state must be a string');
    }
    if (r.city !== undefined && typeof r.city !== 'string') {
      throw new Error('search_attorneys: city must be a string');
    }
    if (r.practice_areas !== undefined) {
      if (!Array.isArray(r.practice_areas) || !r.practice_areas.every((p) => typeof p === 'string')) {
        throw new Error('search_attorneys: practice_areas must be an array of strings');
      }
    }
    if (r.limit !== undefined) {
      if (typeof r.limit !== 'number' || r.limit < 1 || r.limit > MAX_LIMIT || !Number.isInteger(r.limit)) {
        throw new Error(`search_attorneys: limit must be an integer between 1 and ${MAX_LIMIT}`);
      }
    }
    return {
      state: typeof r.state === 'string' ? r.state.toUpperCase() : undefined,
      city: typeof r.city === 'string' ? r.city : undefined,
      practice_areas: Array.isArray(r.practice_areas) ? (r.practice_areas as string[]) : undefined,
      limit: typeof r.limit === 'number' ? r.limit : DEFAULT_LIMIT,
    };
  },
  async execute({ clients, state }: ToolExecuteContext, input): Promise<ToolResult> {
    const rows = await clients.db.searchAttorneys({
      orgId: state.orgId,
      state: input.state,
      city: input.city,
      practiceAreas: input.practice_areas,
      limit: input.limit,
    });
    return {
      ok: true,
      content: {
        count: rows.length,
        attorneys: rows.map((a) => ({
          id: a.id,
          name: a.name,
          firm: a.firmName,
          city: a.locationCity,
          state: a.locationState,
          practice_areas: a.practiceAreas,
          email: a.email,
          phone: a.phone,
          website: a.websiteUrl,
        })),
      },
    };
  },
};
