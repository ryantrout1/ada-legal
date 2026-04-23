import React from 'react';
import { BookOpen, Scale, Sparkles } from 'lucide-react';
import AutoCiteLinks from './AutoCiteLinks.js';
import { useReadingLevel } from './ReadingLevelContext.js';

/**
 * GuideSection - Reading-level-aware section component for all Guide pages.
 *
 * Props:
 *   id            - section anchor id
 *   title         - section heading
 *   children      - standard/plain-language content (8th grade) - ALWAYS required
 *   legalContent  - official legal text (optional, enables side-by-side in standard mode)
 *   legalTitle    - label for legal column (default: "Official Standard")
 *   simpleContent - 5th-grade simple version (optional, used in simple mode)
 *
 * Reading level behavior:
 *   simple:       Shows simpleContent if provided, else falls back to children with notice
 *   standard:     Shows children + legalContent side-by-side (current default behavior)
 *   professional: Shows legalContent primary, children in a collapsible
 */
export default function GuideSection({ id, title, children, legalTitle, legalContent, simpleContent }) {
  const { readingLevel } = useReadingLevel();
  const hasSideBySide = !!legalContent;

  const heading = (
    <h2 id={`${id}-heading`} style={{
      fontFamily: 'Fraunces, serif', fontSize: '1.375rem', fontWeight: 700,
      color: 'var(--heading)', margin: '0 0 16px'
    }}>
      {title}
    </h2>
  );

  const plainBlock = (
    <div style={{
      fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
      color: 'var(--body)', lineHeight: 1.75
    }}>
      <AutoCiteLinks>{children}</AutoCiteLinks>
    </div>
  );

  const legalBlock = legalContent ? (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '20px'
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
  ) : null;

  /* ===== SIMPLE MODE ===== */
  if (readingLevel === 'simple') {
    return (
      <section id={id} aria-labelledby={`${id}-heading`} style={{ marginBottom: '48px', scrollMarginTop: '80px' }}>
        {heading}
        {simpleContent ? (
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1.0625rem',
            color: 'var(--body)', lineHeight: 1.85
          }}>
            <AutoCiteLinks>{simpleContent}</AutoCiteLinks>
          </div>
        ) : (
          <div>
            <div style={{
              background: 'var(--card-bg-warm)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '16px', marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Sparkles size={16} style={{ color: 'var(--section-label)' }} aria-hidden="true" />
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700,
                  color: 'var(--heading)', margin: 0
                }}>
                  Simple summary coming soon
                </p>
              </div>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                color: 'var(--body)', margin: 0, lineHeight: 1.6
              }}>
                We are writing plain-language summaries for every section. Here is the standard explanation:
              </p>
            </div>
            {plainBlock}
          </div>
        )}
      </section>
    );
  }

  /* ===== PROFESSIONAL / LEGAL MODE ===== */
  if (readingLevel === 'professional' && hasSideBySide) {
    return (
      <section id={id} aria-labelledby={`${id}-heading`} style={{ marginBottom: '48px', scrollMarginTop: '80px' }}>
        {heading}
        <div style={{
          background: 'var(--page-bg-subtle)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '20px', marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Scale size={14} style={{ color: 'var(--body-secondary)' }} aria-hidden="true" />
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--body-secondary)', margin: 0
            }}>{legalTitle || 'Official Standard'}</p>
          </div>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
            color: 'var(--body)', lineHeight: 1.75
          }}>
            <AutoCiteLinks>{legalContent}</AutoCiteLinks>
          </div>
        </div>
        <details style={{ marginTop: '8px' }}>
          <summary style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
            fontWeight: 600, color: 'var(--section-label)', cursor: 'pointer',
            padding: '8px 0', minHeight: '44px',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <BookOpen size={14} aria-hidden="true" /> View plain-language explanation
          </summary>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
            color: 'var(--body)', lineHeight: 1.7, padding: '12px 0'
          }}>
            <AutoCiteLinks>{children}</AutoCiteLinks>
          </div>
        </details>
      </section>
    );
  }

  /* ===== STANDARD MODE (default) ===== */
  return (
    <section id={id} aria-labelledby={`${id}-heading`} style={{
      marginBottom: '48px', scrollMarginTop: '80px'
    }}>
      {hasSideBySide ? (
        <div className="guide-two-col">
          <div style={{ flex: '1 1 55%', minWidth: 0 }}>
            {heading}
            {plainBlock}
          </div>
          <div role="note" aria-label="Official legal text" style={{
            flex: '1 1 40%', minWidth: 0
          }}>
            <div style={{ position: 'sticky', top: '96px' }}>
              {legalBlock}
            </div>
          </div>
        </div>
      ) : (
        <>
          {heading}
          {plainBlock}
        </>
      )}
    </section>
  );
}
