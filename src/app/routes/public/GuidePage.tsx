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
 *
 * Commit 8 adds per-guide SEO: title, meta description, OG tags,
 * canonical URL, and JSON-LD TechArticle schema. The metadata is
 * derived from the slug + title (no per-guide description fields
 * yet — a generic template with the topic name is good enough for
 * Google's legal-services snippet extraction, and keeps the guide
 * registry lean).
 */

import { Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { GUIDE_LOADERS, titleForSlug } from './standardsGuideIndex.js';
import { PUBLIC_ORIGIN } from '../../../lib/publicOrigin.js';
import { routeMeta } from '../../../lib/seo/routeMeta.js';

function GuideSeo({ slug, title }: { slug: string; title: string }) {
  const canonicalUrl = `${PUBLIC_ORIGIN}/standards-guide/guide/${slug}`;
  // Title, description, canonical and social tags come from RouteSeo
  // (routeMeta.ts). This block only adds the structured data.
  const description = routeMeta(`/standards-guide/guide/${slug}`)?.description ?? '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    url: canonicalUrl,
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    isPartOf: {
      '@type': 'TechArticle',
      name: 'ADA Standards Guide',
      url: `${PUBLIC_ORIGIN}/standards-guide`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ADA Legal Link',
      url: PUBLIC_ORIGIN,
    },
    about: {
      '@type': 'Thing',
      name: 'Americans with Disabilities Act',
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}

// Guides on the same topic that should point at each other. The guide
// bodies themselves are pinned to the B44 digest (guideParity test), so
// the link lives here, in the wrapper.
const RELATED_GUIDE: Record<string, string> = {
  parking: 'parking-requirements',
  'parking-requirements': 'parking',
};

export default function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const Loader = slug ? GUIDE_LOADERS[slug] : undefined;
  const title = slug ? titleForSlug(slug) : null;
  const related = slug ? RELATED_GUIDE[slug] : undefined;

  if (!Loader || !slug || !title) {
    return (
      <div id="main" className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <Helmet>
          <title>Guide not found — ADA Legal Link</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <h1 className="text-2xl font-serif mb-4">Guide not found</h1>
        <p className="text-ink-700 mb-6">
          The guide you're looking for doesn't exist or may have moved. You can{' '}
          <Link to="/standards-guide" className="underline">
            browse all guides
          </Link>{' '}
          or <Link to="/ada" className="underline">talk to Ada</Link> directly.
        </p>
      </div>
    );
  }

  return (
    <>
      <GuideSeo slug={slug} title={title} />
      <Suspense
        fallback={
          <div id="main" className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
            <p className="text-ink-700">Loading guide…</p>
          </div>
        }
      >
        <Loader />
      </Suspense>
      {related && (
        <p
          className="max-w-3xl mx-auto px-5 sm:px-8 py-6"
          style={{ margin: '0 auto' }}
        >
          Related guide:{' '}
          <Link to={`/standards-guide/guide/${related}`} style={{ color: 'var(--accent)' }}>
            {titleForSlug(related)}
          </Link>
        </p>
      )}
    </>
  );
}
