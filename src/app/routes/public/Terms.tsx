/**
 * Terms — public terms of service.
 *
 * Draft for Gina's legal review. Every ADA-focused legal services
 * product needs clear "not legal advice" language and a clear
 * limitation of liability, because the stakes for users are high and
 * the possibility of misunderstanding Ada's role is real.
 *
 * Written at plain-language reading level. Legal necessity sections
 * (limitation of liability, governing law) are as plain as they can
 * reasonably be.
 *
 * Key commitments this document makes the product accountable to:
 *   - Ada is not a lawyer and her output is not legal advice
 *   - The service is free — no hidden pricing
 *   - No creating of an attorney-client relationship by talking to Ada
 *   - Users retain ownership of their conversations
 *   - We can't be held liable for decisions users make based on Ada
 *
 * Ref: docs/ARCHITECTURE.md §16 terms
 */

import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../../components/Breadcrumbs.js';

export default function Terms() {
  return (
    <section className="max-w-2xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Terms' },
        ]}
        className="mb-8"
      />
      <p className="font-mono text-xs sm:text-sm uppercase tracking-[0.18em] text-accent-500 mb-5">
        Terms of service
      </p>
      <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight text-ink-900 mb-6">
        The rules of using Ada.
      </h1>
      <p className="text-lg text-ink-700 leading-relaxed mb-10">
        These are the terms you agree to by using ADA Legal Link. The
        plain-English version is: Ada gives you information, not legal
        advice; we try our best but can't promise she's always right;
        the service is free; and if you connect with an attorney
        through us, that relationship is between you and them, not us.
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        What ADA Legal Link is
      </h2>
      <p className="text-ink-700 leading-relaxed mb-10">
        ADA Legal Link is a free service that helps people understand
        their rights under the Americans with Disabilities Act and, if
        they want, find an attorney. The service includes Ada, an AI
        assistant; a directory of attorneys who have volunteered to be
        listed; and related resources.
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        Ada is not a lawyer
      </h2>
      <p className="text-ink-700 leading-relaxed mb-4">
        This is the most important thing on this page. Ada is an AI
        assistant. She is not a lawyer. Her responses are{' '}
        <strong>general information</strong>, not{' '}
        <strong>legal advice</strong>.
      </p>
      <p className="text-ink-700 leading-relaxed mb-4">
        General information means: here's what the ADA generally says,
        here's how similar situations have been handled, here's what
        you might consider. Legal advice means: given the specific
        facts of your situation, here is what you should do. Only a
        licensed attorney who has agreed to represent you can give
        you legal advice.
      </p>
      <p className="text-ink-700 leading-relaxed mb-10">
        Talking to Ada does not create an attorney-client relationship
        between you and anyone. Reading information on this site does
        not either.
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        Ada can make mistakes
      </h2>
      <p className="text-ink-700 leading-relaxed mb-4">
        AI assistants sometimes get things wrong. Ada might misunderstand
        your question, cite a law section incorrectly, or describe a
        situation in a way that doesn't quite fit yours. We try to
        minimize this, but we can't guarantee every answer is right.
      </p>
      <p className="text-ink-700 leading-relaxed mb-10">
        Before making a legal decision based on something Ada told you,
        check it against an authoritative source (the text of the law
        itself, the Department of Justice, or a licensed attorney).
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        What the service costs
      </h2>
      <p className="text-ink-700 leading-relaxed mb-10">
        Nothing. Using Ada is free. Browsing the attorney directory is
        free. We do not charge users, and we do not take a cut of any
        fee an attorney charges you. Attorneys in our directory are
        listed because they've agreed to be, not because they paid us.
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        Attorneys in the directory
      </h2>
      <p className="text-ink-700 leading-relaxed mb-4">
        The attorneys listed in our directory are independent. We
        verify their bar licensure when they're listed and try to keep
        that information current, but we don't endorse or vouch for
        any specific attorney.
      </p>
      <p className="text-ink-700 leading-relaxed mb-4">
        If you choose to contact one, any relationship between you and
        that attorney is between you and them. We're not a party to
        their representation of you. We don't see, and don't want to
        see, communications between you and your attorney after the
        introduction.
      </p>
      <p className="text-ink-700 leading-relaxed mb-10">
        If you have a complaint about an attorney in our directory,
        please tell us at{' '}
        <a
          href="mailto:directory@adalegallink.com"
          className="text-accent-500 hover:text-accent-600 underline underline-offset-2"
        >
          directory@adalegallink.com
        </a>
        . We investigate complaints and may remove attorneys from the
        directory.
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        Who owns what
      </h2>
      <p className="text-ink-700 leading-relaxed mb-4">
        <strong>You own your conversation.</strong> Anything you write
        to Ada is yours. You can download it, delete it, or share it
        with anyone you choose.
      </p>
      <p className="text-ink-700 leading-relaxed mb-10">
        <strong>We own the rest.</strong> The site design, the Ada
        assistant, the content on the site, the ADA Legal Link name
        and logo — those belong to ADA Legal Link. You can link to the
        site, quote from it with attribution, and share conversations
        you had with Ada. You cannot copy the site wholesale or use
        our name to suggest we endorse something we don't.
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        How you can use the service
      </h2>
      <p className="text-ink-700 leading-relaxed mb-4">
        Please use Ada for what she's for: understanding your rights,
        getting information, and finding an attorney if you need one.
      </p>
      <p className="text-ink-700 leading-relaxed mb-4">
        Please don't:
      </p>
      <ul className="space-y-2 text-ink-700 mb-10 list-none p-0">
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ·
          </span>
          <span>Try to break, attack, or reverse-engineer the service</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ·
          </span>
          <span>Scrape or copy the attorney directory in bulk</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ·
          </span>
          <span>Use Ada to harass anyone or to generate content intended to harm others</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ·
          </span>
          <span>Pretend to be someone else when talking to Ada or to an attorney</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ·
          </span>
          <span>Use the service for anything illegal</span>
        </li>
      </ul>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        Things we can't promise
      </h2>
      <p className="text-ink-700 leading-relaxed mb-4">
        We do our best to keep Ada accurate, the site available, and
        the service secure. But we can't guarantee that everything
        always works. The service is provided &quot;as is.&quot; To the
        maximum extent permitted by law, we are not liable for decisions
        you make based on something Ada said, for any losses caused by
        a service outage, or for the actions of attorneys in the
        directory.
      </p>
      <p className="text-ink-700 leading-relaxed mb-10">
        If you're in a time-sensitive legal situation (a deadline, a
        court date, an active emergency), please talk to a licensed
        attorney, not just Ada.
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        Ending your use
      </h2>
      <p className="text-ink-700 leading-relaxed mb-10">
        You can stop using the service any time, just by closing your
        browser. You can ask us to delete your data at any point (see
        our{' '}
        <a
          href="/privacy"
          className="inline-block px-1.5 py-1 -my-1 rounded text-accent-500 hover:text-accent-600 underline underline-offset-2"
        >
          privacy policy
        </a>
        ). We can end your access if you've violated these terms, but
        we'll tell you why unless doing so would interfere with a legal
        investigation.
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        Disputes and governing law
      </h2>
      <p className="text-ink-700 leading-relaxed mb-10">
        These terms are governed by the laws of the State of Arizona,
        without regard to conflict-of-law principles. If there's a
        dispute, let's try to resolve it directly first — email us at{' '}
        <a
          href="mailto:legal@adalegallink.com"
          className="inline-block px-1.5 py-1 -my-1 rounded text-accent-500 hover:text-accent-600 underline underline-offset-2"
        >
          legal@adalegallink.com
        </a>
        {' '}and we'll try to work it out in good faith. If we can't,
        disputes will be resolved in the state or federal courts
        located in Maricopa County, Arizona.
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        Changes
      </h2>
      <p className="text-ink-700 leading-relaxed mb-10">
        If we change these terms, we'll update this page and note the
        date below. For substantial changes, we'll announce them on
        the homepage for at least 30 days.
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        Questions
      </h2>
      <p className="text-ink-700 leading-relaxed mb-10">
        Questions about these terms:{' '}
        <a
          href="mailto:legal@adalegallink.com"
          className="inline-block px-1.5 py-1 -my-1 rounded text-accent-500 hover:text-accent-600 underline underline-offset-2"
        >
          legal@adalegallink.com
        </a>
        .
      </p>

      <div className="rounded-lg border border-surface-200 bg-surface-100 px-6 py-6 sm:px-8 sm:py-8 mb-10">
        <h3 className="font-display text-xl text-ink-900 mb-2">
          Not sure if your situation fits?
        </h3>
        <p className="text-ink-700 leading-relaxed mb-4">
          These terms cover what Ada can and can't do. If you're trying
          to figure out whether what you experienced is something Ada
          can help with, just ask her.
        </p>
        <Link
          to="/chat"
          className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-medium px-5 py-3 rounded-md transition-colors"
        >
          Talk to Ada
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="text-sm text-ink-700 border-t border-surface-200 pt-6">
        <p>Last updated: April 2026.</p>
        <p className="mt-2">
          This agreement applies to <strong>adalegallink.com</strong>{' '}
          and all its subdomains.
        </p>
      </div>
    </section>
  );
}
