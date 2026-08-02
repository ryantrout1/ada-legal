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
            fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--dark-label)',
          }}>
            ADA Legal Link
          </span>
        </div>

        <h1 id="v2-hero-heading" className="v2-fade-up v2-delay-1" style={{
          fontFamily: 'var(--font-body)', fontSize: 'clamp(2.1rem, 4vw, 3.4rem)', fontWeight: 800,
          lineHeight: 1.1, letterSpacing: '-0.01em', color: 'var(--dark-heading)',
          margin: 0, fontStyle: 'normal',
        }}>
          A barrier shut you out.<br />
          <span style={{ color: 'var(--accent-light)' }}>Let's figure out what to do.</span>
        </h1>

        <p className="v2-fade-up v2-delay-2" style={{
          fontFamily: 'var(--font-body)', fontSize: '1.1rem', color: 'var(--dark-body-secondary)',
          lineHeight: 1.65, margin: '1.5rem 0 0', maxWidth: '44ch',
        }}>
          If a building, a website, or a service kept you out when it was supposed to be open
          to you — that wasn't your fault, and it probably wasn't legal. We help you understand
          what happened and connect you with someone who can help. Free.
        </p>

            <p className="v2-fade-up v2-delay-4" style={{
              fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--dark-muted)', margin: '1.5rem 0 0',
            }}>
              <strong style={{ color: 'var(--dark-body)' }}>Free to use. No referral fees. No account required.</strong>{' '}
              Your information stays confidential.
            </p>
        </div>

        {/* Right column: Ada, then Spot stacked beneath her. Ada stays the
            front door — she is bigger, carries the entry chips, and comes
            first. Spot is the second way in, not a peer. */}
        <div style={{ display: 'grid', gap: '20px' }}>
        {/* Spot — the live product, so it leads.
         *
         * Ada is still "opening soon"; Spot ships today. The card that can
         * actually be used sits on top and carries the weight: full-size
         * avatar, the entry chips, the primary button. Ada keeps her copy
         * and her badge below, quieter.
         *
         * The button is a light terracotta fill with dark text rather than
         * Ada's solid-fill-white-text. Any terracotta dark enough for white
         * to reach 7:1 drops below 3:1 as a block against this background —
         * the same exclusion the admin pill hit. #FB923C with #141820 text
         * is 7.85:1 as text AND as a block.
         *
         * COPY IS A DRAFT — Gina reviews all claimant-facing copy before it
         * goes public. The screening framing is not stylistic: Spot must
         * never be described as certifying compliance.
         */}
        <div className="v2-fade-up v2-delay-3" style={{
          background: 'linear-gradient(135deg, rgba(194,65,12,0.14), rgba(194,65,12,0.05))',
          border: '1px solid rgba(251,146,60,0.3)', borderRadius: '18px', padding: '28px 30px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div aria-hidden="true" style={{
              width: '54px', height: '54px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #C2410C, #FB923C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.5rem', color: '#fff',
              boxShadow: '0 4px 16px rgba(194,65,12,0.4)',
            }}>S</div>
            <div>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: '1.15rem', fontWeight: 700,
                color: 'var(--dark-heading)', margin: '0 0 3px', fontStyle: 'normal',
              }}>
                Show Spot a photo.
              </p>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: '0.92rem',
                color: 'var(--dark-body-secondary)', lineHeight: 1.5, margin: 0,
              }}>
                A ramp, a doorway, a restroom, a parking space. Spot flags what looks
                like a barrier so you know what to ask about — a screening read, not a
                compliance check.
              </p>
            </div>
          </div>

          <ul aria-label="Ways to use Spot" style={{
            margin: '18px 0 0', padding: 0, listStyle: 'none', display: 'flex', gap: '10px', flexWrap: 'wrap',
          }}>
            {[
              { label: 'Take a photo', path: <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></> },
              { label: 'Upload one you have', path: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></> },
              { label: 'Get a written report', path: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></> },
            ].map((chip, i) => (
              <li key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 600,
                color: 'var(--dark-body)', background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)', borderRadius: '100px', padding: '7px 14px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FDBA74"
                  strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {chip.path}
                </svg>
                {chip.label}
              </li>
            ))}
          </ul>

          <div style={{ marginTop: '20px' }}>
            <Link to="/spot" className="v2-btn" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: '#FB923C', color: '#141820', padding: '16px 30px',
              borderRadius: '10px', fontSize: '1rem', fontWeight: 700,
              fontFamily: 'var(--font-body)', textDecoration: 'none', minHeight: '44px', border: 'none',
            }}>
              Show Spot a photo →
            </Link>
          </div>
        </div>

        {/* Right: Ada front-door card */}
        <div className="v2-fade-up v2-delay-4" style={{
          background: 'linear-gradient(135deg, rgba(124,92,252,0.10), rgba(124,92,252,0.03))',
          border: '1px solid var(--v2-ada-border)', borderRadius: '18px', padding: '24px 30px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div aria-hidden="true" style={{
              width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--v2-ada), var(--v2-ada-light))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.3rem', color: '#fff',
            }}>A</div>
            <div>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: '1.15rem', fontWeight: 700,
                color: 'var(--dark-heading)', margin: '0 0 3px', fontStyle: 'normal',
              }}>
                Tell Ada what happened.
              </p>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: '0.92rem',
                color: 'var(--dark-body-secondary)', lineHeight: 1.5, margin: 0,
              }}>
                She'll listen, help you understand whether it's an ADA issue, and — if it is —
                connect you to the right place. In plain language, at your pace.
              </p>
            </div>
          </div>

          {/* Ada's entry chips moved off this card when Spot took the lead.
              Two chip rows stacked read as two equal offers, and Ada is not
              the live one. Her copy still says she listens; the how lives on
              /about-ada. COPY CHANGE — for Gina. */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {adaLive ? (
              <Link to={'/ada'} className="v2-btn v2-btn-ada" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                // Light fill, dark text — NOT solid violet with white. White on
                // ada-400 is 4.38:1, below the 7:1 floor, and no violet fixes
                // it: darkening until white clears 7:1 drops the button below
                // 3:1 as a block against the hero, failing 1.4.11 instead.
                // ada-200 with ink text is 8.4:1 both ways. Same exclusion the
                // admin pill and the Spot button hit.
                background: 'var(--color-ada-200)', color: '#141820', padding: '16px 30px',
                borderRadius: '10px', fontSize: '1rem', fontWeight: 700,
                fontFamily: 'var(--font-body)', textDecoration: 'none', minHeight: '44px', border: 'none',
                boxShadow: '0 4px 20px rgba(124,92,252,0.22)',
              }}>
                Tell Ada what happened →
              </Link>
            ) : (
              <>
                <button type="button" onClick={() => adaSoon?.openSoon?.()} className="v2-btn v2-btn-ada" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  // Light fill, dark text — NOT solid violet with white. White on
                // ada-400 is 4.38:1, below the 7:1 floor, and no violet fixes
                // it: darkening until white clears 7:1 drops the button below
                // 3:1 as a block against the hero, failing 1.4.11 instead.
                // ada-200 with ink text is 8.4:1 both ways. Same exclusion the
                // admin pill and the Spot button hit.
                background: 'var(--color-ada-200)', color: '#141820', padding: '16px 30px',
                  borderRadius: '10px', fontSize: '1rem', fontWeight: 700,
                  fontFamily: 'var(--font-body)', minHeight: '44px', border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(124,92,252,0.22)',
                }}>
                  Tell Ada what happened →
                </button>
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 700,
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
                fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 600,
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
      </div>
    </section>
  );
}
