/**
 * Ada Spot — number a single photo's pins for the field-test preview.
 *
 * The buyer report numbers pins through buildPinNumbering, which walks the
 * COMPOSED report items and ties pin N to row N by the item's index. The /photo
 * harness has no composed items and no numbered row list — it shows the raw
 * findings of one analysis over one photo, placed by buildPhotoAnnotations. All
 * it needs is a marker number per pin so PinnedPhoto can render, so numbering
 * here is simply the pins' own order: first pin is 1, second is 2.
 *
 * Kept separate from buildPinNumbering on purpose — that function's contract is
 * the pin↔row identity of the report, which does not exist here. Collapsing the
 * two would force the harness to fabricate SpotReportItems it has no source for.
 *
 * Pure and order-preserving. Ref: /photo pin overlay.
 */

import type { PhotoAnnotation } from './annotationTypes.js';
import type { NumberedPin } from './pinNumbering.js';

/**
 * Number the pins of one placed photo in pin order, starting at 1. A photo with
 * no pins returns an empty array — PinnedPhoto then renders the plain photo.
 */
export function numberPins(annotation: PhotoAnnotation | undefined): NumberedPin[] {
  if (!annotation) return [];
  return annotation.pins.map((pin, i) => ({ ...pin, number: i + 1 }));
}
