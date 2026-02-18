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
              ADA Legal Marketplace
            </span>
          </div>

          <h1 id="hero-heading" className="landing-fade-up landing-delay-1" style={{
            fontFamily: 'Fraunces, serif', fontSize: '3.25rem', fontWeight: 700,
            lineHeight: 1.1, color: 'white', margin: '0 0 1.5rem', fontStyle: 'normal'
          }}>
            You were denied access.<br />
            <span style={{ color: '#EA580C' }}>That ends here.</span>
          </h1>

          <p className="landing-fade-up landing-delay-2" style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1.125rem',
            color: '#CBD5E1', lineHeight: 1.7, margin: '0 0 2rem', maxWidth: '540px'
          }}>
            Report your ADA violation and we'll connect you with an experienced disability rights attorney — at no cost to you. Every person deserves equal access.
          </p>

          <div className="landing-fade-up landing-delay-3 landing-hero-buttons" style={{
            display: 'flex', gap: '1rem', flexWrap: 'wrap'
          }}>
            <Link to={createPageUrl('Intake')} className="landing-btn-primary" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: '#C2410C', color: 'white',
              padding: '16px 32px', borderRadius: '10px',
              fontSize: '1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
              textDecoration: 'none', minHeight: '44px', border: 'none',
              transition: 'background 0.15s'
            }}>
              Report a Violation →
            </Link>
            <a href="#how-it-works" className="landing-btn-secondary" style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'transparent', color: '#E2E8F0',
              padding: '16px 32px', borderRadius: '10px',
              fontSize: '1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
              textDecoration: 'none', minHeight: '44px',
              border: '1px solid #475569', transition: 'all 0.15s'
            }}>
              See How It Works
            </a>
          </div>
        </div>

        {/* Right column */}
        <div className="landing-fade-up landing-delay-4">
          {/* Impact card */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '28px 32px', marginBottom: '1rem'
          }}>
            <p style={{
              fontFamily: 'Fraunces, serif', fontSize: '3rem', fontWeight: 800,
              color: '#EA580C', margin: '0 0 0.75rem', fontStyle: 'normal'
            }}>
              8,800+
            </p>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem',
              color: '#CBD5E1', lineHeight: 1.6, margin: '0 0 0.75rem'
            }}>
              ADA Title III federal lawsuits were filed in 2024 — and thousands more go unreported because people don't know where to turn.
            </p>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
              color: '#94A3B8', margin: 0
            }}>
              Source: Seyfarth Shaw ADA Title III Litigation Report, 2024
            </p>
          </div>

          {/* Testimonial card */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px', padding: '24px', borderLeft: '3px solid #C2410C'
          }}>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
              color: '#E2E8F0', lineHeight: 1.6, margin: '0 0 0.75rem', fontStyle: 'normal'
            }}>
              "I didn't think anyone would care about a missing ramp at a restaurant. Three weeks after reporting, an attorney called me. Someone finally listened."
            </p>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
              color: '#94A3B8', margin: 0
            }}>
              — Platform claimant
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}