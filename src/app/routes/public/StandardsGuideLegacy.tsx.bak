/**
 * /standards-guide — index page for the ADA Standards Guide migration.
 *
 * This is Commit 1 of the Base44 → Vercel port. The minimum viable
 * shape: a single page listing the 10 chapters, using PublicLayout's
 * shell. No hero carousel yet, no search, no sidebar, no
 * ResourceSections — those arrive in Commit 2 alongside the actual
 * chapter pages.
 *
 * The point of landing this first, smallest slice:
 *   - Proves the route works inside the App.tsx router
 *   - Proves the token aliases in app.css resolve correctly (this page
 *     references --heading, --body, --border — Base44 token names that
 *     now map to --color-ink-900, --color-ink-700, --color-surface-200)
 *   - Gives /standards-guide/* links something to navigate back to
 *   - Keeps the commit small enough to roll back cleanly if anything
 *     in the token aliasing breaks the rest of the site
 *
 * Next commit (Commit 2) will port:
 *   - ChapterPageLayout, GuideSection, GuideStyles
 *   - All 10 StandardsCh*.tsx pages
 *   - GuideReadingLevelBar (with page-local state, not session state)
 *   - GuideHeroBanner, GuideLegalCallout, ShareBar, CiteLink,
 *     AutoCiteLinks
 *   - Route wiring for /standards-guide/chapter/:num
 *
 * Commit 3 ports all 43 diagrams.
 * Commit 4 ports all 52 guide pages + their routes.
 * Commits 5–8 wire in Ada CTAs, prompt integration, photo-analyzer
 * cross-refs, and SEO metadata — see the migration plan.
 */

import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { GUIDE_TOPICS } from './standardsGuideIndex.js';
import { CHAPTER_META } from './chapterMeta.js';
import { Breadcrumbs } from '../../components/Breadcrumbs.js';

interface ChapterLink {
  num: number;
  title: string;
  range: string;
}

const CHAPTERS: ChapterLink[] = CHAPTER_META.map((c) => ({
  num: c.num,
  title: c.title,
  range: c.range,
}));

export default function StandardsGuide() {
  return (
    <>
      <Helmet>
        <title>ADA Standards Guide — ADA Legal Link</title>
        <meta
          name="description"
          content="The complete 2010 ADA Accessibility Standards, reorganized for clarity. 10 chapters, 46 topic guides, plain-language explanations, interactive diagrams. Free forever."
        />
        <meta property="og:title" content="ADA Standards Guide — ADA Legal Link" />
        <meta
          property="og:description"
          content="The complete 2010 ADA Accessibility Standards, reorganized for clarity. 10 chapters, 46 topic guides, plain-language explanations, interactive diagrams. Free forever."
        />
        <meta property="og:url" content="https://ada.adalegallink.com/standards-guide" />
        <meta property="og:type" content="article" />
        <meta name="twitter:title" content="ADA Standards Guide — ADA Legal Link" />
        <meta
          name="twitter:description"
          content="The complete 2010 ADA Accessibility Standards, reorganized for clarity. Free forever."
        />
        <link rel="canonical" href="https://ada.adalegallink.com/standards-guide" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'TechArticle',
            headline: 'ADA Standards Guide',
            description:
              'The complete 2010 ADA Accessibility Standards, reorganized by topic, with plain-language explanations and interactive diagrams.',
            url: 'https://ada.adalegallink.com/standards-guide',
            inLanguage: 'en-US',
            isAccessibleForFree: true,
            publisher: {
              '@type': 'Organization',
              name: 'ADA Legal Link',
              url: 'https://ada.adalegallink.com',
            },
            about: {
              '@type': 'Thing',
              name: '2010 ADA Accessibility Standards',
            },
          })}
        </script>
      </Helmet>

      <main id="main" className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
        <header className="mb-12">
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/' },
              { label: 'Standards Guide' },
            ]}
            className="mb-6"
          />
          <p
            className="text-xs uppercase tracking-wider font-mono mb-3"
            style={{ color: 'var(--section-label)' }}
          >
            Standards Guide
          </p>
          <h1
            className="text-4xl sm:text-5xl font-serif mb-4"
            style={{ color: 'var(--heading)', fontFamily: 'var(--font-display)' }}
          >
            The ADA Accessibility Standards, in plain English.
          </h1>
          <p
            className="text-lg max-w-3xl"
            style={{ color: 'var(--body)' }}
          >
            The full 2010 ADA Standards, reorganized by what you actually
            want to find. Every section has a simple explanation, a
            plain-English walkthrough, and the legal text. Interactive
            diagrams show the measurements that matter.
          </p>
        </header>

        <section
          aria-labelledby="chapters-heading"
          className="mb-16"
        >
          <h2
            id="chapters-heading"
            className="text-xs uppercase tracking-wider font-mono mb-4"
            style={{ color: 'var(--body-secondary)' }}
          >
            10 Chapters
          </h2>

          <ol
            className="grid gap-2 sm:grid-cols-2"
            style={{ listStyle: 'none', margin: 0, padding: 0 }}
          >
            {CHAPTERS.map((ch) => (
              <li key={ch.num}>
                <Link
                  to={`/standards-guide/chapter/${ch.num}`}
                  className="flex items-center gap-4 px-5 py-4 rounded-lg no-underline transition-colors"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    minHeight: '44px',
                  }}
                >
                  <span
                    className="shrink-0 flex items-center justify-center font-serif font-bold text-sm"
                    style={{
                      width: '36px',
                      height: '36px',
                      background: 'var(--accent-lighter)',
                      color: 'var(--accent)',
                      borderRadius: '8px',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {ch.num}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span
                      className="block font-medium text-base"
                      style={{ color: 'var(--heading)' }}
                    >
                      {ch.title}
                    </span>
                    <span
                      className="block text-xs font-mono mt-0.5"
                      style={{ color: 'var(--body-secondary)' }}
                    >
                      {ch.range}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="topics-heading"
          className="mb-16"
        >
          <h2
            id="topics-heading"
            className="text-xs uppercase tracking-wider font-mono mb-2"
            style={{ color: 'var(--body-secondary)' }}
          >
            Deep-dive guides
          </h2>
          <p
            className="text-base mb-8 max-w-3xl"
            style={{ color: 'var(--body)' }}
          >
            Topic-focused walkthroughs that go further than the chapter
            overview. Each guide has simple, standard, and legal reading
            levels &mdash; pick the one that fits how you need to read
            right now.
          </p>

          <div className="flex flex-col gap-10">
            {GUIDE_TOPICS.map((topic) => (
              <div key={topic.id}>
                <h3
                  className="font-serif text-xl mb-1"
                  style={{
                    color: 'var(--heading)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {topic.heading}
                </h3>
                <p
                  className="text-sm mb-4"
                  style={{ color: 'var(--body-secondary)' }}
                >
                  {topic.blurb}
                </p>
                <ul
                  className="grid gap-2 sm:grid-cols-2"
                  style={{ listStyle: 'none', margin: 0, padding: 0 }}
                >
                  {topic.guides.map((g) => (
                    <li key={g.slug}>
                      <Link
                        to={`/standards-guide/guide/${g.slug}`}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg no-underline transition-colors"
                        style={{
                          background: 'var(--card-bg)',
                          border: '1px solid var(--border)',
                          minHeight: '44px',
                        }}
                      >
                        <span
                          className="flex-1 min-w-0 text-sm"
                          style={{ color: 'var(--heading)' }}
                        >
                          {g.title}
                        </span>
                        {g.hasDiagram && (
                          <span
                            className="shrink-0 text-xs font-mono px-2 py-0.5 rounded"
                            style={{
                              background: 'var(--accent-lighter)',
                              color: 'var(--accent)',
                            }}
                            aria-label="Includes interactive diagram"
                            title="Includes interactive diagram"
                          >
                            diagram
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <aside
          className="rounded-lg p-6"
          style={{
            background: 'var(--card-bg-tinted)',
            border: '1px solid var(--border)',
          }}
        >
          <h2
            className="text-sm uppercase tracking-wider font-mono mb-2"
            style={{ color: 'var(--section-label)' }}
          >
            Not sure where to start?
          </h2>
          <p
            className="text-base mb-4"
            style={{ color: 'var(--body)' }}
          >
            If you ran into a specific barrier and you want to know
            whether it counts as an ADA violation, you can describe what
            happened to me and I'll tell you what I think.
          </p>
          <Link
            to="/chat"
            className="inline-flex items-center justify-center px-5 py-3 rounded-md font-medium no-underline"
            style={{
              background: 'var(--accent)',
              color: 'var(--btn-text)',
              minHeight: '44px',
            }}
          >
            Talk to Ada
          </Link>
        </aside>
      </main>
    </>
  );
}
