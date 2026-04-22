/**
 * extract_field tool.
 *
 * Ada calls this to record a structured fact she's pulled from the
 * conversation. One field per call. Fields accumulate in ada_sessions.extracted_fields.
 *
 * Examples:
 *   extract_field({ field: "location_state", value: "AZ", confidence: 0.95 })
 *   extract_field({ field: "has_service_animal", value: true, confidence: 0.80 })
 *   extract_field({ field: "incident_date", value: "2026-03-15", confidence: 0.60 })
 *
 * Validation:
 *   - field name is a non-empty string (convention: snake_case)
 *   - value can be any JSON-serializable value
 *   - confidence is 0..1 inclusive
 *
 * Step 21 addition — ListingConfig schema validation:
 *   When the session is bound to a listing (sessionType='class_action_intake'
 *   + listingId set), extract_field looks up the listing's ListingConfig and
 *   validates the incoming field against its required_fields schema:
 *     - Field names outside the schema are rejected. This prevents Ada
 *       from drifting from the firm-defined intake (and from inventing
 *       fields like 'user_mood' that the firm's pipeline won't consume).
 *     - Value types are checked against field.type ('date', 'enum',
 *       'number', 'yes_no', 'string', 'free_text'). Mismatches produce
 *       an error that echoes back the expected type + (for enum) the
 *       allowed values. Ada sees this error as a tool_result and can
 *       correct and retry.
 *   For public_ada sessions (discovery mode) or any session without a
 *   config, extract_field remains permissive — Ada uses free-form
 *   snake_case field names as before.
 *
 * Ref: docs/ARCHITECTURE.md §7, Step 21.
 */

import type { AdaTool, ToolResult, ToolExecuteContext } from '../types.js';
import type { ExtractedField, FieldSpec } from '../../../types/db.js';

interface ExtractFieldInput {
  field: string;
  value: unknown;
  confidence: number;
}

export const extractFieldTool: AdaTool<ExtractFieldInput> = {
  name: 'extract_field',
  description:
    'Record a structured fact pulled from the conversation. Use snake_case field names. ' +
    'Examples: location_state, location_city, incident_date, venue_type, has_service_animal, ' +
    'barrier_description, staff_response. One field per call. Call this whenever the user ' +
    'provides information that would be useful for an attorney to see later. ' +
    'When the session is scoped to a specific class-action listing, use ONLY the field ' +
    'names the listing declares — other names will be rejected.',
  inputSchema: {
    type: 'object',
    properties: {
      field: {
        type: 'string',
        description: "Field name in snake_case, e.g. 'location_state', 'incident_date'.",
      },
      value: {
        description: "The extracted value — string, number, boolean, null, or object.",
      },
      confidence: {
        type: 'number',
        description: "Your confidence the extraction is correct, from 0.0 to 1.0.",
        minimum: 0,
        maximum: 1,
      },
    },
    required: ['field', 'value', 'confidence'],
  },
  validateInput(raw) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('extract_field: input must be an object');
    }
    const r = raw as Record<string, unknown>;
    if (typeof r.field !== 'string' || r.field.trim() === '') {
      throw new Error('extract_field: field must be a non-empty string');
    }
    if (typeof r.confidence !== 'number' || r.confidence < 0 || r.confidence > 1 || Number.isNaN(r.confidence)) {
      throw new Error('extract_field: confidence must be a number between 0 and 1');
    }
    if (!('value' in r)) {
      throw new Error('extract_field: value is required (use null if the user explicitly said no/none)');
    }
    return {
      field: r.field,
      value: r.value,
      confidence: r.confidence,
    };
  },
  async execute(ctx: ToolExecuteContext, input): Promise<ToolResult> {
    // Step 21: if the session is bound to a listing, validate the field
    // against the ListingConfig schema. Sessions not bound to a listing
    // (public_ada in either discovery or no-match mode) skip this check —
    // field names stay free-form, as in Ch0.
    if (
      ctx.state.sessionType === 'class_action_intake' &&
      ctx.state.listingId
    ) {
      const config = await ctx.clients.db.readListingConfigForListing(
        ctx.state.listingId,
      );
      if (config) {
        const requiredFields = (config.requiredFields as FieldSpec[]) ?? [];
        const schemaEntry = requiredFields.find((f) => f.name === input.field);
        if (!schemaEntry) {
          const allowed = requiredFields.map((f) => f.name);
          return {
            ok: false,
            error:
              `extract_field: field '${input.field}' is not in this listing's schema. ` +
              (allowed.length > 0
                ? `Allowed field names: ${allowed.join(', ')}.`
                : `This listing declares no fields.`),
          };
        }
        const typeError = validateFieldType(schemaEntry, input.value);
        if (typeError) {
          return { ok: false, error: `extract_field: ${typeError}` };
        }
      }
      // If there's no config at all, fall through to permissive mode —
      // the firm hasn't finished setting up the listing, but Ada can
      // still capture facts usefully.
    }

    const entry: ExtractedField = {
      value: input.value,
      confidence: input.confidence,
      extracted_at: ctx.clients.clock.now().toISOString(),
    };
    return {
      ok: true,
      content: { recorded: input.field },
      stateChanges: {
        extractedFieldsPatch: { [input.field]: entry },
      },
    };
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Check value against the FieldSpec type. Returns null on match or a
 * human-readable error string otherwise. The error is shown to Ada, so
 * it includes the allowed enum values and a hint about the expected
 * shape.
 *
 * We're deliberately lenient on edge cases:
 *   - 'date': accept any ISO-8601-looking string. Don't validate the
 *     actual calendar date (e.g. Feb 30) — that's the firm's problem.
 *   - 'yes_no': accept booleans OR common string forms ('yes', 'no',
 *     'y', 'n') so Ada's natural-language extraction keeps working.
 *   - 'number': accept number OR numeric string.
 *   - 'enum': strict — must match one of enum_values exactly.
 *   - 'string' / 'free_text': accept anything stringifiable; null/undef
 *     count as empty string.
 */
function validateFieldType(
  spec: FieldSpec,
  value: unknown,
): string | null {
  const allowNull = !spec.required;
  if (value === null || value === undefined) {
    return allowNull ? null : `${spec.name} is required and cannot be null.`;
  }

  switch (spec.type) {
    case 'date': {
      if (typeof value !== 'string') {
        return `${spec.name} must be a date string (YYYY-MM-DD), got ${typeof value}.`;
      }
      if (!/^\d{4}-\d{2}-\d{2}/.test(value)) {
        return `${spec.name} must be an ISO date (YYYY-MM-DD), got '${value}'.`;
      }
      return null;
    }
    case 'number': {
      const asNum =
        typeof value === 'number'
          ? value
          : typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)
            ? Number(value)
            : NaN;
      if (!Number.isFinite(asNum)) {
        return `${spec.name} must be a number, got ${JSON.stringify(value)}.`;
      }
      return null;
    }
    case 'yes_no': {
      if (typeof value === 'boolean') return null;
      if (typeof value === 'string') {
        const lower = value.trim().toLowerCase();
        if (['yes', 'no', 'y', 'n', 'true', 'false'].includes(lower)) {
          return null;
        }
      }
      return `${spec.name} must be yes/no (boolean or 'yes'/'no' string), got ${JSON.stringify(value)}.`;
    }
    case 'enum': {
      if (typeof value !== 'string') {
        return `${spec.name} must be one of: ${(spec.enum_values ?? []).join(', ')} (got ${typeof value}).`;
      }
      if (!spec.enum_values || !spec.enum_values.includes(value)) {
        return `${spec.name} must be one of: ${(spec.enum_values ?? []).join(', ')} (got '${value}').`;
      }
      return null;
    }
    case 'string':
    case 'free_text':
    default: {
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
        return `${spec.name} must be a string, got ${typeof value}.`;
      }
      return null;
    }
  }
}
