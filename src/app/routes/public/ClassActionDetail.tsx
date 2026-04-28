/**
 * ClassActionDetail — public detail for a single class-action listing.
 *
 * Reads /api/public/listings/:slug. Renders:
 *   - Breadcrumb back to /class-actions
 *   - Title + category
 *   - Full description (case context)
 *   - Eligibility criteria grouped by kind: required / preferred /
 *     disqualifying, each as a bulleted list so users can self-assess
 *   - Disqualifying conditions (hard-stops) called out separately
 *   - 'Talk to Ada about this' CTA that POSTs to /api/ada/session with
 *     listing_slug, then redirects to /chat with the pre-bound session
 *
 * What's intentionally NOT shown:
 *   - required_fields (Ada's intake schema, not user-facing)
 *   - ada_prompt_override (internal)
 *
 * Ref: Step 26, Commit 2.
 */

import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useReadingLevel, type ReadingLevel } from '../../components/standards/ReadingLevelContext.js';
import { ReadingLevelToggle } from '../../components/standards/ReadingLevelToggle.js';
import { CurrentReadingLevel } from '../../components/standards/CurrentReadingLevel.js';
import AutoCiteLinks from '../../components/standards/AutoCiteLinks.js';

type CriterionKind = 'required' | 'preferred' | 'disqualifying';

interface EligibilityCriterion {
  description: string;
  kind: CriterionKind;
}

interface PublicListingDetail {
  listing_id: string;
  slug: string;
  title: string;
  category: string;
  short_description: string | null;
  short_description_simple: string | null;
  short_description_professional: string | null;
  full_description: string | null;
  full_description_simple: string | null;
  full_description_professional: string | null;
  eligibility_summary: string | null;
  eligibility_summary_simple: string | null;
  eligibility_summary_professional: string | null;
  law_firm_name: string;
  case_description: string | null;
  case_description_simple: string | null;
  case_description_professional: string | null;
  eligibility_criteria: EligibilityCriterion[];
  disqualifying_conditions: string[];
}

const CATEGORY_LABEL: Record<string, string> = {
  ada_title_i: 'Title I — Employment',
  ada_title_ii: 'Title II — Government',
  ada_title_iii: 'Title III — Public accommodation',
};

/**
 * Pick the right voice variant for a field. Order:
 *   1. The exact variant the user selected (simple / professional), if
 *      that variant has content for this field.
 *   2. Fall back to the 'standard' (canonical) field. This is the
 *      existing column written when the listing was created — it
 *      always has content if the listing is published.
 *   3. Final fallback: empty string. Never crashes if everything is
 *      somehow null.
 *
 * Defining the fallback in one place keeps the JSX below readable.
 */
function pickVariant(
  level: ReadingLevel,
  variants: {
    simple: string | null;
    standard: string | null;
    professional: string | null;
  },
): string {
  if (level === 'simple' && variants.simple) return variants.simple;
  if (level === 'professional' && variants.professional) return variants.professional;
  return variants.standard ?? '';
}

export default function ClassActionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { readingLevel } = useReadingLevel();
  const [listing, setListing] = useState<PublicListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(
        `/api/public/listings/${encodeURIComponent(slug)}`,
      );
      if (resp.status === 404) {
        setNotFound(true);
        return;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as { listing: PublicListingDetail };
      setListing(data.listing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleTalkToAda() {
    if (!slug) return;
    setStartingChat(true);
    setError(null);
    try {
      const resp = await fetch('/api/ada/session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          listing_slug: slug,
          reading_level: readingLevel,
        }),
      });
      if (!resp.ok) {
        const body = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${resp.status}`);
      }
      // Session cookie set by the endpoint; /chat will pick it up via
      // the resume-session flow (existing behavior).
      navigate('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start chat');
      setStartingChat(false);
    }
  }

  if (notFound) {
    return (
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <Link
          to="/class-actions"
          className="text-xs uppercase tracking-wider font-mono text-ink-500 hover:text-accent-600 underline underline-offset-2"
        >
          ← Class actions
        </Link>
        <h1 className="font-display text-3xl text-ink-900 mt-4 mb-4">
          This case isn&rsquo;t active
        </h1>
        <p className="text-ink-700 mb-6">
          The case you&rsquo;re looking for isn&rsquo;t in our active
          directory right now. It may have been closed, or the link may be
          out of date.
        </p>
        <Link
          to="/class-actions"
          className="inline-block px-5 py-2 rounded-md bg-accent-500 text-white font-medium hover:bg-accent-600"
        >
          See active class actions
        </Link>
      </section>
    );
  }

  if (loading)
    return (
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <p className="text-ink-500 italic">Loading&hellip;</p>
      </section>
    );

  if (error && !listing) {
    return (
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <div
          role="alert"
          className="rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {error}
        </div>
      </section>
    );
  }

  if (!listing) return null;

  const required = listing.eligibility_criteria.filter(
    (c) => c.kind === 'required',
  );
  const preferred = listing.eligibility_criteria.filter(
    (c) => c.kind === 'preferred',
  );
  const disqualifying = listing.eligibility_criteria.filter(
    (c) => c.kind === 'disqualifying',
  );

  // Reading-level variant resolution. The page renders the user-facing
  // prose at the level the user picked (simple / standard / professional),
  // falling back to the canonical 'standard' field when a variant is
  // missing for that case. The detail page renders full_description if
  // present, otherwise case_description from the config — same fallback
  // chain as before, just applied to whichever variant set we picked.
  const fullDescription =
    pickVariant(readingLevel, {
      simple: listing.full_description_simple,
      standard: listing.full_description,
      professional: listing.full_description_professional,
    }) ||
    pickVariant(readingLevel, {
      simple: listing.case_description_simple,
      standard: listing.case_description,
      professional: listing.case_description_professional,
    });

  const eligibilitySummary = pickVariant(readingLevel, {
    simple: listing.eligibility_summary_simple,
    standard: listing.eligibility_summary,
    professional: listing.eligibility_summary_professional,
  });

  // Build the meta description: prefer short_description, then the
  // eligibility_summary, then a fallback. Truncate to 155 chars (the
  // ceiling before Google starts snipping snippets). Meta tags use the
  // 'standard' field deliberately — search engines cache this and
  // changing it per user-visit (which won't happen since SSR isn't in
  // play) would be incorrect anyway.
  const rawDescription =
    listing.short_description ??
    listing.eligibility_summary ??
    `Class action: ${listing.title}. Free intake with Ada.`;
  const metaDescription =
    rawDescription.length > 155
      ? `${rawDescription.slice(0, 152).trim()}…`
      : rawDescription;

  const canonicalUrl = `https://ada.adalegallink.com/class-actions/${encodeURIComponent(
    listing.slug,
  )}`;

  // JSON-LD LegalService structured data. schema.org LegalService is
  // the closest fit for 'class action hosted by a law firm.' Google
  // parses this for legal-services snippets in search results. The
  // alternate Event type doesn't fit because this isn't time-bounded.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: listing.title,
    description: metaDescription,
    url: canonicalUrl,
    provider: {
      '@type': 'LegalService',
      name: listing.law_firm_name,
    },
    areaServed: 'United States',
    serviceType: 'Class action intake',
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: canonicalUrl,
      name: 'Free intake via Ada',
    },
  };

  return (
    <article>
      <Helmet>
        <title>{`${listing.title} — ADA Legal Link`}</title>
        <meta name="description" content={metaDescription} />
        <meta
          property="og:title"
          content={`${listing.title} — ADA Legal Link`}
        />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta
          name="twitter:title"
          content={`${listing.title} — ADA Legal Link`}
        />
        <meta name="twitter:description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <section className="max-w-3xl mx-auto px-5 sm:px-8 pt-8 pb-4">
        <Link
          to="/class-actions"
          className="inline-block px-2 py-1.5 -mx-2 -my-1.5 rounded text-xs uppercase tracking-wider font-mono text-ink-500 hover:text-accent-600 underline underline-offset-2"
        >
          ← Class actions
        </Link>
      </section>

      {/* Header */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-4">
        <div className="mb-3">
          <span className="inline-block px-2 py-0.5 rounded-full bg-accent-50 text-accent-600 font-medium text-xs">
            {CATEGORY_LABEL[listing.category] ?? listing.category}
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink-900 mb-3 leading-tight">
          {listing.title}
        </h1>
        <p className="text-sm text-ink-500">
          Case hosted by{' '}
          <span className="text-ink-700 font-medium">{listing.law_firm_name}</span>
        </p>
      </section>

      {/* Reading level toggle. Persists site-wide via ReadingLevelContext.
          When the user picks a level here, it sticks for the chapter-page
          standards guide as well — same control, same key. */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <ReadingLevelToggle />
          <CurrentReadingLevel />
        </div>
      </section>

      {/* Description */}
      {fullDescription && (
        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-8">
          <h2 className="font-display text-xl text-ink-900 mb-3">
            About this case
          </h2>
          <p className="text-ink-700 whitespace-pre-wrap leading-relaxed">
            <AutoCiteLinks>{fullDescription}</AutoCiteLinks>
          </p>
        </section>
      )}

      {/* Eligibility */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-8">
        <h2 className="font-display text-xl text-ink-900 mb-3">
          Who may qualify
        </h2>
        {eligibilitySummary && (
          <p className="text-ink-700 mb-4">
            <AutoCiteLinks>{eligibilitySummary}</AutoCiteLinks>
          </p>
        )}

        {required.length > 0 && (
          <div className="mb-5">
            <h3 className="text-sm font-medium text-ink-900 mb-2">
              All of these must be true:
            </h3>
            <ul className="space-y-1 text-ink-700">
              {required.map((c, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden className="text-accent-500 mt-1">
                    ✓
                  </span>
                  <span>{c.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {preferred.length > 0 && (
          <div className="mb-5">
            <h3 className="text-sm font-medium text-ink-900 mb-2">
              These strengthen your case:
            </h3>
            <ul className="space-y-1 text-ink-700">
              {preferred.map((c, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden className="text-ink-500 mt-1">
                    •
                  </span>
                  <span>{c.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(disqualifying.length > 0 ||
          listing.disqualifying_conditions.length > 0) && (
          <div className="rounded-md border border-warning-500 bg-warning-50 p-4">
            <h3 className="text-sm font-medium text-warning-500 mb-2">
              Don&rsquo;t apply if any of these are true:
            </h3>
            <ul className="space-y-1 text-ink-700 text-sm">
              {disqualifying.map((c, i) => (
                <li key={`dq-crit-${i}`} className="flex gap-2">
                  <span aria-hidden className="text-warning-500 mt-1">
                    ×
                  </span>
                  <span>{c.description}</span>
                </li>
              ))}
              {listing.disqualifying_conditions.map((d, i) => (
                <li key={`dq-cond-${i}`} className="flex gap-2">
                  <span aria-hidden className="text-warning-500 mt-1">
                    ×
                  </span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-16">
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
          >
            {error}
          </div>
        )}
        <div className="rounded-md border border-accent-500 bg-accent-50 p-5 sm:p-6">
          <h2 className="font-display text-xl text-ink-900 mb-2">
            If this sounds like what happened to you
          </h2>
          <p className="text-sm text-ink-700 mb-4">
            Ada will ask a few questions about your situation. If you
            qualify, your information goes directly to the firm handling
            this case. There&rsquo;s no fee to you.
          </p>
          <button
            type="button"
            onClick={handleTalkToAda}
            disabled={startingChat}
            className="inline-block px-5 py-3 rounded-md bg-accent-500 text-white font-medium hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {startingChat ? 'Starting chat…' : 'Talk to Ada about this'}
          </button>
          <p className="text-xs text-ink-500 mt-3">
            ADA Legal Link isn&rsquo;t a law firm. Your conversation with
            Ada is free and confidential. If your situation matches, we
            send your intake to {listing.law_firm_name} — that&rsquo;s it.
          </p>
        </div>
      </section>
    </article>
  );
}
