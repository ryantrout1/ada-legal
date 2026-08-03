/**
 * Ada Spot — the real Anthropic placement call behind placeFinding.
 *
 * Thin adapter: builds a PlaceFn that sends the photo (by URL — Anthropic
 * fetches it server-side) plus the single-finding placement prompt, forces the
 * place_finding tool, and returns the raw tool input for placeFinding to
 * sanitise. All the safety/gating logic lives in placeFinding /
 * buildPhotoAnnotations, not here.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { PhotoFinding } from '../../types/db.js';
import type { PlacedPin } from './annotationTypes.js';
import { placeFinding } from './placeFinding.js';
import type { PlaceFn } from './buildPhotoAnnotations.js';

/** Same default the photo analyzer uses. Overridable per preview run. */
export const PLACEMENT_MODEL_DEFAULT = 'claude-opus-4-8';

const PLACE_FINDING_TOOL = {
  name: 'place_finding',
  description:
    'Return the center point of the one accessibility concern described, as normalized image ' +
    'fractions, with a confidence. Set placeable:false when the concern has no single visible ' +
    'location in this photo.',
  input_schema: {
    type: 'object' as const,
    properties: {
      placeable: {
        type: 'boolean',
        description: 'false when the concern has no single visible location in this photo.',
      },
      x: { type: 'number', minimum: 0, maximum: 1, description: 'Center X, image fraction from left.' },
      y: { type: 'number', minimum: 0, maximum: 1, description: 'Center Y, image fraction from top.' },
      confidence: { type: 'number', minimum: 0, maximum: 1, description: 'Confidence this point is correct.' },
    },
    required: ['placeable'],
  },
};

function extractToolInput(response: Anthropic.Messages.Message): unknown {
  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'place_finding') return block.input;
  }
  return null;
}

/**
 * Build a PlaceFn backed by a real Anthropic client. The returned function is
 * what buildPhotoAnnotations calls per finding.
 */
export function makeAnthropicPlaceFn(
  apiKey: string,
  model: string = PLACEMENT_MODEL_DEFAULT,
): PlaceFn {
  const client = new Anthropic({ apiKey });

  return async (photoUrl: string, finding: PhotoFinding): Promise<PlacedPin | null> => {
    return placeFinding(
      async (url, prompt) => {
        const response = await client.messages.create({
          model,
          max_tokens: 256,
          tools: [PLACE_FINDING_TOOL as never],
          tool_choice: { type: 'tool', name: 'place_finding' },
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image', source: { type: 'url', url } },
                { type: 'text', text: prompt },
              ],
            },
          ],
        });
        return extractToolInput(response);
      },
      photoUrl,
      finding,
    );
  };
}
