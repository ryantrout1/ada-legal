import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function LandingFooterNew() {
  return (
    <footer role="contentinfo" style={{
      background: '#141820', padding: '40px 1.5rem',
      borderTop: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{
          fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700,
          color: 'white', margin: '0 0 1.25rem', fontStyle: 'normal'
        }}>
          ADA Legal Link
        </p>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
          color: '#94A3B8', maxWidth: '680px', margin: '0 auto 1.5rem',
          lineHeight: 1.7
        }}>
          ADA Legal Link is not a law firm and does not provide legal advice. By submitting a report, you are not entering into an attorney-client relationship. Attorney listings do not constitute endorsements. Results may vary.
        </p>
        <div className="landing-footer-links" style={{
          display: 'flex', gap: '2rem', justifyContent: 'center',
          marginBottom: '1.5rem', flexWrap: 'wrap'
        }}>
          <Link to={createPageUrl('Intake')} className="landing-footer-link" style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
            color: '#CBD5E1', textDecoration: 'none', minHeight: '44px',
            display: 'inline-flex', alignItems: 'center'
          }}>
            Report a Violation
          </Link>
          <Link to={createPageUrl('LawyerLanding')} className="landing-footer-link" style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
            color: '#CBD5E1', textDecoration: 'none', minHeight: '44px',
            display: 'inline-flex', alignItems: 'center'
          }}>
            For Attorneys
          </Link>
          <a href="mailto:support@adalegalconnect.com" className="landing-footer-link" style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
            color: '#CBD5E1', textDecoration: 'none', minHeight: '44px',
            display: 'inline-flex', alignItems: 'center'
          }}>
            Contact Us
          </a>
        </div>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
          color: '#94A3B8', margin: 0
        }}>
          © 2026 ADA Legal Link. All rights reserved.
        </p>
      </div>
    </footer>
  );
}