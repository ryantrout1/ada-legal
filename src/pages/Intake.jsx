import React, { useState } from 'react';
import ProgressBar from '../components/intake/ProgressBar';
import WizardNavButtons from '../components/intake/WizardNavButtons';
import ViolationTypeStep from '../components/intake/ViolationTypeStep';
import PhysicalSpaceStep from '../components/intake/PhysicalSpaceStep';

export default function Intake() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    violation_type: '',
    business_name: '',
    business_type: '',
    city: '',
    state: '',
    street_address: '',
    violation_subtype: ''
  });
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canContinue = () => {
    if (step === 1) return !!formData.violation_type;
    if (step === 2 && formData.violation_type === 'physical_space') {
      return !!(formData.business_name && formData.business_type && formData.city && formData.state && formData.violation_subtype);
    }
    return false;
  };

  const validateStep2Physical = () => {
    const e = {};
    if (!formData.business_name.trim()) e.business_name = 'Business name is required';
    if (!formData.business_type) e.business_type = 'Please select a business type';
    if (!formData.city.trim()) e.city = 'City is required';
    if (!formData.state) e.state = 'Please select a state';
    if (!formData.violation_subtype) e.violation_subtype = 'Please select a violation sub-type';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (step === 1 && canContinue()) {
      setErrors({});
      setStep(2);
      return;
    }
    if (step === 2 && formData.violation_type === 'physical_space') {
      if (validateStep2Physical()) {
        setStep(3);
      }
      return;
    }
  };

  const handleBack = () => {
    setErrors({});
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

          {step === 2 && formData.violation_type === 'physical_space' && (
            <PhysicalSpaceStep
              data={formData}
              onChange={updateField}
              errors={errors}
            />
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