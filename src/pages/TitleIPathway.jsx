import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

const INFO_CARDS = [
  { icon: '📋', heading: 'Where to File', text: <>The <strong>Equal Employment Opportunity Commission (EEOC)</strong>. You can file online, in person at a local EEOC office, or by phone.</>, color: '#7C2D12', bg: '#FFFBEB' },
  { icon: '🏢', heading: 'Which Employers', text: <>Title I applies to employers with <strong>15 or more employees</strong>, employment agencies, labor organizations, and joint labor-management committees.</>, color: '#7C2D12', bg: '#FFFBEB' },
  { icon: '💰', heading: 'Cost to You', text: <><strong>Free to file.</strong> The EEOC investigates at no cost. If they issue a 'Right to Sue' letter, you can then hire an attorney — many work on contingency.</>, color: '#7C2D12', bg: '#FFFBEB' },
  { icon: '⚖️', heading: 'What You Can Recover', text: <>Remedies may include <strong>back pay, reinstatement, reasonable accommodation</strong>, compensatory damages, and attorney's fees if the case goes to court.</>, color: '#7C2D12', bg: '#FFFBEB' }
];

const STEPS = [
  { title: 'Document everything now', text: 'Write down dates, what happened, who was involved, and any witnesses. Save emails, texts, performance reviews, accommodation requests, and denial letters. Documentation is the foundation of your case.' },
  { title: 'File a Charge of Discrimination with the EEOC', text: "Use the EEOC's online portal to submit your charge. You'll describe the discrimination, identify your employer, and explain the disability-related issue. The EEOC will assign an investigator to your case." },
  { title: 'EEOC investigation', text: 'The EEOC notifies your employer and investigates. This may include requesting documents, interviewing witnesses, and attempting mediation. The process typically takes several months.' },
  { title: 'Resolution or Right to Sue', text: "The EEOC may resolve the case through mediation or a finding of discrimination. If they can't resolve it, they'll issue a 'Right to Sue' letter, giving you 90 days to file a federal lawsuit. At that point, hiring an ADA employment attorney is strongly recommended." }
];

export default function TitleIPathway() {
  return (
    <div style={{ backgroundColor: 'var(--page-bg-subtle)', minHeight: 'calc(100vh - 200px)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        <Link to={createPageUrl('StandardsGuide')} style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.88rem', color: 'var(--body-secondary)',
          textDecoration: 'none', display: 'inline-block', marginBottom: '24px'
        }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--body-secondary)'; }}
        >
          ← Back to Standards Guide
        </Link>

        {/* Hero card */}
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '24px',
          padding: 'clamp(32px, 5vw, 48px)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          marginBottom: '32px'
        }}>
          <span style={{
            display: 'inline-block', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
            background: '#FFFBEB', color: '#7C2D12', border: '1px solid #FEF3C7',
            padding: '4px 12px', borderRadius: '100px', marginBottom: '16px'
          }}>
            ADA Title I — Employment
          </span>
          <h1 style={{
            fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
            fontWeight: 700, color: 'var(--heading)', margin: '0 0 16px', lineHeight: 1.25
          }}>
            Workplace disability discrimination has a strict filing deadline — here's what you need to know right now
          </h1>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1.02rem', color: 'var(--body-secondary)',
            lineHeight: 1.6, margin: 0
          }}>
            Title I of the ADA covers employment discrimination. These complaints are filed with the Equal Employment Opportunity Commission (EEOC), not through private lawsuits initially. Time is critical — here's your pathway.
          </p>
        </div>

        {/* URGENT Deadline alert — BEFORE info cards */}
        <div style={{
          background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '16px',
          padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '14px',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', background: '#FEF3C7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', flexShrink: 0
          }}>
            <span aria-hidden="true">🚨</span>
          </div>
          <div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '0.95rem', fontWeight: 700, color: '#7C2D12', margin: '0 0 8px' }}>
              Critical deadline: 180 days to file with the EEOC
            </h2>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.88rem', color: '#7C2D12', lineHeight: 1.6, margin: 0 }}>
              You must file a charge of discrimination with the EEOC within <strong>180 days</strong> of the discriminatory event. In states with a local anti-discrimination agency (most states), this extends to <strong>300 days</strong>. Missing this deadline means losing your right to pursue the claim. Do not wait.
            </p>
          </div>
        </div>

        {/* Info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '32px' }} className="pathway-info-grid">
          {INFO_CARDS.map(card => (
            <div key={card.heading} style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px', background: card.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', marginBottom: '12px'
              }}>
                <span aria-hidden="true">{card.icon}</span>
              </div>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '0.95rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 8px' }}>
                {card.heading}
              </h3>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.88rem', color: 'var(--body-secondary)', lineHeight: 1.6, margin: 0 }}>
                {card.text}
              </p>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '24px',
          padding: 'clamp(32px, 5vw, 48px)', marginBottom: '32px'
        }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 32px' }}>
            How to file your Title I complaint
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '20px', position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', background: 'var(--page-bg-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: 'var(--body)'
                  }}>
                    {i + 1}
                  </div>
                  {i < STEPS.length - 1 && <div style={{ width: '2px', flex: 1, background: 'var(--border)', margin: '4px 0' }} />}
                </div>
                <div style={{ paddingBottom: i < STEPS.length - 1 ? '28px' : '0' }}>
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '8px 0 8px' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: 'var(--body-secondary)', lineHeight: 1.65, margin: 0 }}>
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
          <a href="https://publicportal.eeoc.gov/Portal/Login" target="_blank" rel="noopener noreferrer"
            style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 600,
              color: 'var(--btn-text)', background: 'var(--section-label)', padding: '14px 28px',
              borderRadius: '10px', textDecoration: 'none', minHeight: '48px',
              display: 'inline-flex', alignItems: 'center'
            }}>
            File with the EEOC Online →
          </a>
          <a href="tel:+18006694000"
            style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 600,
              color: 'var(--body)', background: 'var(--card-bg)', padding: '14px 28px',
              borderRadius: '10px', textDecoration: 'none', border: '2px solid var(--border)',
              minHeight: '48px', display: 'inline-flex', alignItems: 'center'
            }}>
            Call EEOC: (800) 669-4000
          </a>
        </div>

        {/* Reassurance */}
        <div style={{
          background: 'var(--page-bg-subtle)', borderRadius: '16px', padding: '24px', textAlign: 'center'
        }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.92rem', color: 'var(--body-secondary)', lineHeight: 1.65, margin: 0 }}>
            <strong>Not sure if this is the right path?</strong> Some situations involve both employment discrimination and access to a business or service. If your employer is also a public-facing business and the violation happened in a space open to the public, you may have both Title I and Title III claims. When in doubt, file with the EEOC first (because of the strict deadline), then come back to explore your other options.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .pathway-info-grid { grid-template-columns: 1fr !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { transition: none !important; animation: none !important; }
        }
      `}</style>
    </div>
  );
}