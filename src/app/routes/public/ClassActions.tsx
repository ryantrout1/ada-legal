/**
 * ClassActions — public directory of active class-action listings.
 *
 * Reads /api/public/listings (cached 5min browser / 15min CDN).
 * Lists one card per listing with title, short description, firm
 * name, and category pill. Category + search filters; no pagination
 * yet (pilot scale = tens of listings, not thousands).
 *
 * Each card links to /class-actions/:slug for the detail page.
 *
 * Design matches the Home page language: serif headline, plain-
 * language subhead, generous whitespace, no stock imagery. The
 * directory is rigorous, not a marketplace sizzle reel.
 *
 * Ref: Step 26, Commit 2.
 */

import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

type Category = 'ada_title_i' | 'ada_title_ii' | 'ada_title_iii';

interface PublicListing {
  listing_id: string;
  slug: string;
  title: string;
  category: string;
  tier: string;
  short_description: string | null;
  eligibility_summary: string | null;
  law_firm_name: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  ada_title_i: 'Title I — Employment',
  ada_title_ii: 'Title II — Government',
  ada_title_iii: 'Title III — Public accommodation',
};

export default function ClassActions() {
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [category, setCategory] = useState<Category | ''>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search.trim()) params.set('q', search.trim());
      const resp = await fetch(`/api/public/listings?${params.toString()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as {
        listings: PublicListing[];
        total_count: number;
      };
      setListings(data.listings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 200);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <>
      <Helmet>
        <title>Class actions — ADA Legal Link</title>
        <meta
          name="description"
          content="Active ADA class actions where one lawsuit may cover many people hurt the same way. Free, plain-language intake with Ada."
        />
        <meta property="og:title" content="Class actions — ADA Legal Link" />
        <meta
          property="og:description"
          content="Active ADA class actions where one lawsuit may cover many people hurt the same way. Free, plain-language intake."
        />
        <meta property="og:url" content="https://ada.adalegallink.com/class-actions" />
        <meta name="twitter:title" content="Class actions — ADA Legal Link" />
        <meta
          name="twitter:description"
          content="Active ADA class actions where one lawsuit may cover many people hurt the same way. Free, plain-language intake."
        />
        <link rel="canonical" href="https://ada.adalegallink.com/class-actions" />
      </Helmet>

      <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 pb-8 sm:pt-16 sm:pb-12">
        <h1 className="font-display text-4xl sm:text-5xl text-ink-900 mb-4 leading-tight">
          Class actions
        </h1>
        <p className="text-lg text-ink-700 max-w-2xl">
          Active cases where one lawsuit might cover many people hurt the
          same way. If your story matches, you can join without hiring a
          lawyer yourself.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-16">
        {/* Filters */}
        <fieldset className="mb-8 flex flex-wrap items-center gap-4 text-sm">
          <legend className="sr-only">Filter class actions</legend>
          <label className="flex items-center gap-2">
            <span className="text-ink-700 font-medium">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category | '')}
              className="rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
            >
              <option value="">All</option>
              <option value="ada_title_i">Title I (employment)</option>
              <option value="ada_title_ii">Title II (government)</option>
              <option value="ada_title_iii">
                Title III (public accommodation)
              </option>
            </select>
          </label>

          <label className="flex items-center gap-2 flex-1 min-w-[240px]">
            <span className="text-ink-700 font-medium">Search</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hotels, service animals, employment&hellip;"
              className="flex-1 rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900 placeholder-ink-500"
            />
          </label>
        </fieldset>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
          >
            {error}
          </div>
        )}

        {loading && listings.length === 0 && (
          <p className="text-ink-500 italic">Loading&hellip;</p>
        )}

        {!loading && listings.length === 0 && (
          <div className="rounded-md border border-surface-200 bg-white p-8 text-center">
            <p className="text-ink-900 font-medium mb-2">
              No active class actions match.
            </p>
            <p className="text-sm text-ink-500 mb-4">
              If your situation involves an ADA violation that isn&rsquo;t
              listed here, Ada can still help.
            </p>
            <Link
              to="/chat"
              className="inline-block px-5 py-2 rounded-md bg-accent-500 text-white font-medium hover:bg-accent-600"
            >
              Talk to Ada
            </Link>
          </div>
        )}

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {listings.map((l) => (
            <li key={l.listing_id}>
              <Link
                to={`/class-actions/${encodeURIComponent(l.slug)}`}
                className="block h-full rounded-md border border-surface-200 bg-white p-5 hover:border-accent-500 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="font-display text-xl text-ink-900 leading-snug">
                    {l.title}
                  </h2>
                </div>
                {l.short_description && (
                  <p className="text-sm text-ink-700 mb-3">
                    {l.short_description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-surface-200 text-xs">
                  <CategoryPill category={l.category} />
                  <span className="text-ink-500 ml-auto">
                    by {l.law_firm_name}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function CategoryPill({ category }: { category: string }) {
  const label = CATEGORY_LABEL[category] ?? category;
  return (
    <span className="inline-block px-2 py-0.5 rounded-full bg-accent-50 text-accent-600 font-medium">
      {label}
    </span>
  );
}
