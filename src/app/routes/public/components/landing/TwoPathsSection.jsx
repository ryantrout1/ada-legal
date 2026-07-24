import React from 'react';
import { Link } from 'react-router-dom';
import { useUniversalCta } from '../../../../hooks/useUniversalCta.js';
import { useAdaSoon } from './AdaSoonModal.jsx';

/**
 * TwoPathsSection — the spine of the page, reduced to two honest paths:
 *   Understand it  → the Standards Guide (the one genuinely self-serve thing)
 *   Act on it      → Ada, who validates the barrier and connects to the right place
 * No "document" pillar and no claims about evidence — that's the attorney's job
 * once the two parties are connected, not ours.
 */
export default function TwoPathsSection() {
  const { adaUniversalCta } = useUniversalCta();
  const adaSoon = useAdaSoon();
  const adaLive = adaUniversalCta;

  return (
    <section
      aria-labelledby="v2-spine-heading"
      className="v2-section"
      style={{ background: 'var(--page-bg-alt)', padding: '100px 0' }}
    >
      <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 4rem' }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem', fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--section-label)', margin: '0 0 0.85rem',
          }}>
            What you can do here
          </p>
          <h2 id="v2-spine-heading" style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '2.6rem', fontWeight: 800,
            color: 'var(--heading)', margin: '0 0 1rem', fontStyle: 'normal',
          }}>
            Two ways forward
          </h2>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1.1rem', color: 'var(--body)',
            lineHeight: 1.65, margin: 0,
          }}>
            You can learn what the law says on your own, or talk it through with Ada and let her
            point you to the right place. Most people do a little of both.
          </p>
        </div>

        <div className="v2-spine-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '28px',
          maxWidth: '920px', margin: '0 auto',
        }}>
          {/* Understand */}
          <article className="v2-card" style={{
            background: 'var(--page-bg)', border: '1px solid var(--border)', borderRadius: '18px',
            padding: '44px 40px', display: 'flex', flexDirection: 'column',
          }}>
            <div aria-hidden="true" style={{
              width: '60px', height: '60px', borderRadius: '15px', background: 'var(--card-bg-warm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.75rem', color: 'var(--accent)',
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--section-label)', margin: '0 0 1rem' }}>
              Understand it
            </p>
            <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.65rem', fontWeight: 800, color: 'var(--heading)', margin: '0 0 0.45rem', fontStyle: 'normal' }}>
              "Was that legal?"
            </h3>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1rem', color: 'var(--body)', lineHeight: 1.7, flex: 1, margin: '0 0 1.5rem' }}>
              Find out whether what happened is actually an ADA issue, and what the law says about it.
              We turned 279 pages of federal accessibility standards into plain-language guides and
              interactive diagrams you can search in seconds — no legal background needed.
            </p>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem', color: 'var(--body-secondary)', borderTop: '1px solid var(--border-lighter)', paddingTop: '14px', margin: '0 0 1.5rem' }}>
              <b style={{ color: 'var(--heading)', fontWeight: 700 }}>The Standards Guide</b> · 52 guides · 42 interactive diagrams · instant search
            </p>
            <Link to={'/standards-guide'} className="v2-btn v2-btn-primary" style={{
              alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--accent)', color: 'var(--btn-text)', border: 'none',
              padding: '14px 26px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700,
              fontFamily: 'Manrope, sans-serif', textDecoration: 'none', minHeight: '44px',
              boxShadow: '0 4px 20px rgba(194,65,12,0.25)',
            }}>
              Explore the Standards Guide →
            </Link>
          </article>

          {/* Act */}
          <article className="v2-card" style={{
            background: 'var(--page-bg)', border: '1px solid var(--border)', borderRadius: '18px',
            padding: '44px 40px', display: 'flex', flexDirection: 'column',
          }}>
            <div aria-hidden="true" style={{
              width: '60px', height: '60px', borderRadius: '15px', background: 'var(--card-bg-tinted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.75rem', color: 'var(--accent)',
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--section-label)', margin: '0 0 1rem' }}>
              Act on it
            </p>
            <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.65rem', fontWeight: 800, color: 'var(--heading)', margin: '0 0 0.45rem', fontStyle: 'normal' }}>
              "What do I do now?"
            </h3>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1rem', color: 'var(--body)', lineHeight: 1.7, flex: 1, margin: '0 0 1.5rem' }}>
              Tell Ada what happened. She'll help you validate the barrier, explain your options in
              plain language, and connect you where it matters — a vetted ADA attorney at no cost to
              you, the right complaint process, or an honest "this isn't an ADA case" if that's what it is.
            </p>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem', color: 'var(--body-secondary)', borderTop: '1px solid var(--border-lighter)', paddingTop: '14px', margin: '0 0 1.5rem' }}>
              <b style={{ color: 'var(--heading)', fontWeight: 700 }}>Talk to Ada</b> · validate the barrier · connect to the right place
            </p>
            {adaLive ? (
              <Link to={'/ada'} className="v2-btn v2-btn-ada" style={{
                alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'var(--v2-ada)', color: '#fff', padding: '14px 26px',
                borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700,
                fontFamily: 'Manrope, sans-serif', textDecoration: 'none', minHeight: '44px', border: 'none',
                boxShadow: '0 4px 20px rgba(124,92,252,0.25)',
              }}>
                Tell Ada what happened →
              </Link>
            ) : (
              <button type="button" onClick={() => adaSoon?.openSoon?.()} className="v2-btn v2-btn-ada" style={{
                alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'var(--v2-ada)', color: '#fff', padding: '14px 26px',
                borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700,
                fontFamily: 'Manrope, sans-serif', minHeight: '44px', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(124,92,252,0.25)',
              }}>
                Tell Ada what happened →
              </button>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
