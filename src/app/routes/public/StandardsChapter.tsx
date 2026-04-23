/**
 * /standards-guide/chapter/:num — placeholder chapter page.
 *
 * Commit 1 ships this as a stub so the /standards-guide/ index page's
 * chapter links resolve to something (not a 404) during the migration.
 *
 * Commit 2 will replace this component with the real chapter port:
 * reads the StandardsCh<n>.tsx page, renders via ChapterPageLayout,
 * with all three reading levels, all diagrams, and the full section
 * accordion.
 *
 * Until then, this page just confirms the chapter number and range,
 * and points the user to /chat if they want to talk to Ada about a
 * real barrier. Keeps the site shape intact while the rest of the
 * migration lands.
 */

import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';

interface ChapterMeta {
  num: number;
  title: string;
  range: string;
}

const CHAPTER_META: Record<string, ChapterMeta> = {
  '1': { num: 1, title: 'Application & Administration', range: '§101–§106' },
  '2': { num: 2, title: 'Scoping Requirements', range: '§201–§244' },
  '3': { num: 3, title: 'Building Blocks', range: '§301–§309' },
  '4': { num: 4, title: 'Accessible Routes', range: '§401–§410' },
  '5': { num: 5, title: 'General Site & Building Elements', range: '§501–§505' },
  '6': { num: 6, title: 'Plumbing Elements & Facilities', range: '§601–§612' },
  '7': { num: 7, title: 'Communication Elements & Features', range: '§701–§708' },
  '8': { num: 8, title: 'Special Rooms, Spaces & Elements', range: '§801–§813' },
  '9': { num: 9, title: 'Built-In Elements', range: '§901–§904' },
  '10': { num: 10, title: 'Recreation Facilities', range: '§1001–§1011' },
};

export default function StandardsChapter() {
  const { num } = useParams<{ num: string }>();
  const meta = num ? CHAPTER_META[num] : undefined;

  if (!meta) {
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

  return (
    <>
      <Helmet>
        <title>
          Chapter {meta.num}: {meta.title} — ADA Legal Link
        </title>
        <meta
          name="description"
          content={`Chapter ${meta.num} of the ADA Standards covers ${meta.title.toLowerCase()} (${meta.range}).`}
        />
      </Helmet>

      <main id="main" className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <nav aria-label="Breadcrumb" className="mb-6">
          <Link
            to="/standards-guide"
            className="text-xs uppercase tracking-wider font-mono underline-offset-2 hover:underline"
            style={{ color: 'var(--body-secondary)' }}
          >
            ← Back to Standards Guide
          </Link>
        </nav>

        <header className="mb-8">
          <p
            className="text-xs uppercase tracking-wider font-mono mb-3"
            style={{ color: 'var(--section-label)' }}
          >
            Chapter {meta.num} — {meta.range}
          </p>
          <h1
            className="text-4xl font-serif mb-4"
            style={{ color: 'var(--heading)', fontFamily: 'var(--font-display)' }}
          >
            {meta.title}
          </h1>
        </header>

        <section
          className="rounded-lg p-6 mb-8"
          style={{
            background: 'var(--card-bg-warm)',
            border: '1px solid var(--border)',
          }}
        >
          <p
            className="text-xs uppercase tracking-wider font-mono mb-2"
            style={{ color: 'var(--body-secondary)' }}
          >
            Under construction
          </p>
          <p className="text-base" style={{ color: 'var(--body)' }}>
            I'm still moving this chapter over. The full content —
            section-by-section explanations at three reading levels,
            with interactive diagrams — will be here soon. In the
            meantime, if you have a specific question about this area
            of the standards, I can help you out directly.
          </p>
        </section>

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
      </main>
    </>
  );
}
