import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import trackEvent from '../analytics/trackEvent';
import { createPageUrl } from '../../utils';
import { ChevronRight } from 'lucide-react';

export default function GuideHeroBanner({ title, typeBadge, badgeColor }) {
  useEffect(() => {
    base44.analytics.track({ eventName: 'guide_section_viewed', properties: { section_name: title } });
    trackEvent('guide_section_viewed', { section_name: title }, 'GuideSection');
  }, [title]);

  return (
    <header aria-labelledby="guide-page-heading" style={{
      background: '#1A1F2B', position: 'relative', overflow: 'hidden'
    }}>
      <div aria-hidden="true" style={{
        position: 'absolute', top: '-20%', right: '-5%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(194,65,12,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
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
                color: '#94A3B8', textDecoration: 'none'
              }}>Home</Link>
            </li>
            <li aria-hidden="true"><ChevronRight size={14} style={{ color: '#94A3B8' }} /></li>
            <li>
              <Link to={createPageUrl('StandardsGuide')} style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                color: '#94A3B8', textDecoration: 'none'
              }}>ADA Standards Guide</Link>
            </li>
            <li aria-hidden="true"><ChevronRight size={14} style={{ color: '#94A3B8' }} /></li>
            <li>
              <span aria-current="page" style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                color: '#E2E8F0'
              }}>{title}</span>
            </li>
          </ol>
        </nav>

        {/* Badge */}
        <span style={{
          display: 'inline-block',
          background: badgeColor || '#C2410C',
          color: 'white',
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
          color: 'white', margin: 0
        }}>
          {title}
        </h1>
      </div>
    </header>
  );
}