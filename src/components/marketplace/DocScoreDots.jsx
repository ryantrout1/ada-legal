import React, { useState, useRef, useEffect } from 'react';
import { calculateDocScore } from './docScore';

// Compact dot display with optional label and info tooltip
export default function DocScoreDots({ caseData, showLabel = true, tooltipPlacement = 'above' }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);
  const btnRef = useRef(null);

  const { criteria, score, label, color } = calculateDocScore(caseData);

  useEffect(() => {
    if (!showTooltip) return;
    const handleClick = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        setShowTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showTooltip]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
      <div style={{ display: 'flex', gap: '3px' }} aria-label={`Documentation score: ${score} of 7, ${label}`} role="img">
        {criteria.map((cr, i) => (
          <span key={i} style={{
            width: '8px', height: '8px', borderRadius: '50%',
            backgroundColor: cr.met ? color : 'var(--slate-500)',
            display: 'inline-block'
          }} />
        ))}
      </div>
      {showLabel && (
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 600, color, whiteSpace: 'nowrap' }}>
          {label}
        </span>
      )}
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setShowTooltip(!showTooltip); }}
        aria-label="Documentation score details"
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
          color: '#475569', lineHeight: 1
        }}
      >ⓘ</button>

      {showTooltip && (
        <div ref={tooltipRef} style={{
          position: 'absolute',
          [tooltipPlacement === 'above' ? 'bottom' : 'top']: '100%',
          left: '0',
          marginBottom: tooltipPlacement === 'above' ? '8px' : 0,
          marginTop: tooltipPlacement === 'above' ? 0 : '8px',
          zIndex: 100,
          backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: '12px 14px', width: '280px'
        }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-800)', margin: '0 0 8px' }}>
            Documentation Score: {score}/7 — {label}
          </p>
          {criteria.map((cr, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '4px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.75rem', color: cr.met ? '#15803D' : 'var(--slate-500)', flexShrink: 0, lineHeight: 1.4 }}>
                {cr.met ? '●' : '○'}
              </span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', color: 'var(--slate-600)', lineHeight: 1.4 }}>
                {cr.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}