import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function FinalCTANew() {
  return (
    <section aria-labelledby="cta-heading" className="warm-keep-dark" style={{
      background: 'var(--dark-bg)', padding: '100px 1.5rem', textAlign: 'center',
      position: 'relative', overflow: 'hidden'
    }}>
      <div aria-hidden="true" className="section-watermark" style={{
        position: 'absolute', bottom: '5%', left: '3%',
        width: '200px', height: '200px',
        backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994acc34810e36068eddec2/96059e9a4_ADALL-logo-transparent.png)',
        backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
        opacity: 0.04, pointerEvents: 'none',
      }} />
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <h2 id="cta-heading" style={{
          fontFamily: 'Fraunces, serif', fontSize: '2.25rem', fontWeight: 700,
          color: 'var(--dark-heading)', margin: '0 0 1rem', lineHeight: 1.25, fontStyle: 'normal'
        }}>
          The ADA was written so every person could participate fully in American life.
          <br />
          <span style={{ color: 'var(--dark-highlight)' }}>We built this to keep that promise.</span>
        </h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1.05rem',
          color: 'var(--dark-body-secondary)', margin: '0 0 2.5rem', lineHeight: 1.6
        }}>
          Learn your rights with 42 interactive diagrams and 52 plain-language guides. When you're ready, report a violation and we'll connect you with an attorney — at no cost.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={createPageUrl('StandardsGuide')} className="landing-btn-primary" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--accent)', color: 'var(--btn-text)',
            padding: '18px 36px', borderRadius: '10px',
            fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
            textDecoration: 'none', minHeight: '44px', border: 'none',
            transition: 'background 0.15s'
          }}>
            Explore the ADA Standards Guide →
          </Link>
          <Link to={createPageUrl('RightsPathway')} className="landing-btn-secondary" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'transparent', color: 'var(--dark-body-secondary)',
            padding: '18px 36px', borderRadius: '10px',
            fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
            minHeight: '44px', textDecoration: 'none',
            border: '1px solid var(--dark-border)', transition: 'all 0.15s'
          }}>
            Were Your Rights Violated? Find Out →
          </Link>
        </div>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
          color: 'var(--dark-muted)', marginTop: '1.25rem', marginBottom: 0
        }}>
          No account required. No cost. Your information is kept confidential.
        </p>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem',
          color: 'var(--dark-muted)', marginTop: '0.75rem', marginBottom: 0, fontStyle: 'italic'
        }}>
          Attorney-connected violation reporting — launching soon.
        </p>
      </div>
    </section>
  );
}