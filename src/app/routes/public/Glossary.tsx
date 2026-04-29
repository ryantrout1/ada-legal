/**
 * Glossary — public glossary route at /glossary.
 *
 * Satisfies WCAG 2.2 SC 3.1.3 (Unusual Words) and SC 3.1.4
 * (Abbreviations) at the page level: a mechanism is available
 * for identifying definitions of words and abbreviations used on
 * the site. Linked from the global footer so it's discoverable
 * from every page.
 *
 * Each entry has a stable id={slug} so URLs like /glossary#ada or
 * /glossary#good-faith deep-link directly to the entry.
 *
 * Round 3 AAA+COGA Group D, items #45 (D1) and #46 (D2).
 */

import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../../components/Breadcrumbs.js';
import { getSortedEntries, GLOSSARY } from '../../data/glossary.js';

export default function Glossary() {
  const entries = getSortedEntries();

  return (
    <>
      <Helmet>
        <title>Glossary · ADA Legal Link</title>
        <meta
          name="description"
          content="Plain-language definitions of acronyms and legal terms used across ADA Legal Link."
        />
        <link rel="canonical" href="https://ada.adalegallink.com/glossary" />
      </Helmet>

      <section className="max-w-2xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Glossary' },
          ]}
          className="mb-8"
        />
        <p className="font-mono text-xs sm:text-sm uppercase tracking-[0.18em] text-accent-500 mb-5">
          Glossary
        </p>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight text-ink-900 mb-6">
          Plain-language definitions.
        </h1>
        <p className="text-lg text-ink-700 leading-relaxed mb-10">
          Acronyms, legal terms, and concepts used across the site —
          explained without jargon. If a word in a chapter or in
          conversation with Ada doesn't make sense, it's probably here.
        </p>

        <dl className="space-y-8">
          {entries.map((entry) => (
            <div
              key={entry.slug}
              id={entry.slug}
              className="scroll-mt-8"
            >
              <dt className="font-display text-2xl text-ink-900 mb-1">
                {entry.term}
                {entry.expansion && (
                  <span className="block text-sm font-mono text-ink-500 font-normal mt-1">
                    {entry.expansion}
                  </span>
                )}
              </dt>
              <dd className="text-ink-700 leading-relaxed mb-3 ml-0">
                {entry.definition}
              </dd>
              {entry.seeAlso && entry.seeAlso.length > 0 && (
                <div className="text-sm text-ink-500">
                  See also:{' '}
                  {entry.seeAlso.map((slug, idx) => {
                    const ref = GLOSSARY[slug];
                    if (!ref) return null;
                    return (
                      <span key={slug}>
                        <a
                          href={`#${slug}`}
                          className="inline-block px-1.5 py-1 -my-1 rounded text-accent-500 hover:text-accent-600 underline underline-offset-2"
                        >
                          {ref.term}
                        </a>
                        {idx < entry.seeAlso!.length - 1 && ', '}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </dl>

        <div className="mt-16 rounded-lg border border-surface-200 bg-surface-100 px-6 py-6 sm:px-8 sm:py-8">
          <h2 className="font-display text-xl text-ink-900 mb-2">
            Term not here?
          </h2>
          <p className="text-ink-700 leading-relaxed mb-4">
            We add entries based on what comes up in real conversations
            and what readers tell us is confusing. Ask Ada and she'll
            usually be able to explain — and we'll know to add the term
            here for next time.
          </p>
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-medium px-5 py-3 rounded-md transition-colors"
          >
            Talk to Ada
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="text-sm text-ink-700 border-t border-surface-200 pt-6 mt-10">
          <p>Last updated: April 2026.</p>
          <p className="mt-2">
            We update this glossary as new terms come up and as readers
            tell us what's confusing.
          </p>
        </div>
      </section>
    </>
  );
}
