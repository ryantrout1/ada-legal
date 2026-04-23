/**
 * /standards-guide/chapter/:num — dispatcher route.
 *
 * Commit 2 replaces the stub 'under construction' page with a real
 * dispatcher that lazy-loads the correct StandardsCh<n> component
 * based on the :num URL param. Unknown numbers render a not-found
 * page (same as before).
 *
 * Why a dispatcher instead of 10 separate <Route> elements?
 *
 * - One import instead of ten in App.tsx. Keeps App.tsx compact.
 * - The chapter number 'feels' like data — picking the right page
 *   module by a numeric ID is exactly what dispatching is for.
 * - Lazy loading means the chapter JSX (which is large — 60-84
 *   lines of inline JSX content per chapter, plus stub diagram
 *   imports) doesn't enter the main bundle until a user navigates
 *   into /standards-guide. Keeps /chat and / fast.
 *
 * The Suspense fallback is a minimal loading line. When Commit 3
 * lands real diagram SVGs the per-chapter bundle will grow
 * substantially, making lazy loading more valuable.
 */

import { Helmet } from 'react-helmet-async';
import { Suspense, lazy } from 'react';
import type { LazyExoticComponent, ComponentType } from 'react';
import { Link, useParams } from 'react-router-dom';

const StandardsCh1 = lazy(() => import('./standards/StandardsCh1.js'));
const StandardsCh2 = lazy(() => import('./standards/StandardsCh2.js'));
const StandardsCh3 = lazy(() => import('./standards/StandardsCh3.js'));
const StandardsCh4 = lazy(() => import('./standards/StandardsCh4.js'));
const StandardsCh5 = lazy(() => import('./standards/StandardsCh5.js'));
const StandardsCh6 = lazy(() => import('./standards/StandardsCh6.js'));
const StandardsCh7 = lazy(() => import('./standards/StandardsCh7.js'));
const StandardsCh8 = lazy(() => import('./standards/StandardsCh8.js'));
const StandardsCh9 = lazy(() => import('./standards/StandardsCh9.js'));
const StandardsCh10 = lazy(() => import('./standards/StandardsCh10.js'));

const CHAPTERS: Record<string, LazyExoticComponent<ComponentType>> = {
  '1': StandardsCh1,
  '2': StandardsCh2,
  '3': StandardsCh3,
  '4': StandardsCh4,
  '5': StandardsCh5,
  '6': StandardsCh6,
  '7': StandardsCh7,
  '8': StandardsCh8,
  '9': StandardsCh9,
  '10': StandardsCh10,
};

function Loading() {
  return (
    <main id="main" className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
      <p
        className="text-xs uppercase tracking-wider font-mono"
        style={{ color: 'var(--body-secondary)' }}
      >
        Loading chapter…
      </p>
    </main>
  );
}

function NotFound() {
  return (
    <main id="main" className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
      <Helmet>
        <title>Chapter not found — ADA Legal Link</title>
      </Helmet>
      <p
        className="text-xs uppercase tracking-wider font-mono mb-3"
        style={{ color: 'var(--body-secondary)' }}
      >
        Not found
      </p>
      <h1
        className="text-3xl font-serif mb-4"
        style={{ color: 'var(--heading)', fontFamily: 'var(--font-display)' }}
      >
        That chapter doesn't exist.
      </h1>
      <p className="text-base" style={{ color: 'var(--body)' }}>
        The ADA Standards have 10 chapters.{' '}
        <Link
          to="/standards-guide"
          className="underline"
          style={{ color: 'var(--accent)' }}
        >
          See all chapters
        </Link>
        .
      </p>
    </main>
  );
}

export default function StandardsChapter() {
  const { num } = useParams<{ num: string }>();
  const Chapter = num ? CHAPTERS[num] : undefined;

  if (!Chapter) {
    return <NotFound />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <Chapter />
    </Suspense>
  );
}
