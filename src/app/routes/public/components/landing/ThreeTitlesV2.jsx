import React from 'react';
import { Link } from 'react-router-dom';
import { useUniversalCta } from '../../../../hooks/useUniversalCta.js';
import { useAdaSoon } from './AdaSoonModal.jsx';

const CARDS = [
  {
    accent: 'var(--accent)', iconBg: '#FFF7ED', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l1.2-5h15.6L21 9" /><path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" /><path d="M3 9h18" /><path d="M9 20v-5h6v5" />
      </svg>
    ),
    badge: { text: 'We handle this', bg: 'var(--card-bg-tinted)', color: 'var(--section-label)' },
    title: 'Title III', sub: 'Businesses & public accommodations', subColor: 'var(--section-label)',
    desc: 'Any private business open to the public — its physical spaces, its website, its app. A store, restaurant, hotel, doctor\u2019s office, or site that wasn\u2019t accessible.',
    file: <><b style={{ color: 'var(--heading)' }}>Connect through Ada</b> — to a vetted ADA attorney, at no cost to you.</>,
  },
  {
    accent: '#2563EB', iconBg: '#EFF6FF', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="21" x2="21" y2="21" /><line x1="6" y1="18" x2="6" y2="10" /><line x1="10" y1="18" x2="10" y2="10" /><line x1="14" y1="18" x2="14" y2="10" /><line x1="18" y1="18" x2="18" y2="10" /><polygon points="12 2 21 7 3 7" />
      </svg>
    ),
    badge: { text: "We'll point the way", bg: 'var(--card-bg)', color: 'var(--body-secondary)' },
    title: 'Title II', sub: 'State & local government', subColor: '#2563EB',
    desc: 'Services, programs, and facilities of state and local government — courthouses, transit, DMVs, public schools, parks, voting locations.',
    file: <><b style={{ color: 'var(--heading)' }}>Often a DOJ complaint</b> — Ada points you to the right process.</>,
  },
  {
    accent: 'var(--accent-light)', iconBg: '#FFFBEB', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    badge: { text: 'Coming soon', bg: 'var(--card-bg)', color: 'var(--body-secondary)' },
    title: 'Title I', sub: 'Employment', subColor: 'var(--section-label)',
    desc: 'Hiring, firing, promotions, and accommodations at work. Routes through the EEOC and has a strict 180-day deadline — different in shape from physical and digital barriers.',
    file: <><b style={{ color: 'var(--heading)' }}>Not yet built into Ada</b> — but she can point you to the right resource.</>,
  },
];

export default function ThreeTitlesV2() {
  const { adaUniversalCta } = useUniversalCta();
  const adaSoon = useAdaSoon();
  const adaLive = adaUniversalCta;

  return (
    <section
      aria-labelledby="v2-titles-heading"
      className="v2-section"
      style={{ background: 'var(--page-bg)', padding: '100px 0', borderTop: '1px solid var(--border-lighter)' }}
    >
      <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '620px', margin: '0 auto 3rem' }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--section-label)', margin: '0 0 0.85rem' }}>
            Know your rights
          </p>
          <h2 id="v2-titles-heading" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '2.1rem', fontWeight: 800, color: 'var(--heading)', margin: '0 0 1rem', fontStyle: 'normal' }}>
            The ADA protects you in three places
          </h2>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.05rem', color: 'var(--body)', lineHeight: 1.6, margin: 0 }}>
            Which part of the law applies depends on <em>where</em> the barrier was. You don't have to
            figure this out alone — but here's the shape of it.
          </p>
        </div>

        <div className="v2-titles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '22px' }}>
          {CARDS.map((c) => (
            <div key={c.title} className="v2-tcard" style={{
              background: 'var(--page-bg-subtle)', border: '1px solid var(--border)', borderRadius: '16px',
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}>
              <div aria-hidden="true" style={{ height: '4px', background: c.accent }} />
              <div style={{ padding: '26px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span aria-hidden="true" style={{ width: '40px', height: '40px', borderRadius: '10px', background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.accent }}>{c.icon}</span>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 10px', borderRadius: '100px', background: c.badge.bg, color: c.badge.color, border: '1px solid var(--border)' }}>
                    {c.badge.text}
                  </span>
                </div>
                <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 3px', fontStyle: 'normal' }}>{c.title}</h3>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 600, color: c.subColor, margin: '0 0 12px' }}>{c.sub}</p>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.88rem', color: 'var(--body)', lineHeight: 1.6, margin: '0 0 14px' }}>{c.desc}</p>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem', color: 'var(--body)', lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: '12px', margin: 'auto 0 0' }}>{c.file}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '2.5rem auto 0' }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.92rem', color: 'var(--body-secondary)', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
            Not sure which one applies? That's completely normal — many situations overlap. Ada asks
            simple questions to find the right path for you.
          </p>
          {adaLive ? (
            <Link to={'/chat'} className="v2-btn v2-btn-ada" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--v2-ada)',
              color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '10px',
              fontSize: '0.95rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif', textDecoration: 'none', minHeight: '44px',
              boxShadow: '0 4px 20px rgba(124,92,252,0.25)',
            }}>
              Tell Ada what happened →
            </Link>
          ) : (
            <button type="button" onClick={() => adaSoon?.openSoon?.()} className="v2-btn v2-btn-ada" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--v2-ada)',
              color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '10px',
              fontSize: '0.95rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif', minHeight: '44px', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(124,92,252,0.25)',
            }}>
              Tell Ada what happened →
            </button>
          )}
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem', color: 'var(--body-secondary)', fontStyle: 'italic', lineHeight: 1.55, margin: '1.75rem auto 0', maxWidth: '640px' }}>
            The ADA also includes Title IV (telecommunications relay, handled by the FCC) and Title V
            (anti-retaliation and other provisions). Titles I, II, and III cover the vast majority of
            individual claims.
          </p>
        </div>
      </div>
    </section>
  );
}
