/**
 * Ada Spot — verified placement.
 *
 * The problem this solves, measured rather than guessed: across nine runs of
 * the same bathroom photo, the shower curb was localized at 0.72 (on the curb)
 * six times and 0.83–0.86 (down on the floor tile) three times. The model finds
 * the curb most of the time. The failure is INCONSISTENCY, so no amount of
 * prompt rewording fixes it — a single sample is a coin flip weighted toward
 * the right answer, and eleven attempts at reweighting that coin got us from
 * 0.82 to 0.77.
 *
 * The fix is to stop trusting one roll. Place, then ask the model to check its
 * own answer against a crop around the point; if the check fails, place again
 * and check that. The check is trustworthy because the model has demonstrated
 * it repeatedly: cropped to a wrong box it declined outright three sessions
 * running, and returned only 0.55 confidence the once it answered.
 *
 * When no attempt verifies, the point is still returned but its confidence is
 * capped below the precise threshold, so it renders as an approximate marker
 * with "— approximate" in the caption rather than a confident dot on the wrong
 * spot. A missed barrier and a false pin are both failures; an honest
 * approximate marker is neither.
 *
 * Nothing here is curb-specific or bathroom-specific — it is "check your work,
 * and say so when you cannot confirm it", which applies to any photo.
 */

import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import type { PlacedPin, PlaceTarget } from './annotationTypes.js';
import type { PlaceFn } from './buildPhotoAnnotations.js';
import { PLACEMENT_MODEL_DEFAULT } from './placeFindingAnthropic.js';

/** Confidence assigned when the model could not confirm its own placement. */
export const UNVERIFIED_CONFIDENCE = 0.6;

/** Half-width of the verification crop, as a fraction of the image. */
const VERIFY_WINDOW = 0.18;

export interface PlacementAttempt {
  pin: PlacedPin | null;
  verified: boolean;
  /** The model's confidence in the verification itself, when it answered. */
  verifyConfidence?: number;
}

/**
 * Choose among placement attempts. Pure — all the decision logic lives here so
 * it is testable without a model.
 */
export function reconcilePlacements(attempts: readonly PlacementAttempt[]): PlacedPin | null {
  const withPin = attempts.filter(
    (a): a is PlacementAttempt & { pin: PlacedPin } => a.pin !== null,
  );
  if (withPin.length === 0) return null;

  const verified = withPin.filter((a) => a.verified);
  if (verified.length > 0) {
    // Best-confirmed wins. Ties keep the earlier attempt for determinism.
    const best = verified.reduce((acc, a) =>
      (a.verifyConfidence ?? 0) > (acc.verifyConfidence ?? 0) ? a : acc,
    );
    return best.pin;
  }

  // Nothing confirmed. Return the first point but cap its confidence so it
  // cannot render as a precise pin — an unconfirmed location must never look
  // certain.
  const first = withPin[0].pin;
  return { ...first, confidence: Math.min(first.confidence, UNVERIFIED_CONFIDENCE) };
}

/**
 * Ask the model whether the concern really is at this point, using a crop
 * centred on it. Returns null when the check could not be made at all (so a
 * verification outage degrades to "unverified", never to a false negative that
 * would trigger a pointless resample loop).
 */
async function verifyPoint(
  client: Anthropic,
  model: string,
  imageBuffer: Buffer,
  width: number,
  height: number,
  point: PlacedPin,
  target: PlaceTarget,
): Promise<{ verified: boolean; confidence: number } | null> {
  try {
    const left = Math.max(0, Math.round((point.x - VERIFY_WINDOW) * width));
    const top = Math.max(0, Math.round((point.y - VERIFY_WINDOW) * height));
    const w = Math.max(1, Math.min(width - left, Math.round(VERIFY_WINDOW * 2 * width)));
    const h = Math.max(1, Math.min(height - top, Math.round(VERIFY_WINDOW * 2 * height)));

    const crop = await sharp(imageBuffer).extract({ left, top, width: w, height: h }).jpeg({ quality: 80 }).toBuffer();

    const resp = await client.messages.create({
      model,
      max_tokens: 128,
      tools: [
        {
          name: 'confirm_location',
          description:
            'State whether the described accessibility concern is actually visible in this cropped region of a larger photo.',
          input_schema: {
            type: 'object' as const,
            properties: {
              present: { type: 'boolean' },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
            },
            required: ['present'],
          },
        } as never,
      ],
      tool_choice: { type: 'tool', name: 'confirm_location' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: crop.toString('base64') },
            },
            {
              type: 'text',
              text:
                `This is a close crop from a larger photo. Concern: ${target.title}.\n` +
                `Is the object this concern refers to actually visible in THIS crop? ` +
                `Answer present:false if you only see the surrounding floor, wall, or empty space ` +
                `where the object is not present. Call confirm_location.`,
            },
          ],
        },
      ],
    });

    for (const block of resp.content) {
      if (block.type === 'tool_use' && block.name === 'confirm_location') {
        const input = block.input as Record<string, unknown>;
        if (typeof input.present !== 'boolean') return null;
        const confidence =
          typeof input.confidence === 'number' && input.confidence >= 0 && input.confidence <= 1
            ? input.confidence
            : 0.5;
        return { verified: input.present, confidence };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Wrap a placement function so every placement is checked, and resampled once
 * when the check fails. Falls back to the base function's own result if the
 * image cannot be fetched, so verification is never a new way to lose a pin.
 */
export function makeVerifiedPlaceFn(
  apiKey: string,
  base: PlaceFn,
  model: string = PLACEMENT_MODEL_DEFAULT,
  maxAttempts = 2,
): PlaceFn {
  const client = new Anthropic({ apiKey });

  return async (photoUrl: string, target: PlaceTarget): Promise<PlacedPin | null> => {
    let imageBuffer: Buffer;
    let width: number;
    let height: number;
    try {
      const resp = await fetch(photoUrl);
      if (!resp.ok) return base(photoUrl, target);
      imageBuffer = Buffer.from(await resp.arrayBuffer());
      const meta = await sharp(imageBuffer).metadata();
      if (!meta.width || !meta.height) return base(photoUrl, target);
      width = meta.width;
      height = meta.height;
    } catch {
      return base(photoUrl, target);
    }

    const attempts: PlacementAttempt[] = [];
    for (let i = 0; i < maxAttempts; i++) {
      const pin = await base(photoUrl, target);
      if (!pin) {
        attempts.push({ pin: null, verified: false });
        continue;
      }
      const check = await verifyPoint(client, model, imageBuffer, width, height, pin, target);
      // A check that could not run counts as unverified, not as a failure of
      // the placement — reconcile still returns the point, capped.
      attempts.push({
        pin,
        verified: check?.verified === true,
        verifyConfidence: check?.confidence,
      });
      if (check?.verified === true) break;
    }

    return reconcilePlacements(attempts);
  };
}
