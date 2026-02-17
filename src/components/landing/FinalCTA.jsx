import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA({ heading, subtitle, buttonText, buttonLink, variant }) {
  const isDark = variant === 'dark';
  return (
    <section style={{
      backgroundColor: isDark ? 'var(--slate-900)' : 'var(--terra-100)',
      padding: 'clamp(3rem, 8vw, 4.5rem) 1.5rem',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <h2 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
          fontWeight: 700,
          color: isDark ? 'white' : 'var(--slate-900)',
          marginBottom: '0.75rem', marginTop: 0
        }}>
          {heading}
        </h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
          color: isDark ? 'var(--slate-300)' : 'var(--slate-600)',
          marginBottom: '2rem', lineHeight: 1.6
        }}>
          {subtitle}
        </p>
        <Link
          to={buttonLink}
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
          {buttonText} <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}