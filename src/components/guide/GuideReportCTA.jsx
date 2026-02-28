import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ArrowRight } from 'lucide-react';
import AskADAHelper from './AskADAHelper';

export default function GuideReportCTA({ pageTitle, pageType, hideHelper }) {
  return (
    <>
      {/* AI Helper — appears inside the content area before the CTA */}
      {!hideHelper && (
        <div className="guide-content-wrap">
          <div className="guide-content">
            <AskADAHelper
              pageTitle={pageTitle || document.title.replace(/ \| ADA Legal Link$/, '')}
              pageSections={[]}
              pageType={pageType || 'default'}
            />
          </div>
        </div>
      )}

      <div role="region" aria-label="Take action on an ADA violation" style={{
      background: '#1A1F2B', padding: '64px 40px', textAlign: 'center'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{
          fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          fontWeight: 700, color: 'white', margin: '0 0 12px'
        }}>
          Think you experienced an ADA violation?
        </h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
          color: '#94A3B8', lineHeight: 1.7, margin: '0 0 28px'
        }}>
          Answer a few simple questions and we'll show you exactly what applies to your situation — in 60 seconds.
        </p>
        <Link to={createPageUrl('RightsPathway')} style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: '#C2410C', color: 'white',
          fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 600,
          padding: '14px 28px', borderRadius: '10px',
          textDecoration: 'none', minHeight: '44px',
          transition: 'background 0.15s'
        }}>
          Take the Rights Assessment <ArrowRight size={18} aria-hidden="true" />
        </Link>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem',
          color: '#64748B', marginTop: '16px', marginBottom: 0
        }}>
          Attorney-connected violation reporting — launching soon.
        </p>
        <div style={{ marginTop: '16px' }}>
          <Link to={createPageUrl('Home')} style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
            color: '#94A3B8', textDecoration: 'underline'
          }}>
            Learn how it works
          </Link>
        </div>
      </div>
    </>
  );
}