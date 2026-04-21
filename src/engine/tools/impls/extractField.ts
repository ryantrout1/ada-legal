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
 * Ref: docs/ARCHITECTURE.md §7, src/types/db.ts ExtractedField
 */

import type { AdaTool, ToolResult, ToolExecuteContext } from '../types.js';
import type { ExtractedField } from '../../../types/db.js';

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
    'provides information that would be useful for an attorney to see later.',
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
  async execute({ clients }: ToolExecuteContext, input): Promise<ToolResult> {
    const entry: ExtractedField = {
      value: input.value,
      confidence: input.confidence,
      extracted_at: clients.clock.now().toISOString(),
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
