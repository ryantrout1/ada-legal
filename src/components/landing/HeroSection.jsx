import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section style={{
      background: 'linear-gradient(160deg, var(--slate-900) 0%, #0F172A 100%)',
      color: 'white',
      padding: 'clamp(4rem, 10vw, 7rem) 1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle decorative element */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(194,65,12,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <h1 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(2.25rem, 5.5vw, 3.75rem)',
          fontWeight: 700,
          lineHeight: 1.1,
          color: 'white',
          marginBottom: '1.5rem',
          marginTop: 0
        }}>
          Every Barrier Deserves<br />an Advocate
        </h1>
        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--slate-400)',
          maxWidth: '600px',
          margin: '0 auto 2.5rem',
          lineHeight: 1.6
        }}>
          Report ADA violations and get matched with experienced attorneys — at no cost to you. We believe access is a right, not a privilege.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to={createPageUrl('Intake')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.625rem',
              background: 'var(--terra-600)', color: 'white',
              padding: '0.875rem 2rem', borderRadius: 'var(--radius-md)',
              fontSize: '1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
              textDecoration: 'none', minHeight: '48px',
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--terra-700)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--terra-600)'}
          >
            Report a Violation <ArrowRight size={18} />
          </Link>
          <a
            href="#how-it-works"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'transparent', color: 'white',
              padding: '0.875rem 2rem', borderRadius: 'var(--radius-md)',
              fontSize: '1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
              textDecoration: 'none', minHeight: '48px',
              border: '2px solid rgba(255,255,255,0.3)',
              transition: 'border-color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}