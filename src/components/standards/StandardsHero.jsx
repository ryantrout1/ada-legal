import React from 'react';
import { Shield } from 'lucide-react';
import ADAAssistant from '../guide/ADAAssistant';

export default function StandardsHero({ searchValue, onSearchChange }) {
  return (
    <section
      aria-labelledby="sg-heading"
      style={{
        background: '#1A1F2B',
        position: 'relative',
        overflow: 'hidden'
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

      <div className="sg-hero-grid">
        {/* Left column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div aria-hidden="true" style={{ width: '32px', height: '2px', background: '#C2410C' }} />
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700,
              letterSpacing: '0.15em', textTransform: 'uppercase', color: '#D4570A'
            }}>
              ADA Standards Guide
            </span>
          </div>

          <h1 id="sg-heading" style={{
            fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
            fontWeight: 700, lineHeight: 1.1, color: 'white', margin: '0 0 1.5rem'
          }}>
            Know the law.<br />
            <span style={{ color: '#D4570A' }}>Know your rights.</span>
          </h1>

          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1.125rem',
            color: '#4B5563', lineHeight: 1.7, margin: '0 0 2rem', maxWidth: '520px'
          }}>
            The complete ADA Accessibility Standards — reorganized for clarity,
            searchable by topic, and built to be fully accessible to everyone.
            Plain language alongside the official legal text.
          </p>

          {/* AI Assistant */}
          <ADAAssistant />
        </div>

        {/* Right column */}
        <div>
          {/* Impact card */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '28px 32px', marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Shield size={16} style={{ color: '#D4570A' }} aria-hidden="true" />
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D4570A'
              }}>
                Official Source
              </span>
            </div>
            <p style={{
              fontFamily: 'Fraunces, serif', fontSize: '2.5rem', fontWeight: 800,
              color: '#D4570A', margin: '0 0 0.5rem'
            }}>
              243
            </p>
            <p style={{
              fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600,
              color: 'white', margin: '0 0 0.75rem', lineHeight: 1.3
            }}>
              Sections of the 2010 ADA Design Standards
            </p>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
              color: '#4B5563', lineHeight: 1.6, margin: 0
            }}>
              Reorganized into searchable topics with plain-language explanations.
              All citations reference the official DOJ standards on ADA.gov.
            </p>
          </div>

          {/* Quote card */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '24px', borderLeft: '3px solid #C2410C',
            paddingLeft: '20px'
          }}>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
              color: '#E2E8F0', lineHeight: 1.6, margin: '0 0 0.75rem', fontStyle: 'italic'
            }}>
              "I spent hours on ADA.gov trying to find the parking space
              requirements for my business. This would have taken me 30 seconds."
            </p>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
              color: '#4B5563', margin: 0
            }}>
              — Small business owner
            </p>
          </div>
        </div>
      </div>

      {/* Watermark logo */}
      <img
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994acc34810e36068eddec2/f0c886271_ADALLLogo-transparent.png"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', bottom: '20px', right: '40px',
          width: '240px', height: '240px', objectFit: 'contain',
          opacity: 0.08, pointerEvents: 'none'
        }}
      />

      {/* Live region for future search results */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="sg-search-results-announce" />
    </section>
  );
}