import React from 'react';

const STEP_LABELS = [
  'Violation Type',
  'Details',
  'Incident',
  'Contact',
  'Review'
];

export default function ProgressBar({ currentStep }) {
  const progress = (currentStep / STEP_LABELS.length) * 100;

  return (
    <div style={{ marginBottom: 'var(--space-2xl)' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 'var(--space-sm)'
      }}>
        <span style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--slate-700)'
        }}>
          Step {currentStep} of {STEP_LABELS.length} — {STEP_LABELS[currentStep - 1]}
        </span>
        <span style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.75rem',
          color: 'var(--slate-500)'
        }}>
          {Math.round(progress)}% complete
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'var(--slate-300)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Step ${currentStep} of ${STEP_LABELS.length}`}
      >
        <div style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: 'var(--terra-600)',
          borderRadius: '4px',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );
}