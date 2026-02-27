import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

const INFO_CARDS = [
  { icon: '📋', heading: 'Where to File', text: <>The <strong>U.S. Department of Justice, Civil Rights Division</strong> handles Title II complaints. You can file online, by mail, or by phone.</>, color: '#1E3A8A', bg: '#EFF6FF' },
  { icon: '💰', heading: 'Cost to You', text: <><strong>Free.</strong> Filing a complaint with the DOJ costs nothing. No attorney is required, though you may consult one.</>, color: '#1E3A8A', bg: '#EFF6FF' },
  { icon: '🔍', heading: 'What Happens Next', text: 'The DOJ reviews your complaint and may investigate, mediate, or refer it to the appropriate federal agency.', color: '#1E3A8A', bg: '#EFF6FF' },
  { icon: '⚖️', heading: 'Your Rights', text: <>You can also file a <strong>private lawsuit</strong> under Title II. An attorney can advise whether this makes sense for your situation.</>, color: '#1E3A8A', bg: '#EFF6FF' }
];

const STEPS = [
  { title: 'Document the violation', text: 'Write down what happened, when, and where. Include the name of the government entity (city, county, state agency), the specific service or facility, and how you were denied access. Take photos if possible.' },
  { title: 'File online with the DOJ', text: "Visit the DOJ Civil Rights Division complaint portal. Select 'Disability' as the basis and 'State or local government' as the entity. You'll describe the violation in your own words — no legal language required." },
  { title: 'Receive your confirmation', text: 'The DOJ will send a confirmation letter with a complaint number. Keep this for your records. You may be contacted for additional information during their review.' },
  { title: 'DOJ reviews and may investigate', text: 'The Civil Rights Division evaluates your complaint and decides whether to investigate, refer it to another agency, or attempt mediation between you and the government entity.' }
];

export default function TitleIIPathway() {
  return (
    <div style={{ backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        <Link to={createPageUrl('StandardsGuide')} style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.88rem', color: '#475569',
          textDecoration: 'none', display: 'inline-block', marginBottom: '24px'
        }}
          onMouseEnter={e => { e.currentTarget.style.color = '#C2410C'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#475569'; }}
        >
          ← Back to Standards Guide
        </Link>

        {/* Hero card */}
        <div style={{
          background: 'white', border: '1px solid #E2E8F0', borderRadius: '24px',
          padding: 'clamp(32px, 5vw, 48px)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          marginBottom: '32px'
        }}>
          <span style={{
            display: 'inline-block', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
            background: '#EFF6FF', color: '#1E3A8A', border: '1px solid #DBEAFE',
            padding: '4px 12px', borderRadius: '100px', marginBottom: '16px'
          }}>
            ADA Title II — Government Services
          </span>
          <h1 style={{
            fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
            fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 16px', lineHeight: 1.25
          }}>
            Government accessibility complaints are handled differently — we'll show you exactly what to do
          </h1>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1.02rem', color: '#475569',
            lineHeight: 1.6, margin: 0
          }}>
            Title II of the ADA covers state and local government services, programs, and facilities. These complaints are filed with the U.S. Department of Justice (DOJ) — not through private attorneys. Here's your step-by-step pathway.
          </p>
        </div>

        {/* Info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '32px' }} className="pathway-info-grid">
          {INFO_CARDS.map(card => (
            <div key={card.heading} style={{
              background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px', background: card.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', marginBottom: '12px'
              }}>
                <span aria-hidden="true">{card.icon}</span>
              </div>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 8px' }}>
                {card.heading}
              </h3>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.88rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                {card.text}
              </p>
            </div>
          ))}
        </div>

        {/* Deadline alert */}
        <div style={{
          background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '16px',
          padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '14px',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', background: '#DBEAFE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', flexShrink: 0
          }}>
            <span aria-hidden="true">⏰</span>
          </div>
          <div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '0.95rem', fontWeight: 700, color: '#1E3A8A', margin: '0 0 8px' }}>
              Filing deadline: 180 days from the violation
            </h2>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.88rem', color: '#1E40AF', lineHeight: 1.6, margin: 0 }}>
              The DOJ recommends filing within 180 days of the discriminatory event. Filing sooner strengthens your case and ensures the details are fresh. There is no strict statute of limitations for DOJ complaints, but agencies may decline to investigate older incidents.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div style={{
          background: 'white', border: '1px solid #E2E8F0', borderRadius: '24px',
          padding: 'clamp(32px, 5vw, 48px)', marginBottom: '32px'
        }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 32px' }}>
            How to file your Title II complaint
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '20px', position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', background: '#F1F5F9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: '#334155'
                  }}>
                    {i + 1}
                  </div>
                  {i < STEPS.length - 1 && <div style={{ width: '2px', flex: 1, background: '#E2E8F0', margin: '4px 0' }} />}
                </div>
                <div style={{ paddingBottom: i < STEPS.length - 1 ? '28px' : '0' }}>
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--slate-900)', margin: '8px 0 8px' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: '#475569', lineHeight: 1.65, margin: 0 }}>
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
          <a href="https://civilrights.justice.gov/report/" target="_blank" rel="noopener noreferrer"
            style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 600,
              color: 'white', background: '#9A3412', padding: '14px 28px',
              borderRadius: '10px', textDecoration: 'none', minHeight: '48px',
              display: 'inline-flex', alignItems: 'center'
            }}>
            File with the DOJ Online →
          </a>
          <a href="tel:+18005141301"
            style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 600,
              color: '#334155', background: 'white', padding: '14px 28px',
              borderRadius: '10px', textDecoration: 'none', border: '2px solid #E2E8F0',
              minHeight: '48px', display: 'inline-flex', alignItems: 'center'
            }}>
            Call DOJ: (800) 514-1301
          </a>
        </div>

        {/* Reassurance */}
        <div style={{
          background: '#F1F5F9', borderRadius: '16px', padding: '24px', textAlign: 'center'
        }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.92rem', color: '#475569', lineHeight: 1.65, margin: 0 }}>
            <strong>Not sure if this is the right path?</strong> If your situation involves a private business rather than a government entity, go back and select the first option — we can connect you with an attorney. Many situations overlap, and that's okay. When in doubt, file with both.
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