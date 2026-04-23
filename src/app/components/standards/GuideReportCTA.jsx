import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { startAdaSessionWithContext } from './startAdaSession.js';
import { titleForSlug } from '../../routes/public/standardsGuideIndex.js';
import { useReadingLevel } from './ReadingLevelContext.js';

/**
 * GuideReportCTA — the CTA at the bottom of every Guide page.
 *
 * Rewritten from base44-archive's GuideReportCTA.jsx:
 *   - Original pointed to a `RightsPathway` page (never built on main)
 *   - Original "Home" secondary link replaced with "/"
 *   - CTA body copy tightened to match Ada's voice: no plural-we,
 *     Ada speaks in first person, no "60 seconds" / "launching soon"
 *     marketing register.
 *   - Commit 5: the primary CTA now calls /api/ada/session with a
 *     page_context payload derived from the current URL so Ada
 *     greets the user with acknowledgment of the specific guide
 *     topic they were reading.
 *
 * Same visual (dark card section, orange accent CTA button), but the
 * destination is now the chat surface where Ada actually lives.
 *
 * This component has no props — each of the 46 Guide<X>.jsx pages
 * drops it in with `<GuideReportCTA />`. To stay prop-free the slug
 * is derived from the URL (`/standards-guide/guide/:slug`) and the
 * title is looked up in standardsGuideIndex.
 */
export default function GuideReportCTA() {
  const location = useLocation();
  const navigate = useNavigate();
  const { readingLevel } = useReadingLevel();
  const [starting, setStarting] = useState(false);

  // Derive the guide slug from the current pathname. The page structure
  // is /standards-guide/guide/<slug>; anything else (e.g. a stray use
  // on a chapter) falls back to no context, so the CTA still works.
  const slug = slugFromPath(location.pathname);
  const title = slug ? titleForSlug(slug) : null;

  async function handleClick() {
    if (starting) return;
    setStarting(true);
    if (slug && title) {
      await startAdaSessionWithContext({
        kind: 'guide',
        ref: slug,
        title,
        readingLevel,
      });
    }
    navigate('/chat');
  }

  return (
    <div role="region" aria-label="Tell Ada what happened" className="warm-keep-dark" style={{
      background: 'var(--dark-card-bg)', padding: '64px 40px', textAlign: 'center'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{
          fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          fontWeight: 700, color: 'var(--dark-heading)', margin: '0 0 12px'
        }}>
          Think this happened to you?
        </h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
          color: 'var(--dark-muted)', lineHeight: 1.7, margin: '0 0 28px'
        }}>
          Tell me what happened. I'll help you figure out what applies and what to do next.
        </p>
        <button
          type="button"
          onClick={() => { void handleClick(); }}
          disabled={starting}
          className="sg-cta-link"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'var(--accent)', color: 'var(--btn-text)',
            fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 600,
            padding: '14px 28px', borderRadius: '10px',
            border: 'none',
            textDecoration: 'none', minHeight: '44px',
            cursor: starting ? 'wait' : 'pointer',
            opacity: starting ? 0.7 : 1,
            transition: 'background 0.15s'
          }}
        >
          {starting ? 'Opening chat…' : 'Talk to Ada'}
          {!starting && <ArrowRight size={18} aria-hidden="true" />}
        </button>
        <div style={{ marginTop: '16px' }}>
          <Link to="/" className="sg-cta-link" style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
            color: 'var(--dark-muted)', textDecoration: 'underline',
            minHeight: '44px', display: 'inline-flex', alignItems: 'center'
          }}>
            Learn how it works
          </Link>
        </div>
      </div>
    </div>
  );
}

function slugFromPath(pathname) {
  // Matches /standards-guide/guide/<slug> with optional trailing slash.
  const match = pathname.match(/^\/standards-guide\/guide\/([^/?#]+)\/?$/);
  return match ? match[1] : null;
}
