import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

const capabilities = [
  {
    icon: '📐',
    heading: 'Interactive Diagrams',
    body: 'Parking spaces, restrooms, ramps, elevators, signage — 30 interactive diagrams with numbered callouts, unit toggle (imperial/metric), and full keyboard navigation. Tap any callout to see the plain language explanation alongside the official legal standard.',
    tag: 'Standards Guide',
    link: 'StandardsGuide'
  },
  {
    icon: '🔍',
    heading: 'Instant Search',
    body: 'Type any ADA topic — parking, grab bars, service animals, website accessibility — and get instant results from 60+ indexed items. No loading, no API calls, no delays. Built to work with screen readers and keyboard navigation.',
    tag: 'Search',
    link: 'StandardsGuide'
  },
  {
    icon: '⚖️',
    heading: 'Know Your Legal Options',
    body: 'Understand the difference between filing a DOJ complaint and hiring an attorney. Learn what to expect from demand letters, settlements, and court. Know your deadlines, your remedies, and your rights — before you need a lawyer.',
    tag: 'Legal Guides',
    link: 'GuideLegalOptions'
  }
];

export default function StoriesSection() {
  return (
    <section aria-labelledby="stories-heading" style={{
      background: '#FAF7F2',
      padding: '100px 1.5rem',
      borderTop: '1px solid transparent',
      borderImage: 'linear-gradient(to right, transparent, #E7E4DE, transparent) 1'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C2410C',
            margin: '0 0 0.75rem'
          }} aria-hidden="true">
            What We Built
          </p>
          <h2 id="stories-heading" style={{
            fontFamily: 'Fraunces, serif', fontSize: '2.5rem', fontWeight: 700,
            color: '#1E293B', margin: '0 0 0.75rem', fontStyle: 'normal'
          }}>
            The ADA, made accessible
          </h2>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1.05rem',
            color: '#475569', margin: 0, maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto'
          }}>
            We took 279 pages of federal accessibility standards and turned them into something anyone can understand, search, and act on — fully accessible to the community it serves.
          </p>
        </div>

        <div className="landing-stories-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px'
        }}>
          {capabilities.map((s, i) => (
            <article key={i} className="landing-story-card" style={{
              background: '#FFFFFF', border: '1px solid #E7E4DE',
              borderRadius: '16px', padding: '32px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex', flexDirection: 'column'
            }}>
              <div aria-hidden="true" style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: '#FEF1EC', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1.25rem'
              }}>
                {s.icon}
              </div>
              <h3 style={{
                fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 600,
                color: '#1E293B', margin: '0 0 0.75rem', lineHeight: 1.3, fontStyle: 'normal'
              }}>
                {s.heading}
              </h3>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem',
                color: '#475569', lineHeight: 1.6, margin: '0 0 1.25rem',
                flex: 1
              }}>
                {s.body}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  display: 'inline-block', fontFamily: 'Manrope, sans-serif',
                  fontSize: '0.8rem', fontWeight: 700, color: '#C2410C',
                  background: '#FEF1EC', padding: '0.3rem 0.75rem',
                  borderRadius: '9999px'
                }}>
                  {s.tag}
                </span>
                <Link to={createPageUrl(s.link)} style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
                  fontWeight: 600, color: '#C2410C', textDecoration: 'none'
                }}>
                  Explore →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}