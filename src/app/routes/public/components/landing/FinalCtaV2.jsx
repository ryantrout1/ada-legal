import React from 'react';
import { Link } from 'react-router-dom';
import { useUniversalCta } from '../../../../hooks/useUniversalCta.js';
import { useAdaSoon } from './AdaSoonModal.jsx';

export default function FinalCtaV2() {
  const { adaUniversalCta } = useUniversalCta();
  const adaSoon = useAdaSoon();
  const adaLive = adaUniversalCta;

  return (
    <section
      aria-labelledby="v2-cta-heading"
      className="v2-section warm-keep-dark"
      style={{ background: 'var(--dark-bg)', padding: '110px 0', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
    >
      <div aria-hidden="true" style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '700px', height: '400px', background: 'radial-gradient(ellipse, rgba(251,146,60,0.08), transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 2rem', position: 'relative' }}>
        <h2 id="v2-cta-heading" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '2.4rem', fontWeight: 800, color: 'var(--dark-heading)', lineHeight: 1.22, margin: '0 0 1.2rem', fontStyle: 'normal' }}>
          The ADA was written so everyone could take part in American life.
          <br />
          <span style={{ color: 'var(--dark-highlight)' }}>We built this to help keep that promise.</span>
        </h2>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.1rem', color: 'var(--dark-body-secondary)', lineHeight: 1.6, margin: '0 0 2.5rem' }}>
          Understand what happened, or talk it through with Ada. Whenever you're ready — there's no
          clock running, and it costs you nothing.
        </p>
        <div className="v2-cta-row" style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {adaLive ? (
            <Link to={'/chat'} className="v2-btn v2-btn-ada" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--v2-ada)',
              color: '#fff', padding: '18px 36px', borderRadius: '10px', fontSize: '1.1rem',
              fontWeight: 700, fontFamily: 'Manrope, sans-serif', textDecoration: 'none', minHeight: '44px', border: 'none',
              boxShadow: '0 4px 20px rgba(124,92,252,0.3)',
            }}>
              Tell Ada what happened →
            </Link>
          ) : (
            <button type="button" onClick={() => adaSoon?.openSoon?.()} className="v2-btn v2-btn-ada" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--v2-ada)',
              color: '#fff', padding: '18px 36px', borderRadius: '10px', fontSize: '1.1rem',
              fontWeight: 700, fontFamily: 'Manrope, sans-serif', minHeight: '44px', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(124,92,252,0.3)',
            }}>
              Tell Ada what happened →
            </button>
          )}
          <Link to={'/standards-guide'} className="v2-btn v2-btn-primary" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent)',
            color: 'var(--btn-text)', padding: '18px 36px', borderRadius: '10px', fontSize: '1.1rem',
            fontWeight: 700, fontFamily: 'Manrope, sans-serif', textDecoration: 'none', minHeight: '44px',
            border: 'none', boxShadow: '0 4px 20px rgba(194,65,12,0.25)',
          }}>
            Explore the Standards Guide →
          </Link>
        </div>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', color: 'var(--dark-muted)', marginTop: '1.5rem', marginBottom: 0 }}>
          No account required. No cost. Your information is kept confidential.
        </p>
      </div>
    </section>
  );
}
