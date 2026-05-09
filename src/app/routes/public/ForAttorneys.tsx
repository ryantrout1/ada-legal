/**
 * ForAttorneys — the public attorney-facing page.
 *
 * Audience: practicing disability rights attorneys deciding whether to
 * join the ADA Legal Link vetted network. Different audience from the
 * rest of the public site (users in distress) — different voice.
 *
 * Voice:
 *   FOUNDER, NOT ADA. First-person plural ("we"), not first-person
 *   singular ("I" / Ada). The reference is the "From the founders"
 *   block on Home.tsx — direct, concrete, no jargon, no Ada-isms.
 *   Reviewers: if you find yourself writing "I'll listen" or "tell
 *   me what happened" on this page, stop. That's the wrong voice.
 *
 * Phase 1 (this commit): mailto: CTA. Page is mostly static content;
 * the apply path is "send Gina an email." The application form lands
 * in Phase 2 — the <ApplyCTA> component is where the swap happens.
 *
 * Footer placement: link is in PublicLayout.tsx footer, NOT primary
 * nav. Primary nav stays focused on user-side flows (Talk to Ada,
 * Standards Guide, Class actions, Attorneys directory). Attorneys
 * looking to apply find this page via search or direct link; the
 * footer is the canonical site-wide entry.
 *
 * Reading-level: written at standard reading level, single voice. The
 * Simple/Standard/Professional toggle is for user-side content; this
 * page is a peer-to-peer recruiting message.
 *
 * Ref: docs/ARCHITECTURE.md §11 (public routes).
 */

import { Helmet } from 'react-helmet-async';
import { Breadcrumbs } from '../../components/Breadcrumbs.js';

// Email target for Phase 1 mailto: CTA. Hardcoded by design — if it
// changes, this is the one-line edit. Phase 2 will replace the mailto
// with a real form posting to /api/attorneys/apply.
const GINA_EMAIL = 'gina@adalegallink.com';
const APPLY_SUBJECT = 'Joining the ADA Legal Link attorney network';

export default function ForAttorneys() {
  return (
    <>
      <Helmet>
        <title>For attorneys, ADA Legal Link</title>
        <meta
          name="description"
          content="ADA Legal Link is a free intake and triage service for people facing disability access barriers. Information for attorneys interested in joining the vetted network."
        />
      </Helmet>

      <article className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'For attorneys' },
          ]}
          className="mb-8"
        />

        {/* Eyebrow + H1 */}
        <p className="font-mono text-xs sm:text-sm uppercase tracking-[0.18em] text-accent-500 mb-5">
          For attorneys
        </p>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight text-ink-900 mb-6">
          We're building a small,{' '}
          <span className="italic text-accent-600">intentional</span> network.
        </h1>

        {/* Lede */}
        <p className="text-lg text-ink-700 leading-relaxed mb-12">
          ADA Legal Link is a free intake and triage service for people
          facing disability access barriers. When a case warrants legal
          action, we connect them with vetted attorneys who handle this
          work. No subscription. No referral fee. No lead-gen invoices.
        </p>

        {/* SECTION 1 — What we send you */}
        <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
          What we send you
        </h2>
        <p className="text-ink-700 leading-relaxed mb-3">
          Before we ever introduce a case, our intake assistant Ada has
          already had a conversation with the person about what happened.
          By the time it reaches you, the case has been pre-screened.
        </p>
        <ul className="space-y-3 text-ink-700 leading-relaxed list-none p-0 mb-10">
          <li>
            <span className="font-medium text-ink-900">A documented narrative.</span>{' '}
            What happened, in the person's own words, with the legal frame
            we think applies (most often Title III public accommodations).
          </li>
          <li>
            <span className="font-medium text-ink-900">Evidence where available.</span>{' '}
            Photos, locations, dates. If there are physical barriers, Ada
            walks the person through documenting them.
          </li>
          <li>
            <span className="font-medium text-ink-900">A geography and practice-area match.</span>{' '}
            We don't blast cases. We introduce a case to attorneys who
            actually handle this kind of work in the right state.
          </li>
          <li>
            <span className="font-medium text-ink-900">Your decision.</span>{' '}
            We don't negotiate fees, terms, or strategy on your behalf. We
            make the introduction. You decide whether to take the case.
          </li>
        </ul>

        {/* SECTION 2 — Who we're looking for */}
        <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
          Who we're looking for
        </h2>
        <p className="text-ink-700 leading-relaxed mb-3">
          Practicing attorneys with real experience in disability rights,
          civil rights, or access litigation. We weight breadth less than
          depth, in this order:
        </p>
        <ul className="space-y-3 text-ink-700 leading-relaxed list-none p-0 mb-10">
          <li>
            <span className="font-medium text-ink-900">Title III experience.</span>{' '}
            Public accommodations claims are most of what comes through us
            today. If you've taken these to settlement or judgment, we
            want to hear from you.
          </li>
          <li>
            <span className="font-medium text-ink-900">Adjacent practice areas.</span>{' '}
            Title II (state and local government), FHA accessibility,
            transportation. Employment / Title I as we open that scope up.
          </li>
          <li>
            <span className="font-medium text-ink-900">Geographic coverage.</span>{' '}
            We try to introduce cases to local counsel. If you cover a
            specific state or region, tell us where.
          </li>
          <li>
            <span className="font-medium text-ink-900">Willingness to take the case.</span>{' '}
            We aren't looking for every disability-curious attorney to
            list themselves. We're looking for people who actually take
            these cases when the fit is right.
          </li>
        </ul>

        {/* SECTION 3 — What we're not */}
        <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
          What we're not
        </h2>
        <ul className="space-y-3 text-ink-700 leading-relaxed list-none p-0 mb-10">
          <li>
            <span className="font-medium text-ink-900">Not a referral service.</span>{' '}
            No fees change hands between us and you. We don't take a cut,
            a percentage, or a flat charge. The service is free to
            applicants and free to participating attorneys.
          </li>
          <li>
            <span className="font-medium text-ink-900">Not a lead-gen marketplace.</span>{' '}
            No auction, no pay-for-placement, no tiered visibility. The
            directory shows every approved attorney; we route cases by
            fit, not by who paid.
          </li>
          <li>
            <span className="font-medium text-ink-900">Not exclusive.</span>{' '}
            You can be on other platforms. We ask only that if a case we
            send you fits, you give it a real look.
          </li>
        </ul>

        {/* SECTION 4 — How to apply (Phase 1: mailto) */}
        <div className="border-l-4 border-accent-500 pl-6 py-4 max-w-2xl mb-10">
          <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-3">
            Interested?
          </h2>
          <p className="text-ink-700 leading-relaxed mb-5">
            We're early. We're reviewing applications in batches as the
            network grows. Send us a note with your name, firm, bar number
            and state, the practice areas and geographies you cover, and
            anything you'd want a prospective client to know about your
            work.
          </p>
          <a
            href={`mailto:${GINA_EMAIL}?subject=${encodeURIComponent(APPLY_SUBJECT)}`}
            className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-medium px-6 py-3.5 rounded-md transition-colors"
          >
            Email us to apply
            <span aria-hidden="true">→</span>
          </a>
          <p className="mt-4 text-sm text-ink-500">
            Or write directly to{' '}
            <a
              href={`mailto:${GINA_EMAIL}`}
              className="text-accent-500 hover:text-accent-600 underline underline-offset-2"
            >
              {GINA_EMAIL}
            </a>
            . We respond as we review applications.
          </p>
        </div>

        {/* SECTION 5 — Honest note */}
        <p className="text-ink-500 leading-relaxed text-sm mb-10">
          We're a small team. Gina, who reviews applications, is also a
          practicing attorney. Replies may take a week or two. If you
          don't hear back within three weeks, send a follow-up.
        </p>

        {/* Sign-off */}
        <p className="text-ink-700 leading-relaxed">
          Thank you for considering this. The work matters, and we'd
          rather build the network slowly with the right people than
          quickly with the wrong ones.
        </p>
        <p className="mt-4 text-ink-500 text-sm">
          <span className="font-medium text-ink-700">Ryan</span> &amp;{' '}
          <span className="font-medium text-ink-700">Gina</span>, co-founders
        </p>
      </article>
    </>
  );
}
