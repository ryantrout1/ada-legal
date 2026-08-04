/**
 * Ada Spot — crop-guided placement (debug experiment).
 *
 * /triage found that single-shot placement over the whole cluttered frame
 * mislocalizes hard fixtures: a dark-on-dark curb reads low, and a white
 * cabinet gets confused with the white door beside it. This gives the model a
 * focused view instead — crop the image to a padded box region, ask it to place
 * within THAT crop, then map the crop-relative point back to full-image coords.
 *
 * The padding is proportional to the box (paddedCropRegion), so a low curb box
 * pads up enough to catch the threshold without a wide cabinet box padding out
 * far enough to swallow the door again. Uses the same place_finding tool and
 * prompt as the full-frame placer, so only the image field of view changes.
 *
 * Impure (fetches and crops the image). The pure geometry — the crop window and
 * the point mapping — lives in debugPlacement.ts and is unit-tested; this file
 * is the I/O shell and is exercised only by the debug overlay.
 */

import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import type { PhotoBoundingBox } from '../../types/db.js';
import type { PlaceTarget } from './annotationTypes.js';
import { placementPrompt } from './placeFinding.js';
import { PLACEMENT_MODEL_DEFAULT } from './placeFindingAnthropic.js';
import {
  paddedCropRegion,
  mapCropPointToFull,
  type DebugPlacementPoint,
} from './debugPlacement.js';

const PLACE_FINDING_TOOL = {
  name: 'place_finding',
  description:
    'Return the center point of the one accessibility concern described, as normalized image ' +
    'fractions of THIS cropped image, with a confidence. Set placeable:false when the concern ' +
    'has no single visible location in this crop.',
  input_schema: {
    type: 'object' as const,
    properties: {
      placeable: { type: 'boolean' },
      x: { type: 'number', minimum: 0, maximum: 1 },
      y: { type: 'number', minimum: 0, maximum: 1 },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      label: { type: 'string' },
    },
    required: ['placeable'],
  },
};

const inUnit = (n: unknown): n is number => typeof n === 'number' && n >= 0 && n <= 1;

/**
 * Place one finding using a cropped, padded view of its analyzer box. Returns a
 * full-image point, or null when there's no box, the crop fails, or the model
 * declines. Never throws — a failed crop degrades that finding to no crop pin.
 */
export async function cropGuidedPlace(
  apiKey: string,
  photoUrl: string,
  box: PhotoBoundingBox,
  target: PlaceTarget,
  model: string = PLACEMENT_MODEL_DEFAULT,
): Promise<DebugPlacementPoint | null> {
  try {
    const region = paddedCropRegion(box);
    if (region.w <= 0 || region.h <= 0) return null;

    const resp = await fetch(photoUrl);
    if (!resp.ok) return null;
    const full = sharp(Buffer.from(await resp.arrayBuffer()));
    const meta = await full.metadata();
    if (!meta.width || !meta.height) return null;

    // Normalized region → pixel window, clamped so extract never runs off-image.
    const left = Math.max(0, Math.round(region.x * meta.width));
    const top = Math.max(0, Math.round(region.y * meta.height));
    const width = Math.max(1, Math.min(meta.width - left, Math.round(region.w * meta.width)));
    const height = Math.max(1, Math.min(meta.height - top, Math.round(region.h * meta.height)));

    const cropJpeg = await full
      .extract({ left, top, width, height })
      .jpeg({ quality: 80 })
      .toBuffer();

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 256,
      tools: [PLACE_FINDING_TOOL as never],
      tool_choice: { type: 'tool', name: 'place_finding' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: cropJpeg.toString('base64') },
            },
            { type: 'text', text: placementPrompt(target) },
          ],
        },
      ],
    });

    let input: Record<string, unknown> | null = null;
    for (const block of response.content) {
      if (block.type === 'tool_use' && block.name === 'place_finding') {
        input = block.input as Record<string, unknown>;
        break;
      }
    }
    if (!input || input.placeable === false) return null;
    if (!inUnit(input.x) || !inUnit(input.y) || !inUnit(input.confidence)) return null;

    // input.x/y are fractions of the CROP; map back to the full image.
    const mapped = mapCropPointToFull({ x: input.x, y: input.y }, region);
    const label =
      typeof input.label === 'string' && input.label.trim().length > 0
        ? input.label.trim().slice(0, 40)
        : null;
    return { x: mapped.x, y: mapped.y, confidence: Math.round(input.confidence * 1000) / 1000, label };
  } catch {
    return null;
  }
}
