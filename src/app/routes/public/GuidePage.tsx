/**
 * GuidePage — the route renderer for /standards-guide/guide/:slug.
 *
 * Reads the slug from the URL, looks it up in GUIDE_LOADERS, and
 * lazy-loads the matching Guide<X>.jsx component. Each Guide page is
 * already self-contained (hero banner, sections, CTA) so this is
 * essentially a router shim.
 *
 * If the slug doesn't match anything we surface a simple 'guide not
 * found' state with a link back to the guide index. Keeping the error
 * surface in-page rather than redirecting to a 404 means the user's
 * browser history is clean.
 */

import { Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GUIDE_LOADERS } from './standardsGuideIndex.js';

export default function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const Loader = slug ? GUIDE_LOADERS[slug] : undefined;

  if (!Loader) {
    return (
      <main id="main" className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <h1 className="text-2xl font-serif mb-4">Guide not found</h1>
        <p className="text-ink-700 mb-6">
          The guide you're looking for doesn't exist or may have moved. You can{' '}
          <Link to="/standards-guide" className="underline">
            browse all guides
          </Link>{' '}
          or <Link to="/chat" className="underline">talk to Ada</Link> directly.
        </p>
      </main>
    );
  }

  return (
    <Suspense
      fallback={
        <main id="main" className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
          <p className="text-ink-700">Loading guide…</p>
        </main>
      }
    >
      <Loader />
    </Suspense>
  );
}
