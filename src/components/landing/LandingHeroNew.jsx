import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useComingSoon } from '../useComingSoonModal';

const HERO_QUOTES = [
  {
    text: "The ADA was written to protect people like me. But 279 pages of legal standards don\u2019t help if you can\u2019t find what applies to you. I needed something better \u2014 so we built it.",
    name: 'Gina',
    initial: 'G',
    role: 'Co-Founder \u00B7 J.D. \u00B7 ADA Rights Advocate',
  },
  {
    text: "Gina showed me what the ADA community actually needs. My job was to build something that lives up to that \u2014 accessible from the first line of code, not as an afterthought.",
    name: 'Ryan',
    initial: 'R',
    role: 'Co-Founder \u00B7 Platform Architect',
  },
  {
    text: "I\u2019ve spent 20 years fighting for access \u2014 in courtrooms, parking lots, and websites that don\u2019t work with my screen reader. This platform exists so you don\u2019t have to fight alone.",
    name: 'Gina',
    initial: 'G',
    role: 'Co-Founder \u00B7 J.D. \u00B7 ADA Rights Advocate',
  },
  {
    text: "We didn\u2019t build this platform and then make it accessible. We built it accessible \u2014 because the people who need it most shouldn\u2019t have to work the hardest to use it.",
    name: 'Ryan',
    initial: 'R',
    role: 'Co-Founder \u00B7 Platform Architect',
  },
  {
    text: "Every diagram, every guide, every tool on this site was tested by someone who actually uses a wheelchair. If it doesn\u2019t work for me, it doesn\u2019t ship.",
    name: 'Gina',
    initial: 'G',
    role: 'Co-Founder \u00B7 J.D. \u00B7 ADA Rights Advocate',
  },
  {
    text: "We built every feature asking the same question \u2014 does this actually help someone file a complaint, find an attorney, or understand their rights? If the answer was no, we cut it.",
    name: 'Ryan',
    initial: 'R',
    role: 'Co-Founder \u00B7 Platform Architect',
  },
];

export default function LandingHeroNew() {
  const { openModal } = useComingSoon();

  // Pick a random quote on each page load
  const quote = useMemo(() => HERO_QUOTES[Math.floor(Math.random() * HERO_QUOTES.length)], []);

  return (
    <section
      aria-labelledby="hero-heading"
      className="landing-hero-section warm-keep-dark"
      style={{
        minHeight: '100vh',
        background: 'var(--dark-bg)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        paddingTop: '72px', paddingBottom: 'clamp(80px, 12vw, 120px)'
      }}
    >
      {/* Subtle background glow */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: '-10%', right: '-5%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(194,65,12,0.07) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      {/* Noise overlay */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.025\'/%3E%3C/svg%3E")',
        pointerEvents: 'none'
      }} />

      <div className="landing-hero-grid" style={{
        maxWidth: '1200px', margin: '0 auto', padding: '0 2.5rem',
        display: 'grid', gridTemplateColumns: '55% 45%', gap: '3rem',
        alignItems: 'center', position: 'relative', width: '100%'
      }}>
        {/* Left column */}
        <div>
          <div className="landing-fade-up" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div aria-hidden="true" style={{ width: '32px', height: '2px', background: 'var(--accent)' }} />
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700,
              letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--dark-label)'
            }}>
              ADA Legal Link
            </span>
          </div>

          <h1 id="hero-heading" className="landing-fade-up landing-delay-1" style={{
            fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.75rem, 6vw, 3.25rem)', fontWeight: 700,
            lineHeight: 1.1, color: 'var(--dark-heading)', margin: '0 0 1.5rem', fontStyle: 'normal'
          }}>
            Understand your rights.<br />
            <span style={{ color: 'var(--accent-light)' }}>Then enforce them.</span>
          </h1>

          <p className="landing-fade-up landing-delay-2" style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1.125rem',
            color: 'var(--dark-body-secondary)', lineHeight: 1.7, margin: '0 0 2rem', maxWidth: '540px'
          }}>
            We turned 279 pages of ADA standards into an interactive, accessible resource center — with 42 diagrams, 52 guides, and instant search. When you're ready, we connect you with an attorney at no cost.
          </p>

          <div className="landing-fade-up landing-delay-3 landing-hero-buttons" style={{
            display: 'flex', gap: '1rem', flexWrap: 'wrap'
          }}>
            <Link to={createPageUrl('StandardsGuide')} className="landing-btn-primary" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--accent)', color: 'var(--btn-text)',
              padding: '16px 32px', borderRadius: '10px',
              fontSize: '1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
              textDecoration: 'none', minHeight: '44px', border: 'none',
              transition: 'background 0.15s'
            }}>
              Explore the ADA Standards Guide →
            </Link>
            <Link to={createPageUrl('RightsPathway')} className="landing-btn-secondary" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'transparent', color: 'var(--dark-body-secondary)',
              padding: '12px 24px', borderRadius: '10px',
              fontSize: '0.9rem', fontWeight: 600, fontFamily: 'Manrope, sans-serif',
              minHeight: '44px', textDecoration: 'none',
              border: '1px solid var(--dark-border)', transition: 'all 0.15s'
            }}>
              Were Your Rights Violated? Find Out in 60 Seconds →
            </Link>
          </div>

          <p className="landing-fade-up landing-delay-4" style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
            color: 'var(--dark-muted)', marginTop: '1rem'
          }}>
            Attorney-connected violation reporting — launching soon.
          </p>
        </div>

        {/* Right column — quote card + stats + WCAG */}
        <div className="landing-fade-up landing-delay-4 landing-hero-right">
          {/* Quote card — random on each page load */}
          <div className="hero-glass-card" style={{
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            borderRadius: '16px', padding: '32px', position: 'relative', marginBottom: '1rem'
          }}>
            <div aria-hidden="true" style={{
              fontFamily: 'Fraunces, serif', fontSize: '4rem', color: 'var(--accent)',
              lineHeight: 1, marginBottom: '-10px', opacity: 0.6,
            }}>"</div>
            <blockquote style={{ margin: 0, padding: 0 }}>
              <p style={{
                fontFamily: 'Fraunces, serif', fontSize: '1.1rem', color: 'var(--dark-body)',
                lineHeight: 1.8, margin: '0 0 20px', fontStyle: 'italic',
              }}>
                {quote.text}
              </p>
              <footer style={{
                borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '16px',
                display: 'flex', alignItems: 'center', gap: '16px',
              }}>
                <div aria-hidden="true" style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'var(--dark-card-bg)', border: '2px solid var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 700,
                    color: 'var(--accent-light)',
                  }}>{quote.initial}</span>
                </div>
                <div>
                  <cite style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 700,
                    color: 'var(--dark-heading)', display: 'block', fontStyle: 'normal',
                    margin: '0 0 2px',
                  }}>{quote.name}</cite>
                  <span style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
                    color: 'var(--dark-muted)', display: 'block',
                  }}>{quote.role}</span>
                </div>
              </footer>
            </blockquote>
          </div>

          {/* Compact stats row */}
          <ul className="landing-hero-stats-grid" aria-label="Platform statistics" style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px', marginBottom: '1rem', listStyle: 'none', padding: 0, margin: '0 0 1rem',
          }}>
            {[
              { value: '42', label: 'Diagrams' },
              { value: '52', label: 'Guides' },
              { value: '10', label: 'Chapters' },
              { value: '60+', label: 'Searchable' },
            ].map((stat, i) => (
              <li key={i} className="hero-glass-card" aria-label={`${stat.value} ${stat.label}`} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '10px', padding: '14px 12px', textAlign: 'center',
              }}>
                <p aria-hidden="true" style={{
                  fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 800,
                  color: 'var(--accent-light)', margin: '0 0 2px', fontStyle: 'normal',
                }}>{stat.value}</p>
                <p aria-hidden="true" style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem',
                  color: 'var(--dark-muted)', margin: 0, fontWeight: 600,
                }}>{stat.label}</p>
              </li>
            ))}
          </ul>

          {/* Accessibility commitment mini-card */}
          <div className="hero-glass-card" style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '10px', padding: '20px 24px', borderLeft: '3px solid var(--accent)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem',
                color: 'var(--dark-body)', lineHeight: 1.6, margin: 0, fontStyle: 'normal', flex: '1 1 0'
              }}>
                <strong style={{ color: 'var(--dark-heading)' }}>WCAG 2.2 AAA compliant.</strong> The highest level of web accessibility — built for the community it serves. Keyboard navigable. Screen reader optimized. High contrast supported.
              </p>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                background: 'rgba(45,106,79,0.2)', border: '1px solid rgba(45,106,79,0.4)',
                borderRadius: '100px', padding: '5px 14px',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                color: 'var(--accent-success)', whiteSpace: 'nowrap', letterSpacing: '0.02em'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                WCAG 2.2 AAA
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Watermark logo */}
      <img
        className="landing-watermark"
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994acc34810e36068eddec2/96059e9a4_ADALL-logo-transparent.png"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', bottom: '20px', right: '40px',
          width: '280px', height: '280px', objectFit: 'contain',
          opacity: 0.04, pointerEvents: 'none', mixBlendMode: 'lighten'
        }}
      />

      {/* Scroll indicator */}
      <div
        aria-hidden="true"
        className="landing-scroll-hint"
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          opacity: 0.5,
          pointerEvents: 'none'
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--dark-heading)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  );
}
