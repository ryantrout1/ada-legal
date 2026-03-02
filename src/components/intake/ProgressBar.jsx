import React from 'react';
import { Check } from 'lucide-react';

const DEFAULT_LABELS = [
  'Violation Type',
  'Details',
  'Incident',
  'Contact',
  'Review'
];

const STEP_DESCRIPTIONS = [
  'Physical or digital?',
  'Location & business info',
  'Date & what happened',
  'Your contact info',
  'Confirm & submit'
];

export default function ProgressBar({ currentStep, totalOverride, labelsOverride, onStepClick }) {
  const labels = labelsOverride || DEFAULT_LABELS;
  const total = totalOverride || labels.length;
  const progress = (currentStep / total) * 100;
  const remainingSteps = total - currentStep;
  const estimatedMinutes = remainingSteps <= 1 ? 'Under 1 min left' : `About ${remainingSteps} min left`;

  // Use matching descriptions or fall back
  const descriptions = labelsOverride
    ? labelsOverride.map(() => '')
    : STEP_DESCRIPTIONS;

  return (
    <div style={{ marginBottom: 'var(--space-2xl)' }}>
      {/* Top row: step indicator + time estimate */}
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
          color: 'var(--body)'
        }}>
          Step {currentStep} of {total} — {labels[currentStep - 1] || ''}
        </span>
        <span style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.75rem',
          color: 'var(--body-secondary)',
          fontStyle: 'italic'
        }}>
          {estimatedMinutes}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: '0.5rem',
          backgroundColor: 'var(--body-secondary)',
          borderRadius: '0.25rem',
          overflow: 'hidden'
        }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Form progress: Step ${currentStep} of ${total}, ${Math.round(progress)}% complete`}
      >
        <div style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: 'var(--section-label)',
          borderRadius: '0.25rem',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* COGA: Step breadcrumbs — completed steps are clickable */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-xs)',
        marginTop: 'var(--space-md)',
        flexWrap: 'wrap'
      }}>
        {labels.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const canClick = isCompleted && onStepClick;

          const pillStyle = {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.75rem',
            fontWeight: isCurrent ? 700 : 500,
            borderRadius: '100px',
            border: isCurrent
              ? '2px solid var(--section-label)'
              : isCompleted
                ? '1px solid var(--success-600, #16A34A)'
                : '1px solid var(--border)',
            backgroundColor: isCurrent
              ? '#FFF8F5'
              : isCompleted
                ? '#F0FDF4'
                : 'transparent',
            color: isCurrent
              ? 'var(--section-label)'
              : isCompleted
                ? 'var(--success-600, #16A34A)'
                : 'var(--body-secondary)',
            cursor: canClick ? 'pointer' : 'default',
            transition: 'all 0.15s',
            minHeight: '28px'
          };

          if (canClick) {
            return (
              <button
                key={stepNum}
                type="button"
                onClick={() => onStepClick(stepNum)}
                style={{ ...pillStyle, background: pillStyle.backgroundColor }}
                aria-label={`Go back to step ${stepNum}: ${label} (completed)`}
                title={descriptions[i] || undefined}
              >
                <Check size={12} aria-hidden="true" />
                {label}
              </button>
            );
          }

          return (
            <span
              key={stepNum}
              style={pillStyle}
              aria-current={isCurrent ? 'step' : undefined}
              title={isCurrent ? (descriptions[i] || undefined) : undefined}
            >
              {isCompleted && <Check size={12} aria-hidden="true" />}
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
