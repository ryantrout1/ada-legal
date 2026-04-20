/**
 * Home — the public entry point.
 *
 * What someone landing here needs to understand in 5 seconds:
 *   1. What is this? A free ADA help service.
 *   2. Is it trustworthy? (Not a law firm. Not a marketplace. Not selling leads.)
 *   3. What do I do next? Talk to Ada.
 *
 * Design hierarchy:
 *   - One dominant headline, Fraunces serif, intentionally large
 *   - Subhead explaining the offer in plain words
 *   - Primary CTA button (terracotta) leading to /chat
 *   - Three side-by-side cards explaining HOW Ada helps
 *   - Reading-level note: we meet users where they are
 *   - Trust row: 'free forever', 'not a law firm', 'fully accessible'
 *
 * No hero image. No testimonial carousel. No stock photography of
 * disabled people — the field is saturated with exactly that and it
 * often feels tokenizing. Typographic emphasis does the work instead.
 *
 * Ref: docs/ARCHITECTURE.md §11
 */

import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-16 pb-12 sm:pt-24 sm:pb-20">
        <p className="font-mono text-xs sm:text-sm uppercase tracking-[0.18em] text-accent-500 mb-5">
          Americans with Disabilities Act
        </p>
        <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-ink-900 max-w-4xl">
          Know the law.
          <br />
          <span className="italic text-accent-600">Know your rights.</span>
        </h1>
        <p className="mt-8 text-lg sm:text-xl text-ink-700 max-w-2xl leading-relaxed">
          Free, plain-language help understanding the ADA and what to do when
          your rights haven't been respected. Ada is a guide, not a gatekeeper —
          ask anything.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-medium px-6 py-3.5 rounded-md transition-colors"
          >
            Talk to Ada
            <span aria-hidden="true">→</span>
          </Link>
          <a
            href="#how-it-works"
            className="text-ink-700 hover:text-accent-600 underline underline-offset-4 decoration-1 px-2 py-2 transition-colors"
          >
            How it works
          </a>
        </div>
      </section>

      {/* Divider — intentional visual pause before the details */}
      <div
        aria-hidden="true"
        className="max-w-5xl mx-auto px-5 sm:px-8"
      >
        <div className="border-t border-surface-200" />
      </div>

      {/* How it works — three steps */}
      <section
        id="how-it-works"
        className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-20"
      >
        <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-10">
          How Ada can help.
        </h2>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-10 list-none">
          <Step
            number="1"
            title="Describe what happened"
            body="A business turned you away. A building is inaccessible. You were denied a service animal. Whatever it is, tell Ada in your own words."
          />
          <Step
            number="2"
            title="Ada routes you correctly"
            body="Different kinds of ADA issues go to different places — the DOJ, the EEOC, or a private attorney. Ada knows the difference and won't waste your time."
          />
          <Step
            number="3"
            title="Take the next step"
            body="If your situation warrants an attorney, Ada helps you find one in your state. If it's a government complaint, Ada walks you through filing it directly."
          />
        </ol>
      </section>

      {/* Reading level — quiet callout */}
      <section className="bg-surface-100 border-y border-surface-200">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-14">
          <div className="flex flex-col md:flex-row gap-6 md:gap-12 md:items-center">
            <div className="md:w-1/3">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent-500 mb-2">
                Meet you where you are
              </p>
              <h2 className="font-display text-2xl text-ink-900">
                Three reading levels.
              </h2>
            </div>
            <div className="md:flex-1 text-ink-700 text-base leading-relaxed max-w-2xl">
              <p>
                Ada adapts to how you want to communicate. Choose{' '}
                <span className="font-medium text-ink-900">Simple</span> for
                short, plain sentences.{' '}
                <span className="font-medium text-ink-900">Standard</span> for
                everyday conversation.{' '}
                <span className="font-medium text-ink-900">Professional</span>{' '}
                for precise legal terminology — useful if you're an attorney or
                advocate.
              </p>
              <p className="mt-3 text-sm text-ink-500">
                You can change levels at any point in the conversation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust row */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
          <TrustItem
            label="Free, forever"
            body="No paywall, no subscription, no saved credit card. ADA help shouldn't cost anyone money."
          />
          <TrustItem
            label="Not a law firm"
            body="We don't represent you and we can't take your case. We help you understand the law and connect with people who can."
          />
          <TrustItem
            label="Fully accessible"
            body="Built to WCAG AAA. Screen reader tested. Keyboard navigable throughout. Photo-sensitive-safe."
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-24">
        <div className="border-l-4 border-accent-500 pl-6 py-4">
          <p className="font-display text-xl sm:text-2xl text-ink-900 leading-snug max-w-2xl">
            The ADA exists. You have rights. Ada is here to help you use them.
          </p>
          <Link
            to="/chat"
            className="mt-5 inline-flex items-center gap-2 text-accent-500 hover:text-accent-600 font-medium transition-colors"
          >
            Start a conversation
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Step({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <li>
      <div className="font-display text-4xl text-accent-500/80 mb-2 leading-none">
        {number}
      </div>
      <h3 className="font-display text-xl text-ink-900 mb-2">{title}</h3>
      <p className="text-ink-700 leading-relaxed">{body}</p>
    </li>
  );
}

function TrustItem({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent-500 mb-2">
        {label}
      </p>
      <p className="text-ink-700 leading-relaxed text-sm">{body}</p>
    </div>
  );
}
