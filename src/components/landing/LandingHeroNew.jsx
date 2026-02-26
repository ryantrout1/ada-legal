import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useComingSoon } from '../useComingSoonModal';

export default function LandingHeroNew() {
  const { openModal } = useComingSoon();
  return (
    <section
      aria-labelledby="hero-heading"
      className="landing-hero-section"
      style={{
        minHeight: '100vh',
        background: '#1E293B',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        paddingTop: '72px'
      }}
    >
      {/* Background glows */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: '-10%', right: '-5%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(194,65,12,0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute', bottom: '-15%', left: '-10%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(194,65,12,0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      {/* Noise overlay */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.025\'/%3E%3C/svg%3E")',
        pointerEvents: 'none'
      }} />

      <div className="landing-hero-grid" style={{
        maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem',
        display: 'grid', gridTemplateColumns: '55% 45%', gap: '3rem',
        alignItems: 'center', position: 'relative', width: '100%'
      }}>
        {/* Left column */}
        <div>
          <div className="landing-fade-up" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div aria-hidden="true" style={{ width: '32px', height: '2px', background: '#C2410C' }} />
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700,
              letterSpacing: '0.15em', textTransform: 'uppercase', color: '#FB923C'
            }}>
              ADA Legal Link
            </span>
          </div>

          <h1 id="hero-heading" className="landing-fade-up landing-delay-1" style={{
            fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.75rem, 6vw, 3.25rem)', fontWeight: 700,
            lineHeight: 1.1, color: 'white', margin: '0 0 1.5rem', fontStyle: 'normal'
          }}>
            Understand your rights.<br />
            <span style={{ color: '#F97316' }}>Then enforce them.</span>
          </h1>

          <p className="landing-fade-up landing-delay-2" style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1.125rem',
            color: '#CBD5E1', lineHeight: 1.7, margin: '0 0 2rem', maxWidth: '540px'
          }}>
            We turned 279 pages of ADA standards into an interactive, accessible resource center — with 42 diagrams, 52 guides, and instant search. When you're ready, we connect you with an attorney at no cost.
          </p>

          <div className="landing-fade-up landing-delay-3 landing-hero-buttons" style={{
            display: 'flex', gap: '1rem', flexWrap: 'wrap'
          }}>
            <Link to={createPageUrl('StandardsGuide')} className="landing-btn-primary" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: '#C2410C', color: 'white',
              padding: '16px 32px', borderRadius: '10px',
              fontSize: '1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
              textDecoration: 'none', minHeight: '44px', border: 'none',
              transition: 'background 0.15s'
            }}>
              Explore the ADA Standards Guide →
            </Link>
            <button onClick={() => openModal('report_violation')} className="landing-btn-secondary" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'transparent', color: '#CBD5E1',
              padding: '12px 24px', borderRadius: '10px',
              fontSize: '0.9rem', fontWeight: 600, fontFamily: 'Manrope, sans-serif',
              minHeight: '44px', cursor: 'pointer',
              border: '1px solid #475569', transition: 'all 0.15s'
            }}>
              Report a Violation <span style={{ color: '#FB923C' }}>— Coming Soon</span>
            </button>
          </div>

          <p className="landing-fade-up landing-delay-4" style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
            color: '#4B5563', marginTop: '1rem'
          }}>
            Not sure if what happened was a violation?{' '}
            <button onClick={() => openModal('pathways')} style={{ color: '#F97316', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: 'inherit', padding: 0 }}>
              Find out in 60 seconds
            </button>
          </p>
        </div>

        {/* Right column — What we built */}
        <div className="landing-fade-up landing-delay-4">
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '28px 32px', marginBottom: '1rem'
          }}>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
              letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4B5563',
              margin: '0 0 1.25rem'
            }}>
              Inside the ADA Standards Guide
            </p>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'
            }}>
              {[
                { value: '42', label: 'Interactive Diagrams', sub: 'with unit toggle & callouts' },
                { value: '52', label: 'Guide Pages', sub: 'plain language + legal text' },
                { value: '10', label: 'Chapters Covered', sub: 'all major ADA sections' },
                { value: '60+', label: 'Searchable Items', sub: 'instant results, zero delay' }
              ].map((stat, i) => (
                <div key={i} style={{ padding: '8px 0' }}>
                  <p style={{
                    fontFamily: 'Fraunces, serif', fontSize: '1.75rem', fontWeight: 800,
                    color: '#F97316', margin: '0 0 2px', fontStyle: 'normal'
                  }}>
                    {stat.value}
                  </p>
                  <p style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
                    color: '#E2E8F0', margin: '0 0 2px', fontWeight: 600
                  }}>
                    {stat.label}
                  </p>
                  <p style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
                    color: '#4B5563', margin: 0
                  }}>
                    {stat.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Accessibility commitment mini-card */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px', padding: '20px 24px', borderLeft: '3px solid #C2410C'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem',
                color: '#E2E8F0', lineHeight: 1.6, margin: 0, fontStyle: 'normal', flex: '1 1 0'
              }}>
                <strong style={{ color: 'white' }}>WCAG 2.2 AAA compliant.</strong> The highest level of web accessibility — built for the community it serves. Keyboard navigable. Screen reader optimized. High contrast supported.
              </p>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                background: 'rgba(45,106,79,0.2)', border: '1px solid rgba(45,106,79,0.4)',
                borderRadius: '100px', padding: '5px 14px',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                color: '#7DCEA0', whiteSpace: 'nowrap', letterSpacing: '0.02em'
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
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994acc34810e36068eddec2/f0c886271_ADALLLogo-transparent.png"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', bottom: '20px', right: '40px',
          width: '280px', height: '280px', objectFit: 'contain',
          opacity: 0.07, pointerEvents: 'none', mixBlendMode: 'lighten'
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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  );
}