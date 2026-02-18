import React from 'react';

export default function LandingFooter() {
  return (
    <div style={{
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
          ADA Legal Connect
        </p>
        <div style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
          color: 'var(--slate-400)', lineHeight: 1.7
        }}>
          <p style={{ margin: '0 0 0.75rem' }}>
            ADA Legal Connect is not a law firm and does not provide legal advice. By submitting a report, you are not entering into an attorney-client relationship.
          </p>
          <p style={{ margin: '0 0 0.75rem' }}>
            The information on this site is for general informational purposes only and does not constitute legal counsel. Attorney listings do not constitute endorsements. Results may vary.
          </p>
          <p style={{ margin: '0 0 0.75rem' }}>
            <a href="mailto:support@adalegalconnect.com" style={{ color: 'var(--terra-300)', textDecoration: 'underline' }}>
              Contact Us: support@adalegalconnect.com
            </a>
          </p>
          <p style={{ margin: 0 }}>
            © {new Date().getFullYear()} ADA Legal Connect. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}