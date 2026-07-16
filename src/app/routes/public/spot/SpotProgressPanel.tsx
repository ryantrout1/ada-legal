/**
 * SpotProgressPanel — the free read as it streams in (Ada Spot).
 *
 * Renders the partial view from mapSpotProgress while the analyzer is still
 * generating. Same visual language as SpotResultView so the panel doesn't
 * "jump" when the real result replaces it.
 *
 * Two rules this component exists to respect:
 *   - No verdict. SpotProgressView has no `kind` and no `overallRisk` by
 *     construction, so there is nothing here to render an all-clear from.
 *     The headline is descriptive ("What we're seeing so far"), never a
 *     conclusion, and the starter disclaimer is up top from the first paint.
 *   - Accessibility: this region is aria-live="off" on purpose. Scene,
 *     summary and each finding land separately, so announcing every change
 *     would machine-gun a screen reader. The calm status channel is
 *     SpotReadProgress (a handful of coarse stages, aria-live="polite"),
 *     which stays mounted alongside this; the finished result announces
 *     once via SpotResultView. aria-busy marks the region as in-flight.
 */

import { SPOT_SEVERITY_LABEL } from '@/lib/spot/mapSpotFindings';
import type { SpotProgressView } from '@/lib/spot/mapSpotProgress';
import { SPOT_FREE_STARTER_DISCLAIMER } from '@/lib/spot/spotDisclaimers';

interface Props {
  view: SpotProgressView;
}

export default function SpotProgressPanel({ view }: Props) {
  const hasAnything =
    Boolean(view.scene) || Boolean(view.summary) || view.items.length > 0 || view.positives.length > 0;
  if (!hasAnything) return null;

  return (
    <div
      className="rounded-lg border border-surface-200 bg-surface-100 p-5"
      aria-live="off"
      aria-busy="true"
    >
      <p className="mb-4 rounded-md border border-surface-200 bg-surface-50 px-4 py-2.5 text-xs text-ink-700">
        {SPOT_FREE_STARTER_DISCLAIMER}
      </p>

      <h2 className="font-display text-xl text-ink-900">What we&rsquo;re seeing so far</h2>

      {view.scene ? <p className="mt-2 text-ink-900">{view.scene}</p> : null}
      {view.summary ? <p className="mt-2 text-ink-900">{view.summary}</p> : null}

      {view.items.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {view.items.map((item, i) => (
            <li
              key={i}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-md border border-surface-200 bg-surface-50 px-3 py-2.5"
            >
              <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-600">
                {SPOT_SEVERITY_LABEL[item.severity]}
              </span>
              <span className="font-display text-base text-ink-900">{item.title}</span>
              {item.hedged ? (
                <span className="text-xs text-ink-500">&middot; worth verifying on-site</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {view.positives.length > 0 ? (
        <section className="mt-6">
          <h3 className="font-display text-base text-ink-900">What looks good</h3>
          <ul className="mt-2 space-y-1">
            {view.positives.map((p, i) => (
              <li key={i} className="text-sm text-ink-700">
                {p}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
