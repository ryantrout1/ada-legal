/**
 * SpotIntro — the page under the camera on /spot.
 *
 * Most people reach /spot by scanning a QR card, cold, standing outside their
 * own business. They arrive knowing nothing: not who we are, not why we want a
 * photo, not that a paid tier exists, not what happens to the image.
 *
 * This block answers that in the order a stranger asks — how it works → what
 * you can point it at → free vs paid → what it isn't → who's asking → your
 * photo. It sits BELOW the camera on purpose: someone who just wants to shoot
 * shouldn't scroll past a pitch to reach the button. This is for the scroller.
 *
 * ── Voice ──────────────────────────────────────────────────────────────────
 * Spot's belief: nobody meant to build a barrier; it's there anyway. That
 * split — intent from effect — is the whole point of the ADA and the only way
 * an owner hears this without going defensive. So Spot reports the world, not
 * the person ("there's a lip at the door", never "you failed to"), names the
 * effect ("someone in a chair stops here"), and says where its sight ends
 * flatly, without apology.
 *
 * Never: violation · non-compliant · illegal · liable · lawsuit · emoji ·
 * exclamation marks · fear-selling. That last one is load-bearing — ADALL
 * exists partly BECAUSE of drive-by ADA shakedowns, and a voice that frightens
 * people into the $79 report would poison the thing Gina and Kelley are
 * building. The limits section is not fine print and is not styled as such:
 * "we can't certify compliance and won't call anything a violation" is the
 * honest shape of the product, and saying it plainly is what earns the read.
 *
 * ── Honesty constraints ────────────────────────────────────────────────────
 * Every fixture named in "What you can point it at" maps to a photo_assessable
 * row in src/lib/adaCatalog.ts — the same catalog renderCatalogForPrompt()
 * hands the analyzer. Nothing is listed that the analyzer has no rules for; on
 * the one page whose entire pitch is honesty, an aspirational list is a lie.
 * Written as prose, not a card grid: an inventory table is the most static
 * thing a page can do, and the breadth is the point, not the taxonomy.
 *
 * "If it can't tell, it says so" is backed by the analyzer's hedge-don't-drop
 * rule (confirmable: false → "verify on site"), not aspiration.
 *
 * Retention copy reads SPOT_PHOTO_RETENTION_DAYS rather than restating it, so
 * the page can't drift from the policy the sweeper enforces.
 *
 * AAA: semantic headings/lists, tokens only (theme-aware across light / dark /
 * warm / contrast), no target under 44px. Copy pending Gina's review.
 */

import { SPOT_PHOTO_RETENTION_DAYS } from '@/lib/spot/retention';
import { SPOT_DEFAULT_MAX_PHOTOS, SPOT_DEFAULT_PRICE_USD } from '@/lib/spot/spotOffer';

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: 'Take one photo.',
    body: 'Point it at whatever you’re wondering about. Stand back far enough to show the space around it — a lot of what matters is the room to approach, reach and turn.',
  },
  {
    title: 'Get a free read.',
    body: 'We name what stands out — a lip at the door, a ramp pitched too steep, a grab bar on the wrong wall, a counter too high to reach sitting down — and how serious each one looks.',
  },
  {
    title: 'Go deeper if you want.',
    body: 'Add a few more angles of that same spot and we build the full report: what each finding means, which rule it points to, and what people usually do about it.',
  },
];

const LIMITS: string[] = [
  'We can’t certify that anything is compliant, and we won’t tell you something is a violation. That takes a person on site with a tape measure.',
  'A clean read isn’t a clean bill of health. It means nothing stood out in that photo.',
  'This isn’t legal advice, and we’re not your lawyer.',
];

export default function SpotIntro() {
  return (
    <div className="mt-10 space-y-8">
      <section aria-labelledby="spot-how-h">
        <h2 id="spot-how-h" className="font-display text-2xl font-extrabold text-ink-900">
          How this works
        </h2>
        <ol className="mt-4 space-y-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent-50 font-display text-lg font-bold text-accent-600"
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

      <section aria-labelledby="spot-scope-h">
        <h2 id="spot-scope-h" className="font-display text-2xl font-extrabold text-ink-900">
          What you can point it at
        </h2>
        <p className="mt-3 text-ink-700">
          Point it at the parking space, the curb ramp, the walk up to the door. The door itself —
          the lip, the width, the handle. The restroom, the grab bar, the sink. The counter you
          order at, the table you’d sit at.
        </p>
        <p className="mt-3 text-lg text-ink-900">A barrier is wherever someone hits it.</p>
        <p className="mt-3 text-ink-700">
          Spot reads your photo against the 2010 ADA Standards and only speaks to what’s actually
          in the frame. It won’t flag something that isn’t in the picture — and when it can’t tell
          from the angle you gave it, it says so instead of guessing.
        </p>
      </section>

      <section aria-labelledby="spot-tiers-h">
        <h2 id="spot-tiers-h" className="font-display text-2xl font-extrabold text-ink-900">
          What you get
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-surface-200 bg-surface-100 p-4">
            <h3 className="font-display text-lg font-bold text-ink-900">Free — one photo</h3>
            <p className="mt-2 text-ink-700">
              What stands out, and how serious it looks. Enough to know whether you’ve got
              something to look at.
            </p>
          </div>
          <div className="rounded-lg border border-surface-200 bg-surface-100 p-4">
            <h3 className="font-display text-lg font-bold text-ink-900">
              Full report — up to {SPOT_DEFAULT_MAX_PHOTOS} angles, ${SPOT_DEFAULT_PRICE_USD}
            </h3>
            <p className="mt-2 text-ink-700">
              One spot, photographed from several sides and read together. What each finding is,
              why it matters, and what people usually do about it. Yours to keep and hand to a
              contractor.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="spot-limits-h">
        <h2 id="spot-limits-h" className="font-display text-2xl font-extrabold text-ink-900">
          What this is — and what it isn’t
        </h2>
        <p className="mt-3 text-ink-900">
          Spot is a screening tool. A fast set of eyes, not a tape measure.
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
          What it <em>is</em>: the fastest honest answer to “should I be worried about this?”
        </p>
      </section>

      <section aria-labelledby="spot-who-h">
        <h2 id="spot-who-h" className="font-display text-2xl font-extrabold text-ink-900">
          Who we are
        </h2>
        <p className="mt-3 text-ink-700">
          ADA Legal Link. We spend our days on the other side of this — with the people who turned
          around and left, and with the attorneys they eventually called. Almost none of it is
          malice. It’s a step nobody measured. A door nobody thought about. Nobody meant to build a
          barrier; it’s there anyway. Easier to find it yourself, now, than to hear about it later
          from someone else.
        </p>
      </section>

      <section aria-labelledby="spot-photo-h">
        <h2 id="spot-photo-h" className="font-display text-2xl font-extrabold text-ink-900">
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
