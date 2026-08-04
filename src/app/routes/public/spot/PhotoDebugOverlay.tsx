/**
 * PhotoDebugOverlay — /photo?debug=1 only. Draws both placement methods over the
 * photo so the accurate one is chosen from real photos, not guessed.
 *
 * Per confirmable finding it renders three things at once:
 *   - the analyzer's raw bounding box, as a dashed blue rectangle;
 *   - that box's CENTER, a solid blue dot — the point the harness currently
 *     ships (annotationsFromBoxes);
 *   - a fresh single-finding re-placement point, a solid orange dot.
 *
 * Each dot carries a tiny "N box" / "N place" tag so a finding's two candidate
 * points are readable together. A legend and a per-finding readout of the raw
 * coordinates sit below. This is a diagnostic surface — no accessibility caption
 * layer, no theming; it never ships to a claimant or the buyer report.
 */

import { useState, type MouseEvent as ReactMouseEvent } from 'react';
import type { DebugFindingPlacement } from '@/lib/spot/debugPlacement';

const BOX_COLOR = '#2563EB'; // analyzer box + its center
const PLACE_COLOR = '#EA580C'; // full-frame re-placement point
const CROP_COLOR = '#16A34A'; // crop-guided placement point

function Dot({
  x,
  y,
  color,
  tag,
}: {
  x: number;
  y: number;
  color: string;
  tag: string;
}) {
  const labelLeft = x > 0.7;
  return (
    <span
      aria-hidden="true"
      className="absolute flex items-center gap-1"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: `translate(${labelLeft ? '-100%' : '0'}, -50%)`,
        flexDirection: labelLeft ? 'row-reverse' : 'row',
      }}
    >
      <span
        className="block rounded-full ring-2 ring-white"
        style={{ width: 12, height: 12, backgroundColor: color }}
      />
      <span
        className="whitespace-nowrap rounded px-1 text-[11px] font-medium text-white"
        style={{ backgroundColor: color }}
      >
        {tag}
      </span>
    </span>
  );
}

function fmt(p: { x: number; y: number } | null): string {
  return p ? `${p.x.toFixed(2)}, ${p.y.toFixed(2)}` : '—';
}

export function PhotoDebugOverlay({
  url,
  findings,
}: {
  url: string;
  findings: DebugFindingPlacement[];
}) {
  // Ground-truth capture (/plan analyzer-grounding phase 1): click the actual
  // concern in the photo to read off its normalized coordinates, which go into
  // a boxAccuracy fixture. Clicking is the cheapest honest way to get a truth
  // point — the alternative is eyeballing "better", which has already misled
  // us three times on this photo.
  const [truth, setTruth] = useState<{ x: number; y: number } | null>(null);

  const capture = (e: ReactMouseEvent<HTMLImageElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const x = Math.round(((e.clientX - r.left) / r.width) * 1000) / 1000;
    const y = Math.round(((e.clientY - r.top) / r.height) * 1000) / 1000;
    setTruth({ x, y });
  };

  return (
    <figure className="m-0">
      <div className="relative">
        <img
          src={url}
          alt="Field-test photo with placement debug overlay"
          className="block w-full rounded-lg border border-surface-200"
          onClick={capture}
        />

        {truth && (
          <span
            aria-hidden="true"
            className="absolute"
            style={{
              left: `${truth.x * 100}%`,
              top: `${truth.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="block h-4 w-4 rounded-full border-2 border-white bg-black shadow" />
          </span>
        )}

        {findings.map((f, i) => {
          const n = i + 1;
          return (
            <span key={i}>
              {f.box && (
                <span
                  aria-hidden="true"
                  className="absolute border-2 border-dashed"
                  style={{
                    left: `${f.box.x * 100}%`,
                    top: `${f.box.y * 100}%`,
                    width: `${f.box.w * 100}%`,
                    height: `${f.box.h * 100}%`,
                    borderColor: BOX_COLOR,
                  }}
                />
              )}
              {f.boxCenter && (
                <Dot x={f.boxCenter.x} y={f.boxCenter.y} color={BOX_COLOR} tag={`${n} box`} />
              )}
              {f.placement && (
                <Dot x={f.placement.x} y={f.placement.y} color={PLACE_COLOR} tag={`${n} place`} />
              )}
              {f.cropPlacement && (
                <Dot x={f.cropPlacement.x} y={f.cropPlacement.y} color={CROP_COLOR} tag={`${n} crop`} />
              )}
            </span>
          );
        })}
      </div>

      <figcaption className="mt-3 text-sm text-ink-700">
        <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: BOX_COLOR }} />
            analyzer box + center (shipping now)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: PLACE_COLOR }} />
            re-placement, full frame
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: CROP_COLOR }} />
            crop-guided placement
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-black" />
            {truth
              ? `ground truth — click again to move: {"x": ${truth.x}, "y": ${truth.y}}`
              : 'click the photo on the real concern to capture ground truth'}
          </span>
        </div>
        <ol className="m-0 list-none space-y-1 p-0">
          {findings.map((f, i) => (
            <li key={i} className="tabular-nums">
              <span className="font-medium text-ink-900">{i + 1}.</span> {f.title}{' '}
              <span className="text-ink-500">
                — box {fmt(f.boxCenter)} · place {fmt(f.placement)} · crop {fmt(f.cropPlacement)}
                {f.cropPlacement ? ` (conf ${f.cropPlacement.confidence.toFixed(2)})` : ''}
              </span>
            </li>
          ))}
        </ol>
      </figcaption>
    </figure>
  );
}
