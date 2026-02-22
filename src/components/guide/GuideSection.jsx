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
              color: 'var(--slate-900)', margin: '0 0 16px'
            }}>
              {title}
            </h2>
            <div style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
              color: 'var(--slate-700)', lineHeight: 1.75
            }}>
              <AutoCiteLinks>{children}</AutoCiteLinks>
            </div>
          </div>

          {/* Legal text */}
          <aside aria-label="Official legal text" style={{
            flex: '1 1 40%', minWidth: 0
          }}>
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', padding: '20px', position: 'sticky', top: '96px'
            }}>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--slate-500)', margin: '0 0 10px'
              }}>
                {legalTitle || 'Official Standard'}
              </p>
              <div style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                color: 'var(--slate-600)', lineHeight: 1.7
              }}>
                <AutoCiteLinks>{legalContent}</AutoCiteLinks>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <>
          <h2 id={`${id}-heading`} style={{
            fontFamily: 'Fraunces, serif', fontSize: '1.375rem', fontWeight: 700,
            color: 'var(--slate-900)', margin: '0 0 16px'
          }}>
            {title}
          </h2>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
            color: 'var(--slate-700)', lineHeight: 1.75
          }}>
            <AutoCiteLinks>{children}</AutoCiteLinks>
          </div>
        </>
      )}
    </section>
  );
}