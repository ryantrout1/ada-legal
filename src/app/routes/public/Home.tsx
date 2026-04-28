/**
 * Home — the public entry point.
 *
 * Ada speaks in first person here. The belief "access is a right, not
 * a favor" is the core of the page, not a tagline. The voice and copy
 * are derived from docs/ADA_PERSONA.md and docs/ADA_VOICE_GUIDE.md —
 * refer there before editing copy on this page.
 *
 * What someone landing here needs to understand in 5 seconds:
 *   1. Someone here takes this seriously.
 *   2. This is about what happened to me, not what can be sold to me.
 *   3. I can start whenever I want, at my pace.
 *
 * Design hierarchy:
 *   - One dominant headline, stating Ada's belief
 *   - First-person introduction in the serif, short paragraphs
 *   - Primary CTA: "Tell Ada what happened" (specific, not "Start")
 *   - Belief callout with accent border
 *   - How-it-works: three steps, Ada-voiced
 *   - Reading level note: Ada adapts to you
 *   - Final CTA
 *
 * No hero image. No testimonial carousel. No stock photography of
 * disabled people. Ada's voice does the work.
 *
 * Ref: docs/ADA_PERSONA.md, docs/ADA_VOICE_GUIDE.md
 */

import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <>
      {/* Hero — Ada's belief, stated plainly */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-16 pb-12 sm:pt-24 sm:pb-20">
        <p className="font-mono text-xs sm:text-sm uppercase tracking-[0.18em] text-accent-500 mb-5">
          ADA Legal Link
        </p>
        <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-ink-900 max-w-4xl">
          Access is a right,
          <br />
          <span className="italic text-accent-600">not a favor.</span>
        </h1>
        <div className="mt-8 space-y-5 max-w-2xl text-lg sm:text-xl text-ink-700 leading-relaxed">
          <p>
            I'm Ada. If a business, workplace, or public place didn't give you
            the access you're owed, I'm here to help you figure out what
            happened and what to do next.
          </p>
          <p>
            Tell me what happened, in your own words. I'll listen. Then we'll
            take it from there.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-medium px-6 py-3.5 rounded-md transition-colors"
          >
            Tell Ada what happened
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            to="/class-actions"
            className="text-ink-700 hover:text-accent-600 underline underline-offset-4 decoration-1 px-2 py-2 transition-colors"
          >
            Browse class actions
          </Link>
          <a
            href="#how-this-works"
            className="text-ink-700 hover:text-accent-600 underline underline-offset-4 decoration-1 px-2 py-2 transition-colors"
          >
            How this works
          </a>
        </div>

        <p className="mt-6 text-sm text-ink-500">
          Takes as long as you need. You can stop and come back anytime.
        </p>
      </section>

      {/* Divider — intentional visual pause before the details */}
      <div
        aria-hidden="true"
        className="max-w-5xl mx-auto px-5 sm:px-8"
      >
        <div className="border-t border-surface-200" />
      </div>

      {/* About Ada — first person */}
      <section
        id="about-ada"
        className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-20"
      >
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent-500 mb-5">
          About Ada
        </p>
        <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-6 max-w-3xl">
          I'm not a lawyer. I'm the person you talk to first.
        </h2>
        <div className="space-y-5 max-w-2xl text-base sm:text-lg text-ink-700 leading-relaxed">
          <p>
            I know the Americans with Disabilities Act — Title I for work, Title
            II for state and local government, Title III for businesses open to
            the public. I know what the law actually says, what it requires, and
            what to do when it's not being followed.
          </p>
          <p>
            What I do here is listen. You tell me what happened. I'll help you
            understand whether it's an ADA issue, what your options look like,
            and — if you want — I'll connect you with an attorney who handles
            these cases.
          </p>
          <p>
            You're the expert on your own experience. I'll take your account
            seriously the first time. You won't have to prove yourself to me.
          </p>
        </div>
      </section>

      {/* Belief callout — frames the barrier as the subject of Ada's
          work, not the disability. Earlier wording ('Being dismissed
          is part of the injury') drifted toward the medical model
          (disability as wound + dismissal as compounding injury).
          The barrier framing is the one the disability community
          has been pushing toward for fifty years: the disability
          isn't the injury; the barrier is. */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-16 sm:pb-20">
        <blockquote className="border-l-4 border-accent-500 pl-6 py-2 max-w-3xl">
          <p className="font-display text-2xl sm:text-3xl text-ink-900 leading-tight">
            The barrier was real. You don't have to convince me it was.
          </p>
        </blockquote>
      </section>

      {/* How this works */}
      <section
        id="how-this-works"
        className="bg-surface-100 border-y border-surface-200"
      >
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent-500 mb-5">
            What happens when you tell me
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-10">
            Here's what to expect.
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-10 list-none">
            <Step
              number="1"
              title="You tell me what happened"
              body="Type it, record it, or share a photo — whatever's easiest. I'll ask questions as we go, but at your pace."
            />
            <Step
              number="2"
              title="I name what I'm seeing"
              body="Which part of the ADA might apply, what the standard is, and where things went wrong. Not to perform expertise — just so you know what you're dealing with."
            />
            <Step
              number="3"
              title="We look at your options"
              body="Document for the record, file a formal complaint, connect with an attorney, or sometimes it's not an ADA case — and I'll tell you that too, honestly, with what might help instead."
            />
          </ol>
        </div>
      </section>

      {/* Reading level — Ada adapts */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <div className="flex flex-col md:flex-row gap-6 md:gap-12 md:items-start">
          <div className="md:w-1/3">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent-500 mb-2">
              I adapt to you
            </p>
            <h2 className="font-display text-2xl text-ink-900">
              Three ways to talk.
            </h2>
          </div>
          <div className="md:flex-1 text-ink-700 text-base leading-relaxed max-w-2xl space-y-3">
            <p>
              Pick{' '}
              <span className="font-medium text-ink-900">Simple</span> if you
              want short, plain sentences.{' '}
              <span className="font-medium text-ink-900">Standard</span> is
              everyday conversation.{' '}
              <span className="font-medium text-ink-900">Professional</span> is
              precise legal language — useful if you're an attorney or an
              advocate working on behalf of someone else.
            </p>
            <p className="text-sm text-ink-500">
              Change it anytime. You don't have to pick the right one the first
              time.
            </p>
          </div>
        </div>
      </section>

      {/* What Ada is and isn't — trust row, Ada-voiced */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
          <TrustItem
            label="Free"
            body="No paywall. No subscription. No credit card. Getting help with your rights shouldn't cost you money."
          />
          <TrustItem
            label="Not a law firm"
            body="I can't represent you. I can help you understand what happened, and connect you with someone who can take the case if it calls for it."
          />
          <TrustItem
            label="Built for the community"
            body="WCAG AAA. Screen reader tested. Keyboard navigable. Photo-sensitive-safe. You shouldn't need to fight the site to tell me what happened."
          />
        </div>
      </section>

      {/* About Ada — origin story teaser. Sits between the trust row
          and the final CTA so the visitor reaches it after they
          understand what the product does, but before the final ask.
          Quiet pull-quote treatment so it doesn't compete with the
          hero or the closing CTA. */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-16 sm:pb-20">
        <div className="border-t border-surface-200 pt-12 sm:pt-16">
          <p className="font-mono text-xs sm:text-sm uppercase tracking-[0.18em] text-accent-500 mb-5">
            About the name
          </p>
          <h2 className="font-display text-3xl sm:text-4xl leading-[1.1] tracking-tight text-ink-900 max-w-3xl mb-6">
            Why she's called <span className="italic text-accent-600">Ada.</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-5 max-w-4xl text-ink-700 leading-relaxed">
            <p>
              The assistant on this site is named in honor of two
              things. <span className="font-medium text-ink-900">Ada Lovelace</span>,
              the 19th-century mathematician who described what
              computers could become a century before anyone built
              one. And the{' '}
              <span className="font-medium text-ink-900">
                Americans with Disabilities Act
              </span>
              , the 1990 law that finally said nobody gets shut out.
            </p>
            <p>
              She holds both names because her job is the work both
              names point to: making sure technology and the law
              actually deliver on the promise of access.
            </p>
          </div>
          <Link
            to="/about-ada"
            className="mt-8 inline-flex items-center gap-2 text-accent-500 hover:text-accent-600 font-medium underline underline-offset-4 decoration-1"
          >
            Read the full story
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-24">
        <div className="border-l-4 border-accent-500 pl-6 py-4 max-w-3xl">
          <p className="font-display text-xl sm:text-2xl text-ink-900 leading-snug">
            This doesn't have to happen today. But when you want to talk about
            what happened, I'll be here.
          </p>
          <Link
            to="/chat"
            className="mt-5 inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-medium px-6 py-3.5 rounded-md transition-colors"
          >
            Tell Ada what happened
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
