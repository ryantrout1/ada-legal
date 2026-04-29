/**
 * AboutAda — the origin story page.
 *
 * Ada is named in honor of Ada Lovelace and the Americans with
 * Disabilities Act. This page tells visitors why, in plain language.
 *
 * Reasons this page exists:
 *   1. Trust. People who arrive here are often upset and disabled and
 *      tired of being let down. A page that says "here is who we are
 *      and why we picked this name" answers an unspoken question.
 *   2. Differentiation. Every other legal-AI tool is named Lex or Casey
 *      or Athena. Ada has a real reason. We tell that reason once, well.
 *   3. Press hook. Reporters covering disability policy, AI ethics, or
 *      legal tech can use this story without inventing it.
 *
 * Editorial notes (please honor if you edit):
 *   - Do not write that Ada Lovelace was disabled in modern terms.
 *     She lived with chronic illness — that's true and present in her
 *     letters. "Disabled" full stop is a 21st-century framing she did
 *     not use and her contemporaries didn't apply to her.
 *   - Do not write that the assistant "is" Ada Lovelace, "brings her
 *     back," or "channels" her. Named in honor of, not a return of.
 *   - The ADA is the law, with capital letters. The assistant is Ada
 *     with one capital. Worth being careful about.
 *
 * Reading-level note: written at standard reading level, not Simple
 * mode. The reading-level toggle does not apply on static-content
 * pages — those are toggled per chapter in the Standards Guide.
 */

import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Breadcrumbs } from '../../components/Breadcrumbs.js';

export default function AboutAda() {
  return (
    <>
      <Helmet>
        <title>Why she's called Ada — ADA Legal Link</title>
        <meta
          name="description"
          content="The AI assistant on ADA Legal Link is named in honor of Ada Lovelace and the Americans with Disabilities Act. Here's why."
        />
      </Helmet>

      <article className="max-w-2xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'About Ada' },
          ]}
          className="mb-8"
        />
        {/* Eyebrow + title */}
        <p className="font-mono text-xs sm:text-sm uppercase tracking-[0.18em] text-accent-500 mb-5">
          About Ada
        </p>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight text-ink-900 mb-6">
          Why she's called Ada.
        </h1>

        {/* Lede — sets up the dual meaning in two sentences */}
        <p className="text-lg text-ink-700 leading-relaxed mb-12">
          The AI assistant you talk to on this site is named in honor of two
          things. A woman who imagined what computers could become a
          century before anyone built one. And the law that finally said
          nobody gets shut out.
        </p>

        {/* SECTION 1 — Ada Lovelace */}
        <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
          Ada Lovelace
        </h2>
        <p className="text-ink-700 leading-relaxed mb-4">
          Augusta Ada King, Countess of Lovelace, was born in London in
          1815. She was a mathematician at a time when women weren't
          expected to be anything of the kind. Her closest collaborator
          was Charles Babbage, the inventor of an enormous mechanical
          calculating machine called the Analytical Engine.
        </p>
        <p className="text-ink-700 leading-relaxed mb-4">
          The Engine was never built in her lifetime. But Ada wrote a set
          of notes about what it could do — and she saw further than
          anyone else, including Babbage. She described loops. She
          described conditionals. She wrote what historians now consider
          the first published computer program. And she wrote something
          stranger and bigger than that: that a machine like this could
          one day work on more than numbers. It could, she said, compose
          music.
        </p>
        <p className="text-ink-700 leading-relaxed mb-8">
          She called what she did{' '}
          <em className="text-ink-900 not-italic font-medium">
            poetical science.
          </em>{' '}
          She lived with chronic illness for most of her adult life, and
          she died of cancer at the age of thirty-six. She did the work
          anyway.
        </p>

        {/* Pull quote */}
        <figure className="my-10 border-l-4 border-accent-500 pl-6 py-2">
          <blockquote className="font-display text-xl sm:text-2xl text-ink-900 leading-snug italic">
            “The Analytical Engine has no pretensions whatever to
            originate anything. It can do whatever we know how to order
            it to perform.”
          </blockquote>
          <figcaption className="mt-3 text-sm text-ink-500 not-italic">
            Ada Lovelace, Note G, 1843
          </figcaption>
        </figure>

        <p className="text-ink-700 leading-relaxed mb-12">
          That sentence is one of the most-cited lines in the history of
          computing. It's a warning we still need: a machine does what
          you tell it to. The judgment of what to ask it for is yours.
        </p>

        {/* SECTION 2 — The ADA */}
        <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
          The Americans with Disabilities Act
        </h2>
        <p className="text-ink-700 leading-relaxed mb-4">
          One hundred and seventy-five years after Ada Lovelace was
          born, on July 26, 1990, President George H. W. Bush signed
          the Americans with Disabilities Act into law on the South
          Lawn of the White House. He called it the world's first
          comprehensive declaration of equality for people with
          disabilities. He was right.
        </p>
        <p className="text-ink-700 leading-relaxed mb-4">
          The law did not appear out of nowhere. It was won by disabled
          people themselves — including the Capitol Crawl in March of
          that year, when dozens of disabled activists got out of their
          wheelchairs and pulled themselves up the steps of the U.S.
          Capitol to make Congress see, in plain physical terms, what
          inaccessibility means.
        </p>
        <p className="text-ink-700 leading-relaxed mb-8">
          The ADA says, in five titles, that nobody gets shut out:
          not from a job, not from a city service, not from a store or
          a hotel or a doctor's office, not from a phone call, not from
          a bus or a train. Thirty-five years later, the work of
          actually delivering on that promise is still going on.
        </p>

        {/* SECTION 3 — Why this Ada */}
        <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
          Why this Ada
        </h2>
        <p className="text-ink-700 leading-relaxed mb-4">
          The two names share initials. That's a coincidence. The reason
          the assistant on this site carries both names is not.
        </p>
        <p className="text-ink-700 leading-relaxed mb-4">
          Ada Lovelace believed a machine could do more than arithmetic.
          She imagined it could help with the parts of life that needed
          care, attention, and judgment — the parts she called poetical.
          Nearly two centuries later, machines can do many of the things
          she described. They can compose music. They can read text.
          They can, sometimes, listen.
        </p>
        <p className="text-ink-700 leading-relaxed mb-4">
          The Americans with Disabilities Act says where they should be
          listening first. Where the work is hardest. Where the
          consequences of being shut out are most severe. The ADA is the
          framework for what access actually means in American life, and
          it is still, every day, being tested.
        </p>
        <p className="text-ink-700 leading-relaxed mb-12">
          Ada — the assistant on this site — exists at the place where
          those two ideas meet. Her job is to help when access fails.
          To listen, in plain words, to what happened. To help figure
          out what it was, what part of the law applies, and what comes
          next. She is named in honor of two histories, and she was
          built to do the work both of them point to.
        </p>

        {/* What Ada is and isn't — sets honest expectations */}
        <div className="border border-surface-200 rounded-md bg-surface-100 px-5 sm:px-6 py-5 sm:py-6 mb-12">
          <h3 className="font-display text-xl text-ink-900 mb-3">
            What Ada is, and what she isn't.
          </h3>
          <p className="text-ink-700 leading-relaxed mb-3">
            Ada is an AI assistant. She is not a lawyer. She is not the
            real Ada Lovelace, who died in 1852 and whose work and
            memory belong to her family and to history.
          </p>
          <p className="text-ink-700 leading-relaxed">
            What she is, is a careful intake — built by people who care
            about the ADA community — to help the first conversation
            you have about an access problem be a useful one.
          </p>
        </div>

        {/* CTA + back-to-action */}
        <div className="flex flex-wrap items-center gap-3 mb-16">
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-medium px-6 py-3.5 rounded-md transition-colors"
          >
            Tell Ada what happened
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center px-5 py-3 rounded-md border border-surface-300 text-ink-700 font-medium hover:border-accent-500 hover:text-accent-600 transition-colors"
          >
            Back to home
          </Link>
        </div>

        {/* Sources / further reading */}
        <hr className="border-surface-200 my-10" />
        <h3 className="font-display text-lg text-ink-900 mb-4">
          Further reading
        </h3>
        <ul className="space-y-3 text-sm text-ink-700 list-none p-0">
          <li>
            <a
              href="https://www.bl.uk/people/ada-lovelace"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-1.5 py-1 -my-1 rounded text-accent-500 hover:text-accent-600 underline underline-offset-2"
            >
              Ada Lovelace at the British Library
            </a>{' '}
            — biography and surviving manuscripts.
          </li>
          <li>
            <a
              href="https://www.ada.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-1.5 py-1 -my-1 rounded text-accent-500 hover:text-accent-600 underline underline-offset-2"
            >
              ADA.gov
            </a>{' '}
            — the official U.S. Department of Justice site for the
            Americans with Disabilities Act.
          </li>
          <li>
            <a
              href="https://www.archives.gov/news/articles/capitol-crawl-30th-anniversary"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-1.5 py-1 -my-1 rounded text-accent-500 hover:text-accent-600 underline underline-offset-2"
            >
              The Capitol Crawl, 30th anniversary
            </a>{' '}
            — National Archives feature on the protest that helped pass
            the ADA.
          </li>
        </ul>
      </article>
    </>
  );
}
