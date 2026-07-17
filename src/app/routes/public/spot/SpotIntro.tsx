/**
 * SpotIntro — the framing under the capture control on /spot.
 *
 * Most people reach /spot by scanning a QR code on a card, cold, standing
 * outside their own business. They arrive knowing nothing: not who we are,
 * not why we want a photo, not that a paid tier exists, not what happens to
 * the image. Without that, they either bounce or upload blind and meet the
 * price as a surprise. This block is the answer to all of it, in the order a
 * stranger asks: what is this → what happens → what's free → what it isn't →
 * who's asking → what about my photo.
 *
 * Deliberately rendered BELOW the camera control, not above it. The hero
 * carries the whole promise in two sentences; someone who just wants to shoot
 * a photo shouldn't have to scroll past a wall of pitch to reach the button.
 * This is for the person who scrolls.
 *
 * The limits section is not fine print and is not styled as such. "We can't
 * certify compliance and won't call anything a violation" is the honest shape
 * of the product, and saying it plainly is what makes the free read worth
 * trusting.
 *
 * Retention copy reads SPOT_PHOTO_RETENTION_DAYS rather than restating it, so
 * the promise on the page can't drift from the policy the sweeper enforces.
 *
 * AAA: semantic headings/lists, tokens only (theme-aware across light / dark /
 * warm / contrast), no target smaller than 44px. Copy pending Gina's review.
 */

import { SPOT_PHOTO_RETENTION_DAYS } from '@/lib/spot/retention';
import { SPOT_DEFAULT_MAX_PHOTOS, SPOT_DEFAULT_PRICE_USD } from '@/lib/spot/spotOffer';

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: 'Take one photo.',
    body: 'Stand back far enough to get the door, the threshold, and the path up to it.',
  },
  {
    title: 'Get a free read.',
    body: 'We name what stands out — a step at the door, a narrow approach, a hard-to-grab handle — and how serious each one looks.',
  },
  {
    title: 'Go deeper if you want.',
    body: 'Add photos from a few more angles and we build the full report: what each finding means, which rule it points to, and plain-language guidance on what to do about it.',
  },
];

const LIMITS: string[] = [
  'We can’t certify that anything is compliant, and we won’t tell you something is a violation. Only a person on site with the right measurements can do that.',
  'A clean read isn’t a clean bill of health. It means nothing stood out in that photo.',
  'This isn’t legal advice, and we’re not your lawyer.',
];

export default function SpotIntro() {
  return (
    <div className="mt-10 space-y-8">
      <section aria-labelledby="spot-how-h">
        <h2 id="spot-how-h" className="font-display text-2xl text-ink-900">
          How this works
        </h2>
        <ol className="mt-4 space-y-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent-50 font-display text-lg text-accent-600"
              >
                {i + 1}
              </span>
              <p className="text-ink-900">
                <strong className="font-semibold">{step.title}</strong>{' '}
                <span className="text-ink-700">{step.body}</span>
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="spot-tiers-h">
        <h2 id="spot-tiers-h" className="font-display text-2xl text-ink-900">
          What you get
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-surface-200 bg-surface-100 p-4">
            <h3 className="font-display text-lg text-ink-900">Free — one photo</h3>
            <p className="mt-2 text-ink-700">
              What we notice, and how serious it looks. Enough to know whether you have something
              to look at.
            </p>
          </div>
          <div className="rounded-lg border border-surface-200 bg-surface-100 p-4">
            <h3 className="font-display text-lg text-ink-900">
              Full report — up to {SPOT_DEFAULT_MAX_PHOTOS} angles, ${SPOT_DEFAULT_PRICE_USD}
            </h3>
            <p className="mt-2 text-ink-700">
              One entrance, photographed from several sides and read together. What each finding
              is, why it matters, and how it’s usually fixed. Yours to keep and hand to a
              contractor.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="spot-limits-h">
        <h2 id="spot-limits-h" className="font-display text-2xl text-ink-900">
          What this is — and what it isn’t
        </h2>
        <p className="mt-3 text-ink-900">
          Spot is a screening tool. It’s a fast set of eyes, not a tape measure.
        </p>
        <ul className="mt-3 space-y-2">
          {LIMITS.map((limit) => (
            <li key={limit} className="flex gap-3 text-ink-700">
              <span aria-hidden="true" className="flex-none text-accent-600">
                •
              </span>
              <span>{limit}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-ink-900">
          What it <em>is</em>: the fastest honest answer to “should I be worried about my front
          door?”
        </p>
      </section>

      <section aria-labelledby="spot-who-h">
        <h2 id="spot-who-h" className="font-display text-2xl text-ink-900">
          Who we are
        </h2>
        <p className="mt-3 text-ink-700">
          ADA Legal Link. We spend our days on the other side of this — with people who couldn’t
          get into a business, and with the attorneys they end up calling. We built Spot because
          most of what we see isn’t malice. It’s a step nobody measured and a door nobody thought
          about. Easier to find it now.
        </p>
      </section>

      <section aria-labelledby="spot-photo-h">
        <h2 id="spot-photo-h" className="font-display text-2xl text-ink-900">
          Your photo
        </h2>
        <p className="mt-3 text-ink-700">
          Uploaded photos are deleted automatically after {SPOT_PHOTO_RETENTION_DAYS} days. The
          read we generate is kept separately, so you can come back to it after the photo is gone.
          Full details in our{' '}
          <a
            href="/privacy"
            className="text-accent-600 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
          >
            Privacy Policy
          </a>
          .
        </p>
      </section>
    </div>
  );
}
