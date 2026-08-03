/**
 * Ada Spot — pins for one photo.
 *
 * Matches a photo's URL to its annotation entry in the report content and
 * returns that photo's pins, or [] when the report has no annotations, the
 * photo has no entry, or the entry has no pins. Pure. A photo whose URL is not
 * in the annotations gets no pins rather than borrowing another photo's — a
 * pin must sit on the photo it was placed against.
 */

import type { SpotReportContent } from './reportSchema.js';
import type { PhotoPin } from './annotationTypes.js';

export function pinsForPhoto(content: SpotReportContent, photoUrl: string): PhotoPin[] {
  const match = content.photoAnnotations?.find((a) => a.photoUrl === photoUrl);
  return match ? match.pins : [];
}
