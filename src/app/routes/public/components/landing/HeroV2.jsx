import React from 'react';
import { Link } from 'react-router-dom';
import { useUniversalCta } from '../../../../hooks/useUniversalCta.js';
import { useAdaSoon } from './AdaSoonModal.jsx';

/**
 * HeroV2 — person-first hero for the HomeV2 concept. Opens on the reader's
 * experience ("a barrier shut you out") rather than the platform's feature set.
 * Ada is presented as the conversational front door; the photo is shown as one
 * entry mode into Ada, not a standalone tool. The primary CTA routes through
 * useUniversalCta so it falls back to RightsPathway until ada_universal_cta is on.
 */
export default function HeroV2() {
  const { adaUniversalCta } = useUniversalCta();
  const adaSoon = useAdaSoon();
  const adaLive = adaUniversalCta;

  return (
    <section
      aria-labelledby="v2-hero-heading"
      className="v2-hero warm-keep-dark"
      style={{
        position: 'relative', overflow: 'hidden', background: 'var(--dark-bg)',
        padding: '72px 0 64px',
      }}
    >
      {/* Background glows */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: '-15%', right: '-8%', width: '680px', height: '680px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,146,60,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute', bottom: '-20%', left: '-10%', width: '600px', height: '600px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(194,65,12,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 2rem', position: 'relative' }}>
        <div className="v2-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px', alignItems: 'center' }}>
        <div>
        <div className="v2-fade-up" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <span aria-hidden="true" style={{ width: '32px', height: '2px', background: 'var(--accent)' }} />
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--dark-label)',
          }}>
            ADA Legal Link
          </span>
        </div>

        <h1 id="v2-hero-heading" className="v2-fade-up v2-delay-1" style={{
          fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(2.1rem, 4vw, 3.4rem)', fontWeight: 800,
          lineHeight: 1.1, letterSpacing: '-0.01em', color: 'var(--dark-heading)',
          margin: 0, fontStyle: 'normal',
        }}>
          A barrier shut you out.<br />
          <span style={{ color: 'var(--accent-light)' }}>Let's figure out what to do.</span>
        </h1>

        <p className="v2-fade-up v2-delay-2" style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1.1rem', color: 'var(--dark-body-secondary)',
          lineHeight: 1.65, margin: '1.5rem 0 0', maxWidth: '44ch',
        }}>
          If a building, a website, or a service kept you out when it was supposed to be open
          to you — that wasn't your fault, and it probably wasn't legal. We help you understand
          what happened and connect you with someone who can help. Free.
        </p>

            <p className="v2-fade-up v2-delay-4" style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.88rem', color: 'var(--dark-muted)', margin: '1.5rem 0 0',
            }}>
              <strong style={{ color: 'var(--dark-body)' }}>Free to use. No referral fees. No account required.</strong>{' '}
              Your information stays confidential.
            </p>
        </div>

        {/* Right: Ada front-door card */}
        <div className="v2-fade-up v2-delay-3" style={{
          background: 'linear-gradient(135deg, rgba(124,92,252,0.12), rgba(124,92,252,0.04))',
          border: '1px solid var(--v2-ada-border)', borderRadius: '18px', padding: '28px 30px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div aria-hidden="true" style={{
              width: '54px', height: '54px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--v2-ada), var(--v2-ada-light))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#fff',
              boxShadow: '0 4px 16px rgba(124,92,252,0.4)',
            }}>A</div>
            <div>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '1.15rem', fontWeight: 700,
                color: 'var(--dark-heading)', margin: '0 0 3px', fontStyle: 'normal',
              }}>
                Tell Ada what happened.
              </p>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.92rem',
                color: 'var(--dark-body-secondary)', lineHeight: 1.5, margin: 0,
              }}>
                She'll listen, help you understand whether it's an ADA issue, and — if it is —
                connect you to the right place. In plain language, at your pace.
              </p>
            </div>
          </div>

          {/* Entry-mode chips — descriptive of how you can talk to Ada */}
          <ul className="v2-ada-entry" aria-label="Ways to tell Ada what happened" style={{
            margin: '18px 0 0', padding: 0, listStyle: 'none', display: 'flex', gap: '10px', flexWrap: 'wrap',
          }}>
            {[
              { label: 'Type it', path: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> },
              { label: 'Record it', path: <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /></> },
              { label: 'Share the photo you took', path: <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></> },
            ].map((chip, i) => (
              <li key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 600,
                color: 'var(--dark-body)', background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)', borderRadius: '100px', padding: '7px 14px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--v2-ada-light)"
                  strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {chip.path}
                </svg>
                {chip.label}
              </li>
            ))}
          </ul>

          <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {adaLive ? (
              <Link to={'/ada'} className="v2-btn v2-btn-ada" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'var(--v2-ada)', color: '#fff', padding: '16px 30px',
                borderRadius: '10px', fontSize: '1rem', fontWeight: 700,
                fontFamily: 'Manrope, sans-serif', textDecoration: 'none', minHeight: '44px', border: 'none',
                boxShadow: '0 4px 20px rgba(124,92,252,0.3)',
              }}>
                Tell Ada what happened →
              </Link>
            ) : (
              <>
                <button type="button" onClick={() => adaSoon?.openSoon?.()} className="v2-btn v2-btn-ada" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'var(--v2-ada)', color: '#fff', padding: '16px 30px',
                  borderRadius: '10px', fontSize: '1rem', fontWeight: 700,
                  fontFamily: 'Manrope, sans-serif', minHeight: '44px', border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(124,92,252,0.3)',
                }}>
                  Tell Ada what happened →
                </button>
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem', fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--v2-ada-text)',
                  background: 'rgba(124,92,252,0.12)', border: '1px solid var(--v2-ada-border)',
                  padding: '5px 12px', borderRadius: '100px',
                }}>
                  Opening soon
                </span>
              </>
            )}
          </div>

          {/* Meet-her link — lets visitors explore Ada before she opens */}
          <p style={{ margin: '16px 0 0' }}>
            <Link
              to="/about-ada"
              style={{
                display: 'inline-flex', alignItems: 'center',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', fontWeight: 600,
                color: 'var(--v2-ada-text)', textDecoration: 'underline',
                textUnderlineOffset: '3px', minHeight: '44px',
              }}
            >
              Why she's called Ada →
            </Link>
          </p>
        </div>
        </div>
      </div>
    </section>
  );
}
