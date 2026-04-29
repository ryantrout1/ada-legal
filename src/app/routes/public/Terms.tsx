/**
 * Terms — public terms of service.
 *
 * Draft for Gina's legal review. Two reading-level variants:
 *
 *   - Simple: ~8th-grade reading level. Short sentences, familiar
 *     vocabulary, more bullet structure. The factual claims and
 *     legal commitments are identical to Standard — no liability
 *     limits weakened, no obligations dropped, no rules removed.
 *
 *   - Standard: the existing plain-language terms. Renders for both
 *     'standard' and 'professional' reading levels (Privacy/Terms
 *     have no separate Legal version — the existing prose IS the
 *     legal-binding text, just written accessibly).
 *
 * Reading level controlled by the site-wide ReadingLevelContext. The
 * eyeball panel, the in-page ReadingLevelToggle, and chat all read
 * and write to the same context — pick "Simple" anywhere and Terms
 * follows.
 *
 * Every ADA-focused legal services product needs clear "not legal
 * advice" language and a clear limitation of liability, because the
 * stakes for users are high and the possibility of misunderstanding
 * Ada's role is real.
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
import { PageTOC } from '../../components/PageTOC.js';
import { useReadingLevel } from '../../components/standards/ReadingLevelContext.js';
import { ReadingLevelToggle } from '../../components/standards/ReadingLevelToggle.js';
import { CurrentReadingLevel } from '../../components/standards/CurrentReadingLevel.js';

export default function Terms() {
  const { readingLevel } = useReadingLevel();
  const isSimple = readingLevel === 'simple';

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

      {/* Reading-level controls. Same site-wide context as Privacy,
          Standards Guide, ClassActionDetail, and chat. */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <ReadingLevelToggle />
        <CurrentReadingLevel />
      </div>

      {isSimple ? <SimpleTerms /> : <StandardTerms />}

      <div className="rounded-lg border border-surface-200 bg-surface-100 px-6 py-6 sm:px-8 sm:py-8 mb-10">
        <h3 className="font-display text-xl text-ink-900 mb-2">
          {isSimple
            ? 'Not sure if Ada can help with your situation?'
            : 'Not sure if your situation fits?'}
        </h3>
        <p className="text-ink-700 leading-relaxed mb-4">
          {isSimple
            ? "These rules say what Ada can and can't do. If you're not sure if she can help with what happened to you, just ask her."
            : "These terms cover what Ada can and can't do. If you're trying to figure out whether what you experienced is something Ada can help with, just ask her."}
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

// ─── Standard variant ────────────────────────────────────────────────
// The existing plain-language terms. Reading level: roughly 11th-12th
// grade. Uses some legal terminology where precision matters (good
// faith, conflict-of-law principles, attorney-client relationship).
function StandardTerms() {
  return (
    <>
      <p className="text-lg text-ink-700 leading-relaxed mb-10">
        These are the terms you agree to by using ADA Legal Link. The
        plain-English version is: Ada gives you information, not legal
        advice; we try our best but can't promise she's always right;
        the service is free; and if you connect with an attorney
        through us, that relationship is between you and them, not us.
      </p>

      <PageTOC
        className="mb-10"
        items={[
          { label: 'What ADA Legal Link is', id: 'what-it-is' },
          { label: 'Ada is not a lawyer', id: 'not-a-lawyer' },
          { label: 'Ada can make mistakes', id: 'mistakes' },
          { label: 'What the service costs', id: 'costs' },
          { label: 'Attorneys in the directory', id: 'attorneys-directory' },
          { label: 'Who owns what', id: 'ownership' },
          { label: 'How you can use the service', id: 'how-to-use' },
          { label: "Things we can't promise", id: 'cannot-promise' },
          { label: 'Ending your use', id: 'ending-use' },
          { label: 'Disputes and governing law', id: 'disputes' },
          { label: 'Changes', id: 'changes' },
          { label: 'Questions', id: 'questions' },
        ]}
      />

      <h2 id="what-it-is" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        What ADA Legal Link is
      </h2>
      <p className="text-ink-700 leading-relaxed mb-10">
        ADA Legal Link is a free service that helps people understand
        their rights under the Americans with Disabilities Act and, if
        they want, find an attorney. The service includes Ada, an AI
        assistant; a directory of attorneys who have volunteered to be
        listed; and related resources.
      </p>

      <h2 id="not-a-lawyer" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
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

      <h2 id="mistakes" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
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

      <h2 id="costs" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        What the service costs
      </h2>
      <p className="text-ink-700 leading-relaxed mb-10">
        Nothing. Using Ada is free. Browsing the attorney directory is
        free. We do not charge users, and we do not take a cut of any
        fee an attorney charges you. Attorneys in our directory are
        listed because they've agreed to be, not because they paid us.
      </p>

      <h2 id="attorneys-directory" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
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

      <h2 id="ownership" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
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

      <h2 id="how-to-use" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
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

      <h2 id="cannot-promise" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
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

      <h2 id="ending-use" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
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

      <h2 id="disputes" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
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

      <h2 id="changes" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        Changes
      </h2>
      <p className="text-ink-700 leading-relaxed mb-10">
        If we change these terms, we'll update this page and note the
        date below. For substantial changes, we'll announce them on
        the homepage for at least 30 days.
      </p>

      <h2 id="questions" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
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
    </>
  );
}

// ─── Simple variant ──────────────────────────────────────────────────
// ~8th-grade reading level. Same factual claims as Standard — same
// commitments, same liability limits, same governing law. Different
// language: short sentences (target 10-15 words), familiar vocabulary,
// active voice. NEEDS LEGAL REVIEW — Gina is reviewing.
function SimpleTerms() {
  return (
    <>
      <p className="text-lg text-ink-700 leading-relaxed mb-10">
        These are the rules for using ADA Legal Link. The short
        version: Ada gives you information, not legal advice. We try
        hard, but she can be wrong. The service is free. If you find
        a lawyer through us, that's between you and them, not us.
      </p>

      <PageTOC
        className="mb-10"
        items={[
          { label: 'What this site is', id: 'what-it-is' },
          { label: 'Ada is not a lawyer', id: 'not-a-lawyer' },
          { label: 'Ada can be wrong', id: 'mistakes' },
          { label: 'It costs nothing', id: 'costs' },
          { label: 'About the lawyers we list', id: 'attorneys-directory' },
          { label: 'Who owns what', id: 'ownership' },
          { label: 'How to use the site', id: 'how-to-use' },
          { label: "What we can't promise", id: 'cannot-promise' },
          { label: 'Stopping your use', id: 'ending-use' },
          { label: 'If we have a problem', id: 'disputes' },
          { label: 'When the rules change', id: 'changes' },
          { label: 'Questions', id: 'questions' },
        ]}
      />

      <h2 id="what-it-is" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        What this site is
      </h2>
      <p className="text-ink-700 leading-relaxed mb-10">
        ADA Legal Link is a free site. It helps people understand the
        Americans with Disabilities Act. If you want, it can help you
        find a lawyer. The site has Ada (the AI helper), a list of
        lawyers, and other helpful info.
      </p>

      <h2 id="not-a-lawyer" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        Ada is not a lawyer
      </h2>
      <p className="text-ink-700 leading-relaxed mb-4">
        This is the most important thing on this page. Ada is an AI.
        She is not a lawyer. What she says is{' '}
        <strong>general information</strong>, not{' '}
        <strong>legal advice</strong>.
      </p>
      <p className="text-ink-700 leading-relaxed mb-4">
        General information is: here's what the law says in general.
        Here are some things people in your spot might think about.
        Legal advice is: based on your exact story, here's what you
        should do. Only a real lawyer who agreed to be your lawyer
        can give you legal advice.
      </p>
      <p className="text-ink-700 leading-relaxed mb-10">
        Talking to Ada does not make her your lawyer. Reading this
        site does not make us your lawyer.
      </p>

      <h2 id="mistakes" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        Ada can be wrong
      </h2>
      <p className="text-ink-700 leading-relaxed mb-4">
        AI helpers sometimes get things wrong. Ada might misread your
        question. She might cite a law wrong. She might describe a
        case in a way that doesn't fit yours. We try to keep this
        rare, but we can't promise she's always right.
      </p>
      <p className="text-ink-700 leading-relaxed mb-10">
        Before you make a legal choice based on what Ada said, check
        it against a real source. Read the actual law. Look at the
        Department of Justice's website. Or ask a real lawyer.
      </p>

      <h2 id="costs" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        It costs nothing
      </h2>
      <p className="text-ink-700 leading-relaxed mb-10">
        Using Ada is free. Looking at the lawyer list is free. We
        don't charge you. We don't take a cut of what a lawyer
        charges you. Lawyers are on our list because they signed up,
        not because they paid us.
      </p>

      <h2 id="attorneys-directory" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        About the lawyers we list
      </h2>
      <p className="text-ink-700 leading-relaxed mb-4">
        The lawyers in our list are on their own. When they sign up,
        we check that they have a real law license. We try to keep
        that info current. But we don't recommend any one lawyer over
        another.
      </p>
      <p className="text-ink-700 leading-relaxed mb-4">
        If you contact one, that's between you and them. We are not
        part of it. We don't see what you and your lawyer talk about
        after we connect you. We don't want to.
      </p>
      <p className="text-ink-700 leading-relaxed mb-10">
        If you have a complaint about a lawyer on our list, email{' '}
        <a
          href="mailto:directory@adalegallink.com"
          className="inline-block px-1.5 py-1 -my-1 rounded text-accent-500 hover:text-accent-600 underline underline-offset-2"
        >
          directory@adalegallink.com
        </a>
        . We will look into it. We may take a lawyer off the list.
      </p>

      <h2 id="ownership" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        Who owns what
      </h2>
      <p className="text-ink-700 leading-relaxed mb-4">
        <strong>You own your chat.</strong> What you write to Ada is
        yours. You can save it, delete it, or share it with anyone.
      </p>
      <p className="text-ink-700 leading-relaxed mb-10">
        <strong>We own the rest.</strong> The way the site looks,
        Ada herself, the writing on the site, our name and logo —
        those belong to ADA Legal Link. You can link to the site.
        You can quote from it if you say where it's from. You can
        share your own chats. You cannot copy the whole site. You
        cannot use our name in a way that makes it sound like we
        agree with something we don't.
      </p>

      <h2 id="how-to-use" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        How to use the site
      </h2>
      <p className="text-ink-700 leading-relaxed mb-4">
        Use Ada for what she's for: understanding your rights,
        getting info, and finding a lawyer if you need one.
      </p>
      <p className="text-ink-700 leading-relaxed mb-4">
        Please don't:
      </p>
      <ul className="space-y-2 text-ink-700 mb-10 list-none p-0">
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ·
          </span>
          <span>Try to break the site or hack into it.</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ·
          </span>
          <span>Copy the whole lawyer list at once.</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ·
          </span>
          <span>Use Ada to harass anyone or to make harmful content.</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ·
          </span>
          <span>Pretend to be someone else.</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ·
          </span>
          <span>Use the site for anything against the law.</span>
        </li>
      </ul>

      <h2 id="cannot-promise" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        What we can't promise
      </h2>
      <p className="text-ink-700 leading-relaxed mb-4">
        We try to keep Ada right. We try to keep the site working.
        We try to keep it safe. But we can't promise it always works.
        We give the site to you "as is." If you make a choice based
        on something Ada said and it goes wrong, we are not
        responsible. If the site goes down and you lose something,
        we are not responsible. If a lawyer on our list does
        something wrong, we are not responsible. The law lets us
        limit what we owe you, and we're using that.
      </p>
      <p className="text-ink-700 leading-relaxed mb-10">
        If you have a deadline, a court date, or any kind of
        emergency, please talk to a real lawyer, not just Ada.
      </p>

      <h2 id="ending-use" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        Stopping your use
      </h2>
      <p className="text-ink-700 leading-relaxed mb-10">
        You can stop using the site any time. Just close your
        browser. You can also ask us to delete your data — see our{' '}
        <a
          href="/privacy"
          className="inline-block px-1.5 py-1 -my-1 rounded text-accent-500 hover:text-accent-600 underline underline-offset-2"
        >
          privacy page
        </a>
        . We can stop you from using the site if you broke these
        rules. We will tell you why, unless telling you would mess
        up a legal case.
      </p>

      <h2 id="disputes" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        If we have a problem
      </h2>
      <p className="text-ink-700 leading-relaxed mb-10">
        These rules follow the laws of Arizona. If you and we don't
        agree on something, please email us first at{' '}
        <a
          href="mailto:legal@adalegallink.com"
          className="inline-block px-1.5 py-1 -my-1 rounded text-accent-500 hover:text-accent-600 underline underline-offset-2"
        >
          legal@adalegallink.com
        </a>
        . We will try to fix it without going to court. If we can't
        fix it that way, the case will go to court in Maricopa
        County, Arizona.
      </p>

      <h2 id="changes" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        When the rules change
      </h2>
      <p className="text-ink-700 leading-relaxed mb-10">
        If we change these rules, we will update this page. The
        date below will change too. For big changes, we will put a
        notice on the home page for at least 30 days.
      </p>

      <h2 id="questions" className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        Questions
      </h2>
      <p className="text-ink-700 leading-relaxed mb-10">
        Questions about these rules? Email{' '}
        <a
          href="mailto:legal@adalegallink.com"
          className="inline-block px-1.5 py-1 -my-1 rounded text-accent-500 hover:text-accent-600 underline underline-offset-2"
        >
          legal@adalegallink.com
        </a>
        .
      </p>
    </>
  );
}
