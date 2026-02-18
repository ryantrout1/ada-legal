import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function FinalCTANew() {
  return (
    <section aria-labelledby="cta-heading" style={{
      background: '#1E293B', padding: '100px 1.5rem', textAlign: 'center'
    }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <h2 id="cta-heading" style={{
          fontFamily: 'Fraunces, serif', fontSize: '2.25rem', fontWeight: 700,
          color: 'white', margin: '0 0 1rem', lineHeight: 1.25, fontStyle: 'normal'
        }}>
          The ADA was written so every person could participate fully in American life.
          <br />
          <span style={{ color: '#EA580C' }}>We exist to keep that promise.</span>
        </h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1.05rem',
          color: '#CBD5E1', margin: '0 0 2.5rem', lineHeight: 1.6
        }}>
          It takes five minutes to report a violation. It could change everything.
        </p>
        <Link to={createPageUrl('Intake')} className="landing-btn-primary" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: '#C2410C', color: 'white',
          padding: '18px 40px', borderRadius: '10px',
          fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
          textDecoration: 'none', minHeight: '44px', border: 'none',
          transition: 'background 0.15s'
        }}>
          Report a Violation →
        </Link>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
          color: '#475569', marginTop: '1.25rem', marginBottom: 0
        }}>
          No account required. No cost. Your information is kept confidential.
        </p>
      </div>
    </section>
  );
}