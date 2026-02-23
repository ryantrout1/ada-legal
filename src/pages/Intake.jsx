import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';

import ProgressBar from '../components/intake/ProgressBar';
import WizardNavButtons from '../components/intake/WizardNavButtons';
import ViolationTypeStep from '../components/intake/ViolationTypeStep';
import PhysicalSpaceStep from '../components/intake/PhysicalSpaceStep';
import DigitalWebsiteStep from '../components/intake/DigitalWebsiteStep';
import IncidentStep from '../components/intake/IncidentStep';
import ContactStep from '../components/intake/ContactStep';
import ReviewStep from '../components/intake/ReviewStep';
import SuccessStep from '../components/intake/SuccessStep';
import ExitConfirmModal from '../components/intake/ExitConfirmModal';

export default function Intake() {
  const [currentUser, setCurrentUser] = useState(null);
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
    contact_preference: '',
    photos: []
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [caseId, setCaseId] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const routeLocation = useLocation();

  // Read Pathway params if coming from Rights Pathway
  const pathwayParams = useMemo(() => {
    const params = new URLSearchParams(routeLocation.search);
    if (params.get('source') !== 'pathway') return null;

    const type = params.get('type') || '';
    const loc = params.get('location') || '';
    const barrier = params.get('barrier') || '';

    const violationTypeMap = {
      physical_access: 'physical_space',
      digital_access: 'digital_website',
      service_animal: 'physical_space',
      communication: 'physical_space',
      employment: 'physical_space',
      housing: 'physical_space',
    };

    const businessTypeMap = {
      restaurant: 'Restaurant',
      store: 'Retail Store',
      hotel: 'Hotel/Lodging',
      medical: 'Medical Office',
      government: 'Government Building',
      school: 'Education',
      other_business: 'Other',
      business_website: 'Website/App',
      government_website: 'Government Building',
      app: 'Website/App',
      ecommerce: 'Website/App',
      hospital_public: 'Medical Office',
    };

    const subtypeMap = {
      service_animal: 'Service Animal Denial',
      communication: 'Other',
      employment: 'Other',
      housing: 'Other',
    };
    const barrierSubtypeMap = {
      no_ramp: 'Path of Travel',
      stairs_only: 'Path of Travel',
      no_parking: 'Parking',
      parking_blocked: 'Parking',
      restroom: 'Restroom',
      narrow_door: 'Entrance/Exit',
      entrance: 'Entrance/Exit',
      elevator: 'Path of Travel',
      counter_high: 'Other',
      other: 'Other',
    };

    return {
      isFromPathway: true,
      violation_type: violationTypeMap[type] || '',
      business_type: businessTypeMap[loc] || '',
      violation_subtype: subtypeMap[type] || barrierSubtypeMap[barrier] || '',
    };
  }, [routeLocation.search]);

  const isFromPathway = !!pathwayParams;

  // Silently check if user is logged in (no redirect — page is public)
  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      const isAuthed = await base44.auth.isAuthenticated();
      if (!isAuthed || cancelled) return;
      try {
        const user = await base44.auth.me();
        if (!cancelled && user) setCurrentUser(user);
      } catch {
        // Not logged in — that's fine, form is public
      }
    }
    checkAuth();
    return () => { cancelled = true; };
  }, []);

  // Pre-fill from Pathway answers
  useEffect(() => {
    if (!pathwayParams) return;
    setFormData(prev => ({
      ...prev,
      violation_type: pathwayParams.violation_type || prev.violation_type,
      business_type: pathwayParams.business_type || prev.business_type,
      violation_subtype: pathwayParams.violation_subtype || prev.violation_subtype,
    }));
    setStep(2);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canContinue = () => {
    if (step === 1) return !!formData.violation_type;
    if (step === 2 && formData.violation_type === 'physical_space') {
      return !!(formData.business_name && formData.business_type && formData.city && formData.state && formData.street_address && formData.violation_subtype);
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
    if (!(formData.street_address || '').trim()) e.street_address = 'Street address is required';
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
    if (isFromPathway && step <= 2) return;
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
      photos: formData.photos || [],
      status: 'submitted',
      submitted_at: now
    };

    // If user is logged in, attach their ID
    if (currentUser) {
      casePayload.submitter_user_id = currentUser.id;
    }

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
        {/* Exit button */}
        {!submitted && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-sm)' }}>
            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600,
                color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.375rem 0.5rem'
              }}
              aria-label="Exit form"
            >
              ✕ Exit
            </button>
          </div>
        )}

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

        {!submitted && (
          <ProgressBar
            currentStep={isFromPathway ? step - 1 : step}
            totalOverride={isFromPathway ? 4 : undefined}
            labelsOverride={isFromPathway ? ['Details', 'Incident', 'Contact', 'Review'] : undefined}
          />
        )}

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
          {/* Pathway context banner */}
          {isFromPathway && !submitted && step <= 5 && (
            <div style={{
              background: '#FFF8F5', border: '1px solid #FDBA7440',
              borderRadius: 'var(--radius-md)', padding: '12px 16px',
              marginBottom: 'var(--space-xl)', display: 'flex',
              alignItems: 'flex-start', gap: '10px'
            }}>
              <span aria-hidden="true" style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '1px' }}>✓</span>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
                color: 'var(--slate-700)', margin: 0, lineHeight: 1.5
              }}>
                We've carried over your answers from the Rights Pathway. Just fill in the remaining details below.
              </p>
            </div>
          )}

          {submitted && (
            <SuccessStep caseData={formData} caseId={caseId} isLoggedIn={!!currentUser} />
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
              showBack={isFromPathway ? step > 2 : step > 1}
              onBack={handleBack}
              onContinue={handleContinue}
              canContinue={canContinue()}
            />
          )}
        </div>
      </div>

      <ExitConfirmModal open={showExitConfirm} onStay={() => setShowExitConfirm(false)} />
    </div>
  );
}