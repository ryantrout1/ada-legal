import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useComingSoon } from '../useComingSoonModal';

export default function FinalCTANew() {
  const { openModal } = useComingSoon();
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
          <span style={{ color: '#F97316' }}>We built this to keep that promise.</span>
        </h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1.05rem',
          color: '#CBD5E1', margin: '0 0 2.5rem', lineHeight: 1.6
        }}>
          Learn your rights with 42 interactive diagrams and 52 plain-language guides. When you're ready, report a violation and we'll connect you with an attorney — at no cost.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={createPageUrl('StandardsGuide')} className="landing-btn-primary" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: '#C2410C', color: 'white',
            padding: '18px 36px', borderRadius: '10px',
            fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
            textDecoration: 'none', minHeight: '44px', border: 'none',
            transition: 'background 0.15s'
          }}>
            Explore the ADA Standards Guide →
          </Link>
          <button onClick={() => openModal('report_violation')} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'transparent', color: '#4B5563',
            padding: '18px 36px', borderRadius: '10px',
            fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
            minHeight: '44px', cursor: 'pointer',
            border: '1px solid #475569', transition: 'all 0.15s'
          }}>
            Report a Violation — Coming Soon
          </button>
        </div>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
          color: '#4B5563', marginTop: '1.25rem', marginBottom: 0
        }}>
          No account required. No cost. Your information is kept confidential.
        </p>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
          color: '#4B5563', marginTop: '0.75rem', marginBottom: 0
        }}>
          Not sure where to start?{' '}
          <button onClick={() => openModal('pathways')} style={{ color: '#F97316', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: 'inherit', padding: 0 }}>
            Take the Rights Assessment — Coming Soon
          </button>
        </p>
      </div>
    </section>
  );
}