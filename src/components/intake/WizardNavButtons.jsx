import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function WizardNavButtons({ onBack, onContinue, canContinue, backLabel, continueLabel, showBack }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: showBack ? 'space-between' : 'flex-end',
      marginTop: 'var(--space-2xl)',
      gap: 'var(--space-md)'
    }}>
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          className="intake-nav-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--body)',
            backgroundColor: 'transparent',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            minHeight: '48px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.target.style.borderColor = 'var(--body-secondary)'; }}
          onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; }}
        >
          <ArrowLeft size={18} aria-hidden="true" />
          {backLabel || 'Back'}
        </button>
      )}
      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue}
        className="intake-nav-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 2rem',
          fontFamily: 'Manrope, sans-serif',
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--btn-text)',
          backgroundColor: canContinue ? 'var(--section-label)' : 'var(--body-secondary)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          cursor: canContinue ? 'pointer' : 'not-allowed',
          minHeight: '48px',
          transition: 'all 0.2s',
          opacity: canContinue ? 1 : 0.7
        }}
      >
        {continueLabel || 'Continue'}
        <ArrowRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
}