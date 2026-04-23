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

function GuideSeo({ slug, title }: { slug: string; title: string }) {
  const canonicalUrl = `https://ada.adalegallink.com/standards-guide/guide/${slug}`;
  const titleText = `${title} — ADA Standards Guide`;
  const description = `Plain-language guide to ${title.toLowerCase()}. Simple, standard, and legal reading levels. Part of the ADA Legal Link Standards Guide — free, always.`;

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
      url: 'https://ada.adalegallink.com/standards-guide',
    },
    publisher: {
      '@type': 'Organization',
      name: 'ADA Legal Link',
      url: 'https://ada.adalegallink.com',
    },
    about: {
      '@type': 'Thing',
      name: 'Americans with Disabilities Act',
    },
  };

  return (
    <Helmet>
      <title>{titleText}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={titleText} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="article" />
      <meta name="twitter:title" content={titleText} />
      <meta name="twitter:description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}

export default function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const Loader = slug ? GUIDE_LOADERS[slug] : undefined;
  const title = slug ? titleForSlug(slug) : null;

  if (!Loader || !slug || !title) {
    return (
      <main id="main" className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
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
          or <Link to="/chat" className="underline">talk to Ada</Link> directly.
        </p>
      </main>
    );
  }

  return (
    <>
      <GuideSeo slug={slug} title={title} />
      <Suspense
        fallback={
          <main id="main" className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
            <p className="text-ink-700">Loading guide…</p>
          </main>
        }
      >
        <Loader />
      </Suspense>
    </>
  );
}
