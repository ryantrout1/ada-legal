import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import trackEvent from '../analytics/trackEvent';
import { ArrowRight } from 'lucide-react';
import { useComingSoon } from '../useComingSoonModal';

export default function GuideReportCTA() {
  const { openModal } = useComingSoon();
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
          color: '#5E6B7C', lineHeight: 1.7, margin: '0 0 28px'
        }}>
          Report it and we'll connect you with an experienced disability rights
          attorney — at no cost to you.
        </p>
        <button onClick={() => { base44.analytics.track({ eventName: 'guide_to_report_conversion', properties: { source: 'guide_cta' } }); trackEvent('guide_to_report_conversion', { source: 'guide_cta' }, 'GuideReportCTA'); openModal('report_violation'); }} style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'transparent', color: '#CBD5E1',
          fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 600,
          padding: '14px 28px', borderRadius: '10px',
          border: '1px solid #475569', cursor: 'pointer', minHeight: '44px'
        }}>
          Report a Violation — Coming Soon <ArrowRight size={18} aria-hidden="true" />
        </button>
        <div style={{ marginTop: '16px' }}>
          <Link to={createPageUrl('Home')} style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
            color: '#5E6B7C', textDecoration: 'underline'
          }}>
            Learn how it works
          </Link>
        </div>
      </div>
    </div>
  );
}