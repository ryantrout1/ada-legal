/**
 * PinnedPhoto — a screened photo with numbered location markers.
 *
 * The markers are decorative (aria-hidden): the caption beneath carries the
 * same numbered list as text, so a screen-reader user gets every pin's label
 * and severity without the visual layer, and the photo keeps its own alt text.
 * Markers are a uniform accent badge — identity is the number, severity lives
 * in the caption text. No colour carries meaning on its own, and no red: this
 * product never returns a verdict, and a red pin would read as one.
 *
 * `showRegions` (default off) is the honesty guardrail from /plan Phase 1: when
 * on, a pin whose source box is loose (pinShape → 'region') draws a translucent
 * outlined area over that box instead of a precise dot, so a marker never claims
 * a certainty the analyzer didn't have. The buyer report leaves it off and is
 * unchanged. A region still carries its number badge and the same caption text.
 *
 * Rendered for every gallery photo; with no pins it is just the photo, visually
 * identical to the plain gallery image.
 */

import type { NumberedPin } from '@/lib/spot/pinNumbering';
import { assignMarkerOffsets } from '@/lib/spot/markerOffsets';
import { pinShape } from '@/lib/spot/pinShape';

export function PinnedPhoto({
  url,
  index,
  total,
  pins,
  showRegions = false,
}: {
  url: string;
  index: number;
  total: number;
  pins: NumberedPin[];
  /** When true, loose-box pins render as translucent regions (see pinShape). */
  showRegions?: boolean;
}) {
  const offsets = assignMarkerOffsets(pins);
  return (
    <figure className="m-0">
      <div className="relative">
        <img
          src={url}
          alt={`Photo ${index + 1} of ${total} screened in this report`}
          className="block w-full rounded-lg border border-surface-200"
          loading="lazy"
        />
        {pins.map((p, i) => {
          const asRegion = showRegions && p.box ? pinShape(p.box) === 'region' : false;
          // Region: outline the box. The solid dark-accent border plus a white
          // outline carries the >=3:1 non-text contrast on any photo backdrop,
          // not the faint fill — so it stays AAA-legible without depending on
          // what's behind it.
          if (asRegion && p.box) {
            return (
              <span
                key={i}
                aria-hidden="true"
                className="absolute rounded-md"
                style={{
                  left: `${p.box.x * 100}%`,
                  top: `${p.box.y * 100}%`,
                  width: `${p.box.w * 100}%`,
                  height: `${p.box.h * 100}%`,
                  border: '2px solid #9C340A',
                  outline: '2px solid rgba(255,255,255,0.9)',
                  backgroundColor: 'rgba(156,52,10,0.14)',
                }}
              >
                <span className="absolute left-0 top-0 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[#9C340A] text-[11px] font-semibold leading-none text-white shadow">
                  {p.number}
                </span>
              </span>
            );
          }
          // Flip the label to the left of the dot near the right edge so it
          // doesn't run off the photo.
          const labelLeft = p.x > 0.6;
          // Keep the on-photo pill compact whatever the label length; the full
          // label lives in the caption below.
          const short = p.label.length > 24 ? `${p.label.slice(0, 23).trimEnd()}…` : p.label;
          // Stack markers that land close together so their pills don't overlap.
          const dy = offsets[i];
          return (
            <span
              key={i}
              aria-hidden="true"
              style={{
                left: `${p.x * 100}%`,
                top: `${p.y * 100}%`,
                transform: `translate(${labelLeft ? '-100%' : '0'}, calc(-50% + ${dy}px))`,
              }}
              className={`absolute flex items-center gap-1.5 ${labelLeft ? 'flex-row-reverse' : ''}`}
            >
              {/* Fixed colours on purpose: this sits on a photo, which does not
                  follow the page theme. The dark pill and the accent number badge
                  (white numeral on the darkest accent shade, 7:1) stay legible on
                  any background. */}
              <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 border-white bg-[#9C340A] text-[11px] font-semibold leading-none text-white shadow">
                {p.number}
              </span>
              <span className="whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs font-semibold text-white shadow">
                {short}
              </span>
            </span>
          );
        })}
      </div>
      {pins.length > 0 ? (
        <figcaption className="mt-2 text-sm text-ink-700">
          <span className="font-medium">Marked on this photo:</span>{' '}
          {pins.map((p) => `${p.number}. ${p.label} (${p.severity})`).join('; ')}
        </figcaption>
      ) : null}
    </figure>
  );
}
