import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import trackEvent from '../analytics/trackEvent';
import { createPageUrl } from '../../utils';
import { ChevronRight } from 'lucide-react';
import ShareBar from './ShareBar';

export default function GuideHeroBanner({ title, typeBadge, badgeColor }) {
  useEffect(() => {
    trackEvent('guide_section_viewed', { section_name: title }, 'GuideSection');
  }, [title]);

  return (
    <header aria-labelledby="guide-page-heading" style={{
      background: 'var(--dark-card-bg)', position: 'relative', overflow: 'hidden'
    }}>
      <div aria-hidden="true" className="section-watermark" style={{
        position: 'absolute', bottom: '-10%', right: '2%',
        width: '200px', height: '200px',
        backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994acc34810e36068eddec2/96059e9a4_ADALL-logo-transparent.png)',
        backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
        opacity: 0.04, pointerEvents: 'none',
      }} />
      <div style={{
        maxWidth: '800px', margin: '0 auto',
        padding: '120px 40px 40px'
      }}>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: '16px' }}>
          <ol style={{
            listStyle: 'none', margin: 0, padding: 0,
            display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap'
          }}>
            <li>
              <Link to={createPageUrl('Home')} style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                color: 'var(--dark-muted)', textDecoration: 'none'
              }}>Home</Link>
            </li>
            <li aria-hidden="true"><ChevronRight size={14} style={{ color: 'var(--dark-muted)' }} /></li>
            <li>
              <Link to={createPageUrl('StandardsGuide')} style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                color: 'var(--dark-muted)', textDecoration: 'none'
              }}>ADA Standards Guide</Link>
            </li>
            <li aria-hidden="true"><ChevronRight size={14} style={{ color: 'var(--dark-muted)' }} /></li>
            <li>
              <span aria-current="page" style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                color: 'var(--dark-body)'
              }}>{title}</span>
            </li>
          </ol>
        </nav>

        {/* Badge */}
        <span style={{
          display: 'inline-block',
          background: badgeColor || 'var(--accent)',
          color: 'var(--dark-heading)',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '4px 12px', borderRadius: '100px',
          marginBottom: '12px'
        }}>
          {typeBadge}
        </span>

        {/* Title */}
        <h1 id="guide-page-heading" style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
          fontWeight: 700, lineHeight: 1.15,
          color: 'var(--dark-heading)', margin: '0 0 16px'
        }}>
          {title}
        </h1>
        <div style={{ marginTop: '16px' }}>
          <style>{`
            .guide-hero-share button { border-color: rgba(255,255,255,0.35) !important; background: rgba(255,255,255,0.12) !important; color: rgba(255,255,255,0.85) !important; }
            .guide-hero-share button:hover { border-color: var(--accent) !important; color: white !important; background: rgba(194,65,12,0.3) !important; }
            .guide-hero-share span { color: rgba(255,255,255,0.65) !important; }
          `}</style>
          <div className="guide-hero-share">
            <ShareBar />
          </div>
        </div>
      </div>
    </header>
  );
}