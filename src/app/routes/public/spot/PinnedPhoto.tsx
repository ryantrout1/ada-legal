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
 * Rendered for every gallery photo; with no pins it is just the photo, visually
 * identical to the plain gallery image.
 */

import type { PhotoPin } from '@/lib/spot/annotationTypes';

export function PinnedPhoto({
  url,
  index,
  total,
  pins,
}: {
  url: string;
  index: number;
  total: number;
  pins: PhotoPin[];
}) {
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
          // Flip the label to the left of the dot near the right edge so it
          // doesn't run off the photo.
          const labelLeft = p.x > 0.6;
          return (
            <span
              key={i}
              aria-hidden="true"
              style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
              className={`absolute flex -translate-y-1/2 items-center gap-1.5 ${
                labelLeft ? '-translate-x-full flex-row-reverse' : ''
              }`}
            >
              <span className="h-4 w-4 flex-none rounded-full border-2 border-[color:var(--page-bg)] bg-accent-600 shadow" />
              <span className="whitespace-nowrap rounded-md bg-accent-600 px-2 py-0.5 text-xs font-semibold text-[color:var(--page-bg)] shadow">
                {p.label}
              </span>
            </span>
          );
        })}
      </div>
      {pins.length > 0 ? (
        <figcaption className="mt-2 text-sm text-ink-700">
          <span className="font-medium">Marked on this photo:</span>{' '}
          {pins.map((p) => `${p.label} (${p.severity})`).join('; ')}
        </figcaption>
      ) : null}
    </figure>
  );
}
