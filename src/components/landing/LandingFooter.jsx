import React from 'react';

export default function LandingFooter() {
  return (
    <footer role="contentinfo" style={{
      backgroundColor: '#0F172A',
      color: 'var(--slate-400)',
      padding: '2.5rem 1.5rem 2rem'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{
          fontFamily: 'Fraunces, serif', fontSize: '1.125rem',
          color: 'var(--slate-300)', fontWeight: 600,
          marginBottom: '1.25rem', marginTop: 0
        }}>
          ADA Legal Marketplace
        </p>
        <div style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
          color: 'var(--slate-400)', lineHeight: 1.7
        }}>
          <p style={{ margin: '0 0 0.75rem' }}>
            ADA Legal Marketplace is not a law firm and does not provide legal advice. The information on this site is for general informational purposes only and does not constitute legal counsel.
          </p>
          <p style={{ margin: '0 0 0.75rem' }}>
            No attorney-client relationship is formed by submitting a report or using this platform. Attorney listings do not constitute endorsements. Results may vary.
          </p>
          <p style={{ margin: 0 }}>
            © {new Date().getFullYear()} ADA Legal Marketplace. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}