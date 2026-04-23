import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * GuideReportCTA — the CTA at the bottom of every Guide page.
 *
 * Rewritten from base44-archive's GuideReportCTA.jsx:
 *   - Original pointed to a `RightsPathway` page (never built on main)
 *   - Original "Home" secondary link replaced with "/"
 *   - CTA body copy tightened to match Ada's voice: no plural-we,
 *     Ada speaks in first person, no "60 seconds" / "launching soon"
 *     marketing register.
 *
 * Same visual (dark card section, orange accent CTA button), but the
 * destination is now the chat surface where Ada actually lives.
 */
export default function GuideReportCTA() {
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
        <Link to="/chat" className="sg-cta-link" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'var(--accent)', color: 'var(--btn-text)',
          fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 600,
          padding: '14px 28px', borderRadius: '10px',
          textDecoration: 'none', minHeight: '44px',
          transition: 'background 0.15s'
        }}>
          Talk to Ada <ArrowRight size={18} aria-hidden="true" />
        </Link>
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
