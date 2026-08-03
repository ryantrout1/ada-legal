/**
 * Ada Spot — number the pins and tie each to its finding row.
 *
 * The markers on the photo and the "Visible in the photo" rows come from two
 * different places (per-photo placement vs the composed report), so they carry
 * no shared id. This links them at render time: it walks the confirmed rows in
 * display order, matches each to a pin by label, and hands out the numbers —
 * so pin ①  on the photo is the same finding as row ①  below.
 *
 * Matching is by normalized label containment (the short pin label is usually
 * the opening of the row title). It fails safe: an unmatched row gets no number
 * (never a wrong one), and a pin with no row still gets a trailing number so it
 * is labelled on the photo and in the caption.
 */

import type { SpotReportItem } from './reportSchema.js';
import type { PhotoAnnotation, PhotoPin } from './annotationTypes.js';

export interface NumberedPin extends PhotoPin {
  number: number;
}

export interface PinNumbering {
  /** This photo's pins, each carrying its number, in the photo's pin order. */
  pinsForPhoto: (photoUrl: string) => NumberedPin[];
  /** The number to show on a finding row, or null when it has no pin. */
  numberForItem: (item: SpotReportItem) => number | null;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function itemMatchesPin(item: SpotReportItem, pin: PhotoPin): boolean {
  const title = norm(item.title);
  const label = norm(pin.label);
  if (!label || !title) return false;
  return title.includes(label) || label.includes(title);
}

export function buildPinNumbering(
  confirmedItems: readonly SpotReportItem[],
  photoAnnotations: readonly PhotoAnnotation[] | undefined,
): PinNumbering {
  const annotations = photoAnnotations ?? [];
  const allPins: PhotoPin[] = annotations.flatMap((a) => a.pins);

  const pinNumber = new Map<PhotoPin, number>();
  const itemNumber = new Map<SpotReportItem, number>();
  let counter = 0;

  // Number confirmed rows that have a matching pin, in display order, so the
  // list reads 1, 2, 3 top to bottom and the photo markers match.
  for (const item of confirmedItems) {
    const pin = allPins.find((p) => !pinNumber.has(p) && itemMatchesPin(item, p));
    if (pin) {
      counter += 1;
      pinNumber.set(pin, counter);
      itemNumber.set(item, counter);
    }
  }
  // Any pin with no row still gets a number so it is labelled on the photo.
  for (const pin of allPins) {
    if (!pinNumber.has(pin)) {
      counter += 1;
      pinNumber.set(pin, counter);
    }
  }

  return {
    pinsForPhoto: (photoUrl) => {
      const match = annotations.find((a) => a.photoUrl === photoUrl);
      if (!match) return [];
      return match.pins.map((pin) => ({ ...pin, number: pinNumber.get(pin) ?? 0 }));
    },
    numberForItem: (item) => itemNumber.get(item) ?? null,
  };
}
