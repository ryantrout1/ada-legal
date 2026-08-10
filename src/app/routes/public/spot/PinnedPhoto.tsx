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
 * `honestConfidence` (default off) is the honesty guardrail from /plan phase 2:
 * when on, a pin the model placed with only medium confidence
 * (pinConfidenceTier → 'approximate') draws a larger dashed halo — "around
 * here" — instead of a precise dot, and the caption says "(approximate)". A
 * marker never claims a certainty the placement didn't have. The buyer report
 * leaves it off and is unchanged; /photo turns it on.
 *
 * Rendered for every gallery photo; with no pins it is just the photo, visually
 * identical to the plain gallery image.
 */

import type { NumberedPin } from '@/lib/spot/pinNumbering';
import { assignMarkerOffsets } from '@/lib/spot/markerOffsets';
import { pinConfidenceTier } from '@/lib/spot/pinConfidenceTier';

export function PinnedPhoto({
  url,
  index,
  total,
  pins,
  honestConfidence = false,
}: {
  url: string;
  index: number;
  total: number;
  pins: NumberedPin[];
  /** When true, medium-confidence pins render as approximate halos. */
  honestConfidence?: boolean;
}) {
  const offsets = assignMarkerOffsets(pins);
  const isApprox = (p: NumberedPin) =>
    honestConfidence && pinConfidenceTier(p.confidence, { source: p.source }) === 'approximate';
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
          const dy = offsets[i];
          // Approximate: a larger dashed halo centred on the point says "around
          // here", not "exactly here". The solid dark-accent number badge on
          // white (7:1) plus the dashed ring (dark accent + white outline,
          // >=3:1 non-text) stay AAA-legible on any photo backdrop.
          if (isApprox(p)) {
            return (
              <span
                key={i}
                aria-hidden="true"
                className="absolute"
                style={{
                  left: `${p.x * 100}%`,
                  top: `${p.y * 100}%`,
                  transform: `translate(-50%, calc(-50% + ${dy}px))`,
                }}
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                  style={{
                    border: '2px dashed #9C340A',
                    outline: '2px solid rgba(255,255,255,0.85)',
                    backgroundColor: 'rgba(156,52,10,0.12)',
                  }}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#9C340A] text-[11px] font-semibold leading-none text-white shadow">
                    {p.number}
                  </span>
                </span>
              </span>
            );
          }
          // Precise pin. Flip the label left near the right edge so it doesn't
          // run off the photo; keep the on-photo pill compact (full label lives
          // in the caption).
          const labelLeft = p.x > 0.6;
          const short = p.label.length > 24 ? `${p.label.slice(0, 23).trimEnd()}…` : p.label;
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
          {pins
            .map(
              (p) =>
                `${p.number}. ${p.label} (${p.severity})${isApprox(p) ? ' — approximate' : ''}`,
            )
            .join('; ')}
        </figcaption>
      ) : null}
    </figure>
  );
}
