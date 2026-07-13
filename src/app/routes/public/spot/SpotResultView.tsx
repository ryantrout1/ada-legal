/**
 * SpotResultView — renders the free-read result (Ada Spot 1b).
 *
 * Screening language only. Hedged (confirmable:false) findings render with a
 * "verify on-site" note. Absence-honesty: a model that couldn't read the
 * photos shows a retry prompt, not an all-clear.
 */

import {
  SPOT_SEVERITY_LABEL,
  SPOT_HEDGE_NOTE,
  SPOT_CLEAR_HEADLINE,
  SPOT_NO_READ_HEADLINE,
  type SpotResultView as SpotResultViewModel,
} from '@/lib/spot/mapSpotFindings';
import { SPOT_FREE_STARTER_DISCLAIMER } from '@/lib/spot/spotDisclaimers';

interface Props {
  view: SpotResultViewModel;
  onRetry: () => void;
}

function StarterNote() {
  return (
    <p className="mb-4 rounded-md border border-surface-200 bg-surface-100 px-4 py-2.5 text-xs text-ink-700">
      {SPOT_FREE_STARTER_DISCLAIMER}
    </p>
  );
}

function Positives({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-6" aria-labelledby="spot-positives-h">
      <h3 id="spot-positives-h" className="font-display text-base text-ink-900">
        What looks good
      </h3>
      <ul className="mt-2 space-y-1">
        {items.map((p, i) => (
          <li key={i} className="text-sm text-ink-700">
            {p}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function SpotResultView({ view, onRetry }: Props) {
  if (view.kind === 'no_read') {
    return (
      <div className="rounded-lg border border-surface-200 bg-surface-100 p-5" aria-live="polite">
        <h2 className="font-display text-xl text-ink-900">{SPOT_NO_READ_HEADLINE}</h2>
        <p className="mt-2 text-sm text-ink-700">
          A clearer, straight-on photo in better light usually does the trick.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex min-h-[44px] items-center rounded-md border-2 border-accent-500 px-4 py-2 font-display text-accent-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
        >
          Try different photos
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-surface-200 bg-surface-100 p-5" aria-live="polite">
      <StarterNote />
      <h2 className="font-display text-xl text-ink-900">
        {view.kind === 'clear' ? SPOT_CLEAR_HEADLINE : 'What these photos show'}
      </h2>

      {view.scene ? <p className="mt-2 text-sm text-ink-700">{view.scene}</p> : null}
      {view.summary ? <p className="mt-2 text-ink-900">{view.summary}</p> : null}

      {view.items.length > 0 ? (
        <ul className="mt-4 space-y-4">
          {view.items.map((item, i) => (
            <li key={i} className="rounded-md border border-surface-200 bg-surface-50 p-4">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-600">
                  {SPOT_SEVERITY_LABEL[item.severity]}
                </span>
                <span className="font-display text-base text-ink-900">{item.title}</span>
              </div>
              <p className="mt-2 text-sm text-ink-700">{item.body}</p>
              {item.hedged ? (
                <p className="mt-2 text-sm text-ink-500">{SPOT_HEDGE_NOTE}</p>
              ) : null}
              {item.citedSection ? (
                <p className="mt-2 text-xs text-ink-500">Related standard: {item.citedSection}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <Positives items={view.positives} />

      <p className="mt-6 text-xs text-ink-500">
        This is an automated screening from your photos — a starting point, not a professional
        inspection or a legal determination.
      </p>
    </div>
  );
}
