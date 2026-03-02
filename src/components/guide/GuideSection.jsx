import React from 'react';
import AutoCiteLinks from './AutoCiteLinks';

export default function GuideSection({ id, title, children, legalTitle, legalContent }) {
  const hasSideBySide = !!legalContent;

  return (
    <section id={id} aria-labelledby={`${id}-heading`} style={{
      marginBottom: '48px', scrollMarginTop: '80px'
    }}>
      {hasSideBySide ? (
        <div className="guide-two-col">
          {/* Plain language */}
          <div style={{ flex: '1 1 55%', minWidth: 0 }}>
            <h2 id={`${id}-heading`} style={{
              fontFamily: 'Fraunces, serif', fontSize: '1.375rem', fontWeight: 700,
              color: 'var(--heading)', margin: '0 0 16px'
            }}>
              {title}
            </h2>
            <div style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
              color: 'var(--body)', lineHeight: 1.75
            }}>
              <AutoCiteLinks>{children}</AutoCiteLinks>
            </div>
          </div>

          {/* Legal text */}
          <div role="note" aria-label="Official legal text" style={{
            flex: '1 1 40%', minWidth: 0
          }}>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '20px', position: 'sticky', top: '96px'
            }}>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--body-secondary)', margin: '0 0 10px'
              }}>
                {legalTitle || 'Official Standard'}
              </p>
              <div style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                color: 'var(--body)', lineHeight: 1.7
              }}>
                <AutoCiteLinks>{legalContent}</AutoCiteLinks>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <h2 id={`${id}-heading`} style={{
            fontFamily: 'Fraunces, serif', fontSize: '1.375rem', fontWeight: 700,
            color: 'var(--heading)', margin: '0 0 16px'
          }}>
            {title}
          </h2>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
            color: 'var(--body)', lineHeight: 1.75
          }}>
            <AutoCiteLinks>{children}</AutoCiteLinks>
          </div>
        </>
      )}
    </section>
  );
}