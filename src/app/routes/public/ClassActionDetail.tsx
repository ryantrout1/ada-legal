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
import { Link, useNavigate, useParams } from 'react-router-dom';

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
  full_description: string | null;
  eligibility_summary: string | null;
  law_firm_name: string;
  case_description: string | null;
  eligibility_criteria: EligibilityCriterion[];
  disqualifying_conditions: string[];
}

const CATEGORY_LABEL: Record<string, string> = {
  ada_title_i: 'Title I — Employment',
  ada_title_ii: 'Title II — Government',
  ada_title_iii: 'Title III — Public accommodation',
};

export default function ClassActionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
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
          reading_level: 'standard',
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

  return (
    <article>
      <section className="max-w-3xl mx-auto px-5 sm:px-8 pt-8 pb-4">
        <Link
          to="/class-actions"
          className="text-xs uppercase tracking-wider font-mono text-ink-500 hover:text-accent-600 underline underline-offset-2"
        >
          ← Class actions
        </Link>
      </section>

      {/* Header */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-8">
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

      {/* Description */}
      {(listing.full_description ?? listing.case_description) && (
        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-8">
          <h2 className="font-display text-xl text-ink-900 mb-3">
            About this case
          </h2>
          <p className="text-ink-700 whitespace-pre-wrap leading-relaxed">
            {listing.full_description ?? listing.case_description}
          </p>
        </section>
      )}

      {/* Eligibility */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-8">
        <h2 className="font-display text-xl text-ink-900 mb-3">
          Who may qualify
        </h2>
        {listing.eligibility_summary && (
          <p className="text-ink-700 mb-4">{listing.eligibility_summary}</p>
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
