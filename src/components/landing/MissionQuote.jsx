import React from 'react';

export default function MissionQuote() {
  return (
    <section style={{
      backgroundColor: 'var(--heading)',
      padding: 'clamp(3rem, 8vw, 5rem) 1.5rem'
    }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
        <blockquote style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
          fontWeight: 500,
          color: 'white',
          lineHeight: 1.5,
          margin: 0,
          fontStyle: 'italic'
        }}>
          "The ADA was written so that every person could participate fully in American life. We exist to make sure that promise is kept."
        </blockquote>
        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.875rem',
          color: 'var(--body-secondary)',
          marginTop: '1.5rem',
          marginBottom: 0,
          fontWeight: 600,
          letterSpacing: '0.03em'
        }}>
          — ADA LEGAL MARKETPLACE
        </p>
      </div>
    </section>
  );
}