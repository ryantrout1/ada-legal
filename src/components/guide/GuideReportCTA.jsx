import React from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import trackEvent from '../analytics/trackEvent';
import { createPageUrl } from '../../utils';
import { ArrowRight } from 'lucide-react';

export default function GuideReportCTA() {
  return (
    <div role="region" aria-label="Report an ADA violation" style={{
      background: '#1A1F2B', padding: '64px 40px', textAlign: 'center'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{
          fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          fontWeight: 700, color: 'white', margin: '0 0 12px'
        }}>
          Experienced an ADA violation?
        </h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
          color: '#94A3B8', lineHeight: 1.7, margin: '0 0 28px'
        }}>
          Report it and we'll connect you with an experienced disability rights
          attorney — at no cost to you.
        </p>
        <Link to={createPageUrl('Intake')} onClick={() => { base44.analytics.track({ eventName: 'guide_to_report_conversion', properties: { source: 'guide_cta' } }); trackEvent('guide_to_report_conversion', { source: 'guide_cta' }, 'GuideReportCTA'); }} style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: '#C2410C', color: 'white',
          fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 600,
          padding: '14px 28px', borderRadius: '10px',
          textDecoration: 'none', minHeight: '44px'
        }}>
          Report a Violation <ArrowRight size={18} aria-hidden="true" />
        </Link>
        <div style={{ marginTop: '16px' }}>
          <Link to={createPageUrl('Home')} style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
            color: '#94A3B8', textDecoration: 'underline'
          }}>
            Learn how it works
          </Link>
        </div>
      </div>
    </div>
  );
}