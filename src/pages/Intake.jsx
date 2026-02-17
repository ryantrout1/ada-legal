import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { caseSubmittedEmail } from '../components/emails/caseEmails';
import ProgressBar from '../components/intake/ProgressBar';
import WizardNavButtons from '../components/intake/WizardNavButtons';
import ViolationTypeStep from '../components/intake/ViolationTypeStep';
import PhysicalSpaceStep from '../components/intake/PhysicalSpaceStep';
import DigitalWebsiteStep from '../components/intake/DigitalWebsiteStep';
import IncidentStep from '../components/intake/IncidentStep';
import ContactStep from '../components/intake/ContactStep';
import ReviewStep from '../components/intake/ReviewStep';
import SuccessStep from '../components/intake/SuccessStep';

export default function Intake() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    violation_type: '',
    business_name: '',
    business_type: '',
    city: '',
    state: '',
    street_address: '',
    violation_subtype: '',
    url_domain: '',
    assistive_tech: [],
    incident_date: '',
    visited_before: '',
    narrative: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    contact_preference: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [caseId, setCaseId] = useState(null);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canContinue = () => {
    if (step === 1) return !!formData.violation_type;
    if (step === 2 && formData.violation_type === 'physical_space') {
      return !!(formData.business_name && formData.business_type && formData.city && formData.state && formData.violation_subtype);
    }
    if (step === 2 && formData.violation_type === 'digital_website') {
      return !!(formData.url_domain && formData.assistive_tech.length > 0 && formData.business_name);
    }
    if (step === 3) {
      return !!(formData.incident_date && formData.visited_before && formData.narrative && formData.narrative.length >= 50);
    }
    if (step === 4) {
      return !!(formData.contact_name && formData.contact_email && formData.contact_phone && formData.contact_preference);
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
    if (step === 2 && formData.violation_type === 'digital_website') {
      if (validateStep2Digital()) {
        setStep(3);
      }
      return;
    }
    if (step === 3) {
      if (validateStep3()) {
        setStep(4);
      }
      return;
    }
    if (step === 4) {
      if (validateStep4()) {
        setStep(5);
      }
      return;
    }
  };

  const validateStep4 = () => {
    const e = {};
    if (!formData.contact_name.trim()) e.contact_name = 'Full name is required';
    const email = formData.contact_email.trim();
    if (!email) {
      e.contact_email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.contact_email = 'Please enter a valid email address';
    }
    const digits = (formData.contact_phone || '').replace(/\D/g, '');
    if (!formData.contact_phone.trim()) {
      e.contact_phone = 'Phone number is required';
    } else if (digits.length !== 10) {
      e.contact_phone = 'Please enter a valid 10-digit US phone number';
    }
    if (!formData.contact_preference) e.contact_preference = 'Please select a preferred contact method';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e = {};
    if (!formData.incident_date) {
      e.incident_date = 'Please select the date of the incident';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (formData.incident_date > today) e.incident_date = 'Date cannot be in the future';
    }
    if (!formData.visited_before) e.visited_before = 'Please select an option';
    if (!formData.narrative || !formData.narrative.trim()) {
      e.narrative = 'Please describe what happened';
    } else if (formData.narrative.trim().length < 50) {
      e.narrative = 'Please provide more detail about your experience (at least 50 characters)';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2Digital = () => {
    const e = {};
    const url = formData.url_domain.trim();
    if (!url) {
      e.url_domain = 'Website URL or app name is required';
    } else {
      const urlPattern = /^(https?:\/\/)?[\w.-]+\.\w{2,}(\/.*)?$|^[\w\s]+$/i;
      if (!urlPattern.test(url)) {
        e.url_domain = 'Please enter a valid URL (e.g., www.example.com) or app name';
      }
    }
    if (!formData.assistive_tech || formData.assistive_tech.length === 0) {
      e.assistive_tech = 'Please select at least one assistive technology';
    }
    if (!formData.business_name.trim()) e.business_name = 'Business or organization name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleBack = () => {
    setErrors({});
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    const now = new Date().toISOString();
    const isPhysical = formData.violation_type === 'physical_space';

    // 1. Create Case record
    const casePayload = {
      violation_type: formData.violation_type,
      business_name: formData.business_name.trim(),
      business_type: isPhysical ? formData.business_type : 'Website/App',
      city: isPhysical ? formData.city.trim() : '',
      state: isPhysical ? formData.state : '',
      street_address: isPhysical ? (formData.street_address || '').trim() : '',
      url_domain: !isPhysical ? formData.url_domain.trim() : '',
      assistive_tech: !isPhysical ? formData.assistive_tech : [],
      violation_subtype: isPhysical ? formData.violation_subtype : '',
      incident_date: formData.incident_date,
      visited_before: formData.visited_before,
      narrative: formData.narrative.trim(),
      contact_name: formData.contact_name.trim(),
      contact_email: formData.contact_email.trim(),
      contact_phone: formData.contact_phone.trim(),
      contact_preference: formData.contact_preference,
      status: 'submitted',
      submitted_at: now
    };

    const newCase = await base44.entities.Case.create(casePayload);
    setCaseId(newCase.id);

    // 2. Create TimelineEvent
    await base44.entities.TimelineEvent.create({
      case_id: newCase.id,
      event_type: 'submitted',
      event_description: 'Your ADA violation report has been received and is pending review.',
      actor_role: 'system',
      visible_to_user: true,
      created_at: now
    });

    // 3. Send branded confirmation email
    const portalUrl = window.location.origin + '/MyCases';
    await base44.integrations.Core.SendEmail({
      to: formData.contact_email.trim(),
      subject: 'ADA Legal Marketplace — Report Received',
      body: caseSubmittedEmail(casePayload, portalUrl)
    });

    setSubmitting(false);
    setSubmitted(true);
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
          {submitted ? 'Thank You' : 'Report an ADA Violation'}
        </h1>
        {!submitted && (
          <p style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: '1rem',
            color: 'var(--slate-500)',
            textAlign: 'center',
            marginBottom: 'var(--space-2xl)'
          }}>
            No account required. Your information is kept confidential.
          </p>
        )}

        {!submitted && <ProgressBar currentStep={step} />}

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
          {submitted && (
            <SuccessStep caseData={formData} caseId={caseId} />
          )}

          {!submitted && step === 1 && (
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

          {step === 2 && formData.violation_type === 'digital_website' && (
            <DigitalWebsiteStep
              data={formData}
              onChange={updateField}
              errors={errors}
            />
          )}

          {step === 3 && (
            <IncidentStep
              data={formData}
              onChange={updateField}
              errors={errors}
            />
          )}

          {step === 4 && (
            <ContactStep
              data={formData}
              onChange={updateField}
              errors={errors}
            />
          )}

          {!submitted && step === 5 && (
            <ReviewStep
              data={formData}
              onEdit={(targetStep) => { setErrors({}); setStep(targetStep); }}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          )}

          {!submitted && step < 5 && (
            <WizardNavButtons
              showBack={step > 1}
              onBack={handleBack}
              onContinue={handleContinue}
              canContinue={canContinue()}
            />
          )}
        </div>
      </div>
    </div>
  );
}