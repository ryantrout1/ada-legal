/**
 * SpotTeaserView — the free read, as much of it as is free.
 *
 * Names the most serious barriers, says plainly how many are being held back,
 * and hands off to the report for the part that actually helps: what each one
 * is, which rule it points to, and how to fix it.
 *
 * Separate component from SpotResultView on purpose. That one still renders
 * the FULL read on the admin free-read detail page, where Ryan and Gina need
 * to see everything the analyzer said. Sharing one component behind a
 * "truncate" prop would put the reviewers one wrong boolean away from being
 * shown a censored version of the thing they are reviewing.
 *
 * Screening language only, and no verdict: a hedged row keeps its
 * verify-on-site note, an empty read says nothing stands out rather than
 * teasing content that does not exist, and an unreadable photo asks for
 * another rather than implying an all-clear.
 */

import { SPOT_SEVERITY_LABEL, SPOT_CLEAR_HEADLINE, SPOT_NO_READ_HEADLINE } from '@/lib/spot/mapSpotFindings';
import type { FreeReadTeaser } from '@/lib/spot/freeReadTeaser';
import { SPOT_FREE_STARTER_DISCLAIMER } from '@/lib/spot/spotDisclaimers';

interface Props {
  teaser: FreeReadTeaser;
  onRetry: () => void;
}

function StarterNote() {
  return (
    <p className="mb-4 rounded-md border border-surface-200 bg-surface-100 px-4 py-2.5 text-xs text-ink-700">
      {SPOT_FREE_STARTER_DISCLAIMER}
    </p>
  );
}

/**
 * The one-line framing above the names.
 *
 * Deliberately built from the counts rather than written by the model: it is
 * the sentence that states how much is being withheld, so it has to be exactly
 * true every time, not however the analyzer felt like phrasing it that run.
 */
function headline(teaser: FreeReadTeaser): string {
  const { totalCount, shown } = teaser;
  if (totalCount === 1) return 'We found one thing worth a closer look in this photo.';
  if (totalCount === shown.length) {
    return `We found ${totalCount} things worth a closer look in this photo.`;
  }
  return `We found ${totalCount} things worth a closer look in this photo. Here are the ${shown.length} that stand out.`;
}

export default function SpotTeaserView({ teaser, onRetry }: Props) {
  if (teaser.kind === 'no_read') {
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

  // Nothing found means nothing withheld — no count, no "unlock the rest".
  if (teaser.kind === 'clear') {
    return (
      <div className="rounded-lg border border-surface-200 bg-surface-100 p-5" aria-live="polite">
        <StarterNote />
        <h2 className="font-display text-xl text-ink-900">{SPOT_CLEAR_HEADLINE}</h2>
        {teaser.scene ? <p className="mt-2 text-ink-900">{teaser.scene}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-surface-200 bg-surface-100 p-5" aria-live="polite">
      <StarterNote />
      <h2 className="font-display text-xl text-ink-900">{headline(teaser)}</h2>

      {teaser.scene ? <p className="mt-2 text-ink-700">{teaser.scene}</p> : null}

      <ul className="mt-4 space-y-2">
        {teaser.shown.map((item, i) => (
          <li
            key={i}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-md border border-surface-200 bg-surface-50 px-3 py-2.5"
          >
            <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-600">
              {SPOT_SEVERITY_LABEL[item.severity]}
            </span>
            <span className="font-display text-base text-ink-900">{item.title}</span>
            {item.hedged ? <span className="text-xs text-ink-500">· worth verifying on-site</span> : null}
          </li>
        ))}
      </ul>

      {teaser.withheldCount > 0 ? (
        <p className="mt-3 text-ink-900">
          <strong className="font-display">
            and {teaser.withheldCount} more {teaser.withheldCount === 1 ? 'thing' : 'things'} we found in this
            photo.
          </strong>{' '}
          The full report names every one, explains what each means, and tells you how to fix it.
        </p>
      ) : (
        <p className="mt-3 text-ink-900">
          The full report explains what each of these means and tells you how to fix it.
        </p>
      )}
    </div>
  );
}
