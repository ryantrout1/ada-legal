/**
 * Ada Spot — build photo annotations from the composed report items (pure).
 *
 * This is the report path, and it is the reason pins and finding rows line up:
 * a pin is placed FOR a confirmed report item, so it carries that item's index
 * and the render numbers them by that index — no guessing which pin is which
 * row. Contrast buildPhotoAnnotations, which places raw per-photo findings for
 * the admin preview and cannot be tied back to the composed rows.
 *
 * Each item is placed across every session photo; the highest-confidence photo
 * above the floor wins, so a single barrier gets a single marker on the photo
 * where it reads clearest. An item that can't be placed anywhere gets no pin —
 * the finding still reads in prose. Fail-safe toward "no pin", never a pin on
 * the wrong thing.
 *
 * Pure: the model call arrives wrapped as `place`, so this is deterministic
 * given a stubbed placer. Ref: /plan place composed report items, Phase 1.
 */

import type { PhotoAnnotation, PhotoPin, PlacedPin, PinSource } from './annotationTypes.js';
import type { PhotoFindingSeverity, PhotoBoundingBox } from '../../types/db.js';
import type { PlaceFn } from './buildPhotoAnnotations.js';

/** One confirmed report item to place, carrying its index in content.items. */
export interface PlaceItemInput {
  itemIndex: number;
  title: string;
  detail: string;
  severity: PhotoFindingSeverity;
  /**
   * A pin already derived from the analyzer's own bounding box (see
   * pinFromBox). When present it is used as-is and NO placement call is made:
   * the analyzer already localized this concern, and a second model call was
   * both slower and less accurate — it discarded a good box and re-guessed,
   * differently each run. Absent for items with no boxed finding, which still
   * fall back to placement.
   */
  presetPin?: PlacedPin & { source?: PinSource; box?: PhotoBoundingBox };
  /**
   * The photo the preset pin belongs to. A box comes from a specific photo's
   * analysis, so the pin must land on that photo rather than being competed
   * across the gallery.
   */
  presetPhotoUrl?: string;
}

export interface BuildItemAnnotationsOptions {
  /** Minimum placement confidence to draw a pin. Below this → no pin. */
  minConfidence: number;
}

/**
 * Build one PhotoAnnotation per photo (order preserved), placing each item on
 * the single best-confidence photo above the floor. A photo with no items
 * placed on it still returns an entry with an empty pins array so the gallery
 * shows it unannotated rather than dropping it.
 */
export async function buildItemAnnotations(
  items: readonly PlaceItemInput[],
  photos: readonly string[],
  place: PlaceFn,
  opts: BuildItemAnnotationsOptions,
): Promise<PhotoAnnotation[]> {
  const pinsByPhoto = new Map<string, PhotoPin[]>();
  for (const url of photos) pinsByPhoto.set(url, []);

  for (const item of items) {
    // Box-derived pin: deterministic, no model call. Its photo is known, so it
    // is not competed across the gallery.
    if (item.presetPin) {
      const url =
        item.presetPhotoUrl && pinsByPhoto.has(item.presetPhotoUrl)
          ? item.presetPhotoUrl
          : photos[0];
      if (url !== undefined && item.presetPin.confidence >= opts.minConfidence) {
        pinsByPhoto.get(url)!.push({
          x: item.presetPin.x,
          y: item.presetPin.y,
          confidence: item.presetPin.confidence,
          source: item.presetPin.source ?? 'box',
          box: item.presetPin.box,
          label: item.presetPin.label ?? item.title,
          severity: item.severity,
          itemIndex: item.itemIndex,
        });
      }
      continue;
    }

    let best: { photoUrl: string; pin: PhotoPin } | null = null;
    for (const url of photos) {
      const placed = await place(url, { title: item.title, detail: item.detail });
      if (!placed) continue;
      if (placed.confidence < opts.minConfidence) continue;
      if (best && placed.confidence <= best.pin.confidence) continue;
      best = {
        photoUrl: url,
        pin: {
          x: placed.x,
          y: placed.y,
          confidence: placed.confidence,
          source: 'placement',
          label: placed.label ?? item.title,
          severity: item.severity,
          itemIndex: item.itemIndex,
        },
      };
    }
    if (best) pinsByPhoto.get(best.photoUrl)!.push(best.pin);
  }

  return photos.map((url) => ({ photoUrl: url, pins: pinsByPhoto.get(url)! }));
}
