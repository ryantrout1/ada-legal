import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

const features = [
  'Pre-screened cases with documented violations and verified reporters',
  'Exclusive assignment — no bidding wars with other firms',
  'Filter by state, violation type, and business category',
  'Reporter contact info revealed only after you commit',
  'Built-in case management and compliance tracking'
];

const stats = [
  { value: '8,800+', label: 'ADA Title III federal lawsuits filed in 2024', note: null },
  { value: '$10K–75K', label: 'Typical fee recovery per ADA case', note: null },
  { value: '3 States', label: 'Account for 80% of all filings', note: 'CA, NY, FL' },
  { value: '24 hrs', label: 'Maximum time to first reporter contact', note: null }
];

export default function ForAttorneysNew() {
  return (
    <section aria-labelledby="attorneys-heading" style={{
      background: 'var(--page-bg-alt)', padding: '100px 1.5rem',
      position: 'relative', overflow: 'hidden'
    }}>
      <div aria-hidden="true" className="section-watermark" style={{
        position: 'absolute', top: '10%', left: '-3%',
        width: '260px', height: '260px',
        backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994acc34810e36068eddec2/96059e9a4_ADALL-logo-transparent.png)',
        backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
        opacity: 0.025, pointerEvents: 'none',
      }} />
      <div className="landing-attorneys-grid" style={{
        maxWidth: '1100px', margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px',
        alignItems: 'center'
      }}>
        {/* Left column */}
        <div>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--section-label)',
            margin: '0 0 0.75rem'
          }}>
            For Attorneys
          </p>
          <h2 id="attorneys-heading" style={{
            fontFamily: 'Fraunces, serif', fontSize: '2.25rem', fontWeight: 700,
            color: 'var(--heading)', margin: '0 0 1rem', fontStyle: 'normal'
          }}>
            Grow your ADA practice with pre-qualified cases
          </h2>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1.05rem',
            color: 'var(--body)', lineHeight: 1.6, margin: '0 0 2rem'
          }}>
            Stop chasing leads. We deliver documented ADA violations directly to you — pre-screened, exclusive, and ready for action.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem' }}>
            {features.map((f, i) => (
              <li key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                marginBottom: '0.875rem'
              }}>
                <div aria-hidden="true" style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: 'var(--card-bg-tinted)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0, marginTop: '2px'
                }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 6L5 9L10 3" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem',
                  color: 'var(--body)', lineHeight: 1.5
                }}>
                  {f}
                </span>
              </li>
            ))}
          </ul>

          <Link to={createPageUrl('LawyerLanding')} className="landing-btn-attorney" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'transparent', color: 'var(--section-label)',
            padding: '14px 28px', borderRadius: '10px',
            fontSize: '1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
            textDecoration: 'none', minHeight: '44px',
            border: '2px solid var(--accent)', transition: 'all 0.15s'
          }}>
            Learn More & Apply →
          </Link>
        </div>

        {/* Right column — stat cards */}
        <div className="landing-stat-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px'
        }}>
          {stats.map((s, i) => (
            <div key={i} className="landing-stat-card" style={{
              background: 'var(--page-bg)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '24px', textAlign: 'center',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <p style={{
                fontFamily: 'Fraunces, serif', fontSize: '1.75rem', fontWeight: 800,
                color: 'var(--heading)', margin: '0 0 0.5rem', fontStyle: 'normal'
              }}>
                {s.value}
              </p>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
                color: 'var(--body)', margin: 0, lineHeight: 1.4
              }}>
                {s.label}
              </p>
              {s.note && (
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
                  color: 'var(--body-secondary)', margin: '0.25rem 0 0', fontWeight: 600
                }}>
                  {s.note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}