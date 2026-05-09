import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ArrowRight } from 'lucide-react';

export default function LawyerHero() {
  return (
    <section aria-labelledby="lawyer-hero-heading" className="warm-keep-dark" style={{
      background: 'linear-gradient(160deg, var(--heading) 0%, #0F172A 100%)',
      color: 'var(--dark-heading)',
      padding: 'clamp(4rem, 10vw, 7rem) 1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', bottom: '-30%', left: '-10%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(194,65,12,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700,
          color: '#FDBA74', textTransform: 'uppercase', letterSpacing: '0.1em',
          marginBottom: '1rem', display: 'block'
        }}>
          For Attorneys
        </span>
        <h1 id="lawyer-hero-heading" style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(2rem, 5vw, 3.25rem)',
          fontWeight: 700, lineHeight: 1.1,
          color: 'var(--dark-heading)', marginBottom: '1.5rem', marginTop: 0
        }}>
          We're building a small,<br />intentional network</h1>
        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--dark-muted)',
          maxWidth: '580px', margin: '0 auto 2.5rem', lineHeight: 1.6
        }}>
          ADA Legal Link is a free intake and triage service. When a case warrants legal action, we connect the person with vetted attorneys who handle this work. No subscription, no referral fee.
        </p>
        <Link
          to={createPageUrl('LawyerRegister')} className="landing-cta"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.625rem',
            background: 'var(--section-label)', color: 'var(--dark-heading)',
            padding: '0.875rem 2rem', borderRadius: 'var(--radius-md)',
            fontSize: '1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
            textDecoration: 'none', minHeight: '48px',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--section-label)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--section-label)'}
        >
          Apply to join <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}