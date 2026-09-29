/**
 * Ada Spot: number the free read's markers to match its list (pure).
 *
 * The free read names up to three barriers. Each one the analyzer boxed gets
 * a marker on the photo; the marker and its row share a number, counted in
 * list order and skipping rows with no marker, the same way the paid report
 * numbers its pins (pinNumbering).
 *
 * Every pin is box-derived, so it renders as an approximate halo, never a
 * precise dot (pinConfidenceTier). Confidence is not sent to the browser and
 * plays no part for a box pin, so it is fixed at 1 here.
 */

import type { FreeReadTeaser } from './freeReadTeaser.js';
import type { NumberedPin } from './pinNumbering.js';

export interface TeaserPins {
  /** Markers to draw on the photo, numbered 1..n. */
  pins: NumberedPin[];
  /** Per shown row: its marker number, or null when it has no marker. */
  numberForRow: (number | null)[];
}

export function teaserPins(teaser: FreeReadTeaser): TeaserPins {
  const pins: NumberedPin[] = [];
  const numberForRow = teaser.shown.map((row, itemIndex) => {
    if (!row.pin) return null;
    const number = pins.length + 1;
    pins.push({
      x: row.pin.x,
      y: row.pin.y,
      box: row.pin.box,
      confidence: 1,
      source: 'box',
      label: row.title,
      severity: row.severity,
      itemIndex,
      number,
    });
    return number;
  });
  return { pins, numberForRow };
}
