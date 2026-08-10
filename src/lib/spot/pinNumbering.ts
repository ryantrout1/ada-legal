/**
 * Ada Spot — number the pins and tie each to its finding row.
 *
 * Pins are placed FOR confirmed report items (see buildItemAnnotations), so
 * every pin carries the itemIndex of the row it marks. Numbering is therefore
 * exact, not a text guess: walk the items in display order, and each confirmed
 * item that has a pin gets the next number — on both the marker and the row.
 * pin ①  on the photo is the same finding as row ①  below, by construction.
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

export function buildPinNumbering(
  items: readonly SpotReportItem[],
  photoAnnotations: readonly PhotoAnnotation[] | undefined,
): PinNumbering {
  const annotations = photoAnnotations ?? [];
  const pinByItemIndex = new Map<number, PhotoPin>();
  for (const a of annotations) for (const p of a.pins) pinByItemIndex.set(p.itemIndex, p);

  const pinNumber = new Map<PhotoPin, number>();
  const itemNumber = new Map<SpotReportItem, number>();
  let counter = 0;

  // Display order = content.items order; groupFindings preserves it and keeps
  // the same object references, so numbering by identity lines up with the
  // rendered "Visible in the photo" list.
  items.forEach((item, index) => {
    // Number whatever has a pin. This used to skip hedged items, which went
    // stale when pin selection moved to locatable+severity: a hedged but
    // plainly visible bench got a marker, was skipped here, and then picked up
    // a number from the fallback below — so its marker read 3 while its row
    // showed none. Two filters disagreeing about which items count is exactly
    // the conflation the pin filter already fixed; there must be one answer.
    const pin = pinByItemIndex.get(index);
    if (!pin) return;
    counter += 1;
    pinNumber.set(pin, counter);
    itemNumber.set(item, counter);
  });

  // Defensive, for legacy reports ONLY: a pin whose itemIndex matches no item
  // (reports generated before pins carried itemIndex) still gets a number so it
  // never renders a bare "0". With numbering and pin selection now driven by
  // the same question — does this item have a pin — a current report should
  // never reach here. If a live report does, the two filters have drifted apart
  // again; that is the bug this fallback previously disguised.
  for (const a of annotations) {
    for (const pin of a.pins) {
      if (!pinNumber.has(pin)) {
        counter += 1;
        pinNumber.set(pin, counter);
      }
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
