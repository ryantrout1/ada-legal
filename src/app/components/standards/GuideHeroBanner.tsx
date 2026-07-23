/**
 * GuideHeroBanner — the dark banner at the top of every chapter page.
 * Contains the breadcrumb, a range badge (e.g. "§401–410"), the
 * chapter title, and a ShareBar.
 *
 * Ported from base44-archive src/components/guide/GuideHeroBanner.jsx.
 * Simplifications relative to the original:
 *   - Removed trackEvent analytics call (analytics not wired yet)
 *   - Logo watermark restored in M2 Phase 2 against the local asset.
 *     It was dropped at port time because Base44 served it out of
 *     base44-prod/public/; M1 Phase 4 brought the logo in-repo.
 *   - Hardcoded /standards-guide route instead of createPageUrl()
 *
 * The banner is intentionally ALWAYS dark. It stays dark in every
 * display mode. The light chapter content sits below it. This
 * creates the visual "cover page → body text" rhythm the Base44
 * design established.
 */

import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ShareBar from './ShareBar.js';

interface GuideHeroBannerProps {
  title: string;
  typeBadge: string;
  badgeColor?: string;
}

export default function GuideHeroBanner({
  title,
  typeBadge,
  badgeColor,
}: GuideHeroBannerProps) {
  return (
    <header
      aria-labelledby="guide-page-heading"
      style={{
        background: 'var(--dark-card-bg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Logo watermark — B44 parity (GuideHeroBanner.jsx). Dropped at
          port time because the asset was Supabase-hosted; restored in M2
          now that the logo is served locally (M1 Phase 4). Decorative
          only: aria-hidden, no pointer events, 4% opacity. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '2%',
          width: '200px',
          height: '200px',
          backgroundImage: 'url(/logo-transparent.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          opacity: 0.04,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '80px 40px 40px',
        }}
      >
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: '16px' }}>
          <ol
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
            }}
          >
            <li>
              <Link
                to="/"
                style={{
                  fontFamily: 'var(--font-body), Manrope, sans-serif',
                  fontSize: '0.8125rem',
                  color: 'var(--dark-muted)',
                  textDecoration: 'none',
                }}
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight size={14} style={{ color: 'var(--dark-muted)' }} />
            </li>
            <li>
              <Link
                to="/standards-guide"
                style={{
                  fontFamily: 'var(--font-body), Manrope, sans-serif',
                  fontSize: '0.8125rem',
                  color: 'var(--dark-muted)',
                  textDecoration: 'none',
                }}
              >
                ADA Standards Guide
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight size={14} style={{ color: 'var(--dark-muted)' }} />
            </li>
            <li>
              <span
                aria-current="page"
                style={{
                  fontFamily: 'var(--font-body), Manrope, sans-serif',
                  fontSize: '0.8125rem',
                  color: 'var(--dark-body)',
                }}
              >
                {title}
              </span>
            </li>
          </ol>
        </nav>

        {/* Badge */}
        <span
          style={{
            display: 'inline-block',
            background: badgeColor || 'var(--accent)',
            color: 'var(--dark-heading)',
            fontFamily: 'var(--font-body), Manrope, sans-serif',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '4px 12px',
            borderRadius: '100px',
            marginBottom: '12px',
          }}
        >
          {typeBadge}
        </span>

        {/* Title */}
        <h1
          id="guide-page-heading"
          style={{
            fontFamily: 'var(--font-display), Fraunces, serif',
            fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            color: 'var(--dark-heading)',
            margin: '0 0 16px',
          }}
        >
          {title}
        </h1>

        <div style={{ marginTop: '16px' }}>
          <ShareBar />
        </div>
      </div>
    </header>
  );
}
