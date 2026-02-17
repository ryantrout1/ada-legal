import React, { useState } from 'react';
import ProgressBar from '../components/intake/ProgressBar';
import WizardNavButtons from '../components/intake/WizardNavButtons';
import ViolationTypeStep from '../components/intake/ViolationTypeStep';

export default function Intake() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    violation_type: ''
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canContinue = () => {
    if (step === 1) return !!formData.violation_type;
    return false;
  };

  const handleContinue = () => {
    if (canContinue()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  return (
    <div style={{
      backgroundColor: 'var(--slate-50)',
      minHeight: 'calc(100vh - 200px)',
      padding: 'var(--space-xl) var(--space-lg)'
    }}>
      <div style={{
        maxWidth: '720px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          fontWeight: 700,
          color: 'var(--slate-900)',
          marginBottom: 'var(--space-xs)',
          textAlign: 'center'
        }}>
          Report an ADA Violation
        </h1>
        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '1rem',
          color: 'var(--slate-500)',
          textAlign: 'center',
          marginBottom: 'var(--space-2xl)'
        }}>
          No account required. Your information is kept confidential.
        </p>

        <ProgressBar currentStep={step} />

        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--slate-200)',
            padding: 'clamp(1.5rem, 4vw, 2.5rem)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}
          role="form"
          aria-label="ADA Violation Report Form"
        >
          {step === 1 && (
            <ViolationTypeStep
              value={formData.violation_type}
              onChange={val => updateField('violation_type', val)}
            />
          )}

          {step > 1 && (
            <p style={{
              fontFamily: 'Manrope, sans-serif',
              color: 'var(--slate-600)',
              textAlign: 'center',
              padding: '3rem 0'
            }}>
              Step {step} coming soon...
            </p>
          )}

          <WizardNavButtons
            showBack={step > 1}
            onBack={handleBack}
            onContinue={handleContinue}
            canContinue={canContinue()}
          />
        </div>
      </div>
    </div>
  );
}