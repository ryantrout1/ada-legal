/**
 * Ada Spot — free-read *progress* mapper (pure).
 *
 * The streamed free read (analyzeStream) hands out the tool's partially parsed
 * JSON as it arrives. This decides what is safe to send while the analysis is
 * still running — and since the free read became a teaser, the answer is:
 * almost nothing.
 *
 * This used to stream the summary and every finding title as they landed, and
 * that was the hole in the paywall. The teaser withholds the barrier list at
 * the end, but a visitor watching the spinner had already been shown all of it
 * on the way there — and it sat in the network payload regardless of what the
 * UI chose to paint. Withholding at the end only counts if nothing leaked
 * earlier.
 *
 * The scene survives, and only the scene. It names what is being read ("a
 * residential bathroom") without naming a single barrier, so the wait shows
 * honest evidence the read is working while giving the report away.
 *
 * The rules that governed this file still hold, and one of them is now free:
 *   - NO verdict mid-stream. There was never a `kind` or `overallRisk` here;
 *     with no findings either, there is nothing to read an all-clear from.
 *   - Fully-formed only. Trivially true of a single string.
 *   - Hedge-don't-drop: nothing to hedge, since no finding streams at all.
 */

export interface SpotProgressView {
  /** What the photo shows. Names no barrier — see the note above. */
  scene?: string;
}

function nonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

export function mapSpotProgress(snapshot: unknown): SpotProgressView {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return {};
  }
  const s = snapshot as Record<string, unknown>;
  return nonEmptyString(s.scene) ? { scene: s.scene } : {};
}
