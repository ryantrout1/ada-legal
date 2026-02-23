import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function LandingHeroNew() {
  return (
    <section
      aria-labelledby="hero-heading"
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
            fontFamily: 'Fraunces, serif', fontSize: '3.25rem', fontWeight: 700,
            lineHeight: 1.1, color: 'white', margin: '0 0 1.5rem', fontStyle: 'normal'
          }}>
            Understand your rights.<br />
            <span style={{ color: '#EA580C' }}>Then enforce them.</span>
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
            <Link to={createPageUrl('Intake')} className="landing-btn-secondary" style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'transparent', color: '#E2E8F0',
              padding: '16px 32px', borderRadius: '10px',
              fontSize: '1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
              textDecoration: 'none', minHeight: '44px',
              border: '1px solid #475569', transition: 'all 0.15s'
            }}>
              Report a Violation
            </Link>
          </div>

          <p className="landing-fade-up landing-delay-4" style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
            color: '#94A3B8', marginTop: '1rem'
          }}>
            Not sure if what happened was a violation?{' '}
            <Link to={createPageUrl('RightsPathway')} style={{ color: '#EA580C', textDecoration: 'underline' }}>
              Find out in 60 seconds
            </Link>
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
              letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94A3B8',
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
                    color: '#EA580C', margin: '0 0 2px', fontStyle: 'normal'
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
                    color: '#94A3B8', margin: 0
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
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem',
              color: '#E2E8F0', lineHeight: 1.6, margin: 0, fontStyle: 'normal'
            }}>
              <strong style={{ color: 'white' }}>100% WCAG 2.1 AA compliant.</strong> Every page, every diagram, every interaction — built for the community it serves. Keyboard navigable. Screen reader optimized. High contrast supported.
            </p>
          </div>
        </div>
      </div>

      {/* Watermark logo */}
      <img
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994acc34810e36068eddec2/e3c293e44_logo-terracotta.png"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', bottom: '20px', right: '40px',
          width: '280px', height: '280px', objectFit: 'contain',
          opacity: 0.07, pointerEvents: 'none'
        }}
      />
    </section>
  );
}