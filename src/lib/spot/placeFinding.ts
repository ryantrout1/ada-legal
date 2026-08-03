/**
 * Ada Spot — focused single-object placement (pure, injected model call).
 *
 * The report analyzer asks for all findings' boxes in one pass, and its
 * attention splits across the whole scene: big regions land, small objects
 * (a curb, a bench) drift low-and-right and miss. This runs the opposite way —
 * one finding at a time, the model's only job to place THIS object — which is
 * where these models are strongest.
 *
 * The model call is injected (`PlaceCall`) so the placement logic here is pure
 * and unit-testable without a network call. The real Anthropic adapter lives
 * in placeFindingAnthropic.ts.
 *
 * A pin is never invented from a bad response: an unplaceable finding, an
 * out-of-range coordinate, or a malformed reply all return null. A missing pin
 * is always preferable to a pin on the wrong thing.
 */

import type { PlacedPin, PlaceTarget } from './annotationTypes.js';

/**
 * The injected model call: given a photo URL and a prompt, return whatever the
 * model produced (parsed JSON, or null on failure). placeFinding sanitises it.
 */
export type PlaceCall = (photoUrl: string, prompt: string) => Promise<unknown>;

const round3 = (n: number): number => Math.round(n * 1000) / 1000;

function inUnit(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1;
}

/**
 * The single-object placement prompt. Names the one concern and asks for its
 * center point plus a confidence, and explicitly allows the model to decline
 * (placeable:false) when the concern has no single visible location — an
 * absence, or something not shown in this photo.
 */
export function placementPrompt(target: PlaceTarget): string {
  return [
    'You are marking the location of ONE accessibility concern on this photo.',
    `Concern: ${target.title}`,
    `Detail: ${target.detail}`,
    'Return the CENTER POINT of the physical object or area this concern is about,',
    'as normalized image fractions x and y (0..1, measured from the top-left).',
    'Return confidence (0..1) that this point is correct.',
    'Return label: a 2 to 4 word marker caption for this concern, plain and concrete',
    '(e.g. "Raised curb", "Grab bars", "Narrow clearance") — not a full sentence.',
    'If this concern has no single visible location in THIS photo — an absence with',
    'no place to point at, or something not shown — return placeable:false instead.',
  ].join('\n');
}

/**
 * Place one target on one photo. Pure except the injected call. Returns null
 * when the model declines, errors, or returns anything outside 0..1.
 */
export async function placeFinding(
  call: PlaceCall,
  photoUrl: string,
  target: PlaceTarget,
): Promise<PlacedPin | null> {
  let raw: unknown;
  try {
    raw = await call(photoUrl, placementPrompt(target));
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (r.placeable === false) return null;
  const { x, y, confidence } = r;
  if (!inUnit(x) || !inUnit(y) || !inUnit(confidence)) return null;
  const label =
    typeof r.label === 'string' && r.label.trim().length > 0
      ? r.label.trim().slice(0, 40)
      : undefined;
  return { x: round3(x), y: round3(y), confidence: round3(confidence), label };
}
