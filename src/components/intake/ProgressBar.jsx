import React from 'react';

const DEFAULT_LABELS = [
  'Violation Type',
  'Details',
  'Incident',
  'Contact',
  'Review'
];

export default function ProgressBar({ currentStep, totalOverride, labelsOverride }) {
  const labels = labelsOverride || DEFAULT_LABELS;
  const total = totalOverride || labels.length;
  const progress = (currentStep / total) * 100;

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
          Step {currentStep} of {total} — {labels[currentStep - 1] || ''}
        </span>
        <span style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.75rem',
          color: 'var(--slate-600)'
        }}>
          {Math.round(progress)}% complete
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: '0.5rem',
          backgroundColor: 'var(--slate-300)',
          borderRadius: '0.25rem',
          overflow: 'hidden'
        }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Form progress: Step ${currentStep} of ${total}`}
      >
        <div style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: 'var(--terra-600)',
          borderRadius: '0.25rem',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );
}