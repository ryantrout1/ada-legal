/**
 * ReviewLayout — the shell for the public /review pages.
 *
 * Mounted OUTSIDE PublicLayout (no nav, no footer, no Clerk) so the page is
 * one focused task — the same standalone discipline as /photo.
 *
 * Identity gate: before any photo is shown, the reviewer taps their name
 * once (big targets, no typing). The choice is remembered on the device, so
 * they never tap it again; a "Switch" control clears it. The picked name is
 * handed to the child routes via the router outlet context.
 *
 * Accessibility (Gina is quad; Peter close to it):
 *   - Identity choices and primary actions are large tap targets
 *     (min 56–64px) with generous spacing — knuckle/finger friendly.
 *   - Full keyboard focus rings; aria-pressed on the picker buttons.
 */

import { Helmet } from 'react-helmet-async';
import { Outlet, useOutletContext } from 'react-router-dom';
import { useReviewerIdentity } from './useReviewerIdentity.js';
import {
  PHOTO_REVIEWERS,
  type PhotoReviewer,
} from '../../../types/reviewers.js';

export interface ReviewContext {
  reviewer: PhotoReviewer;
  switchReviewer: () => void;
}

/** Child routes read the active reviewer + a switch action from here. */
export function useReviewContext(): ReviewContext {
  return useOutletContext<ReviewContext>();
}

export default function ReviewLayout() {
  const { reviewer, ready, setReviewer, clearReviewer } = useReviewerIdentity();

  return (
    <>
      <Helmet>
        <title>Photo review — ADA Legal Link</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <main className="min-h-screen bg-surface-50 text-ink-900 font-body">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
          <header className="mb-6">
            <h1 className="font-display text-2xl text-ink-900">
              ADA Legal Link — Photo review
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              Help us check how accurately Ada reads accessibility barriers.
            </p>
          </header>

          {!ready ? null : !reviewer ? (
            <ReviewerPicker onPick={setReviewer} />
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between rounded-md border border-surface-200 bg-surface-100 px-4 py-3">
                <span className="text-base text-ink-900">
                  Reviewing as <span className="font-semibold">{reviewer}</span>
                </span>
                <button
                  type="button"
                  onClick={clearReviewer}
                  className="min-h-[44px] rounded-md px-3 text-base text-accent-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                >
                  Switch
                </button>
              </div>
              <Outlet
                context={
                  { reviewer, switchReviewer: clearReviewer } satisfies ReviewContext
                }
              />
            </>
          )}
        </div>
      </main>
    </>
  );
}

function ReviewerPicker({ onPick }: { onPick: (name: PhotoReviewer) => void }) {
  return (
    <section aria-labelledby="who-heading">
      <h2 id="who-heading" className="mb-4 font-display text-xl text-ink-900">
        Who's reviewing?
      </h2>
      <div className="space-y-3">
        {PHOTO_REVIEWERS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onPick(name)}
            className="block w-full min-h-[64px] rounded-md bg-accent-500 px-4 text-xl font-display text-surface-50 transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
          >
            I'm {name}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-ink-500">
        We'll remember this on your device so you only pick once.
      </p>
    </section>
  );
}
