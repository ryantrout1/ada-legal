import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import trackEvent from '../components/analytics/trackEvent';
import TitleTriageStep from '../components/intake/TitleTriageStep';
import ViolationTypeStep from '../components/intake/ViolationTypeStep';
import PhysicalSpaceStep from '../components/intake/PhysicalSpaceStep';
import DigitalWebsiteStep from '../components/intake/DigitalWebsiteStep';
import IncidentStep from '../components/intake/IncidentStep';
import ContactStep from '../components/intake/ContactStep';
import ReviewStep from '../components/intake/ReviewStep';
import SuccessStep from '../components/intake/SuccessStep';
import TitleIIIInfoBox from '../components/intake/TitleIIIInfoBox';
import ProgressBar from '../components/intake/ProgressBar';
import WizardNavButtons from '../components/intake/WizardNavButtons';
import ExitConfirmModal from '../components/intake/ExitConfirmModal';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY'
];

const PATHWAY_TYPE_MAP = {
  physical_access: 'physical_space',
  digital_access: 'digital_website',
  service_animal: 'physical_space',
  communication: 'physical_space',
  employment: 'physical_space',
  housing: 'physical_space',
  // Legacy short keys
  physical: 'physical_space',
  digital: 'digital_website'
};

const PATHWAY_LOCATION_MAP = {
  restaurant: 'Restaurant',
  store: 'Retail Store',
  retail: 'Retail Store',
  hotel: 'Hotel/Lodging',
  medical: 'Medical Office',
  government: 'Government Building',
  school: 'Education',
  transit: 'Transportation',
  entertainment: 'Entertainment Venue',
  other_business: 'Other',
  other: 'Other',
  business_website: 'Website/App',
  government_website: 'Government Building',
  app: 'Website/App',
  ecommerce: 'Website/App',
  hospital_public: 'Medical Office'
};

const PATHWAY_BARRIER_MAP = {
  no_ramp: 'Path of Travel',
  stairs_only: 'Path of Travel',
  no_parking: 'Parking',
  parking_blocked: 'Parking',
  parking: 'Parking',
  restroom: 'Restroom',
  narrow_door: 'Entrance/Exit',
  entrance: 'Entrance/Exit',
  elevator: 'Path of Travel',
  counter_high: 'Other',
  path: 'Path of Travel',
  service_animal: 'Service Animal Denial',
  other: 'Other'
};

export default function Intake() {
  const [step, setStep] = useState(0); // 0 = triage, 1-5 = wizard
  const [formData, setFormData] = useState({
    violation_type: '',
    business_name: '',
    business_type: '',
    city: '',
    state: '',
    street_address: '',
    url_domain: '',
    assistive_tech: [],
    violation_subtype: '',
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
  const [currentUser, setCurrentUser] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const reportStartedRef = useRef(false);

  // ========================================
  // COGA: Save/Resume — auto-save draft to sessionStorage
  // ========================================
  const DRAFT_KEY = 'ada-intake-draft';
  const DRAFT_STEP_KEY = 'ada-intake-draft-step';

  // Restore draft on mount
  useEffect(() => {
    try {
      const savedDraft = sessionStorage.getItem(DRAFT_KEY);
      const savedStep = sessionStorage.getItem(DRAFT_STEP_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        // Only restore if there's meaningful data
        const hasData = parsed.violation_type || parsed.business_name || parsed.narrative || parsed.contact_name;
        if (hasData) {
          setFormData(prev => ({ ...prev, ...parsed, photos: [] })); // photos can't be serialized
          if (savedStep && parseInt(savedStep) > 0) {
            setStep(parseInt(savedStep));
            reportStartedRef.current = true;
          }
          setDraftRestored(true);
        }
      }
    } catch {}
  }, []);

  // Auto-save on every field change (after step 0)
  useEffect(() => {
    if (step < 1 || submitted) return;
    try {
      const { photos, ...serializable } = formData;
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(serializable));
      sessionStorage.setItem(DRAFT_STEP_KEY, String(step));
    } catch {}
  }, [formData, step, submitted]);

  // Clear draft on successful submit
  const clearDraft = () => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
      sessionStorage.removeItem(DRAFT_STEP_KEY);
    } catch {}
  };

  const goToStep = (n) => {
    if (n === 1 && !reportStartedRef.current) {
      reportStartedRef.current = true;
      base44.analytics.track({ eventName: 'report_started', properties: { source: isFromPathway ? 'pathway' : 'direct' } });
      trackEvent('report_started', { source: isFromPathway ? 'pathway' : 'direct' }, 'Intake');
    }
    setStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const formRegion = document.querySelector('[role="form"]');
      if (formRegion) {
        formRegion.setAttribute('tabIndex', '-1');
        formRegion.focus({ preventScroll: true });
      }
    }, 150);
  };

  // Read URL params for pathway integration
  const urlParams = new URLSearchParams(window.location.search);
  const isFromPathway = urlParams.get('source') === 'pathway';
  const pathwayType = urlParams.get('type');
  const pathwayLocation = urlParams.get('location');
  const pathwayBarrier = urlParams.get('barrier');

  // Warn before accidental navigation if form has data (only after triage)
  useEffect(() => {
    const hasData = (step > 0) && (formData.violation_type || formData.business_name || formData.narrative);
    if (!hasData || submitted) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step, formData.violation_type, formData.business_name, formData.narrative, submitted]);

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {
        setCurrentUser(null);
      }
    }
    loadUser();
  }, []);

  // Pre-fill from pathway on mount
  useEffect(() => {
    if (isFromPathway) {
      reportStartedRef.current = true;
      base44.analytics.track({ eventName: 'report_started', properties: { source: 'pathway' } });
      trackEvent('report_started', { source: 'pathway' }, 'Intake');
      const updates = {};
      if (pathwayType && PATHWAY_TYPE_MAP[pathwayType]) {
        updates.violation_type = PATHWAY_TYPE_MAP[pathwayType];
      }
      if (pathwayLocation && PATHWAY_LOCATION_MAP[pathwayLocation]) {
        updates.business_type = PATHWAY_LOCATION_MAP[pathwayLocation];
      }
      if (pathwayBarrier && PATHWAY_BARRIER_MAP[pathwayBarrier]) {
        updates.violation_subtype = PATHWAY_BARRIER_MAP[pathwayBarrier];
      }
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
      }
      // Skip triage + violation type — jump to step 2
      setStep(2);
    }
  }, []);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const canContinue = () => {
    if (step === 1) return !!formData.violation_type;
    return true;
  };

  const handleContinue = () => {
    setErrors({});
    let valid = false;
    if (step === 1) {
      goToStep(2);
      return;
    } else if (step === 2) {
      const isPhysical = formData.violation_type === 'physical_space';
      valid = isPhysical ? validateStep2Physical() : validateStep2Digital();
      if (valid) { goToStep(3); return; }
    } else if (step === 3) {
      valid = validateStep3();
      if (valid) { goToStep(4); return; }
    } else if (step === 4) {
      valid = validateStep4();
      if (valid) { goToStep(5); return; }
    }
    // COGA: Validation failed — focus the error summary banner
    setTimeout(() => {
      const summary = document.getElementById('error-summary');
      if (summary) {
        summary.scrollIntoView({ behavior: 'smooth', block: 'center' });
        summary.focus();
      } else {
        // Fallback: focus first invalid field
        const firstError = document.querySelector('[aria-invalid="true"]');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstError.focus();
        }
      }
    }, 50);
  };

  const validateStep2Physical = () => {
    const e = {};
    if (!formData.business_name.trim()) e.business_name = 'We need the business name to identify the location — even a partial name helps';
    if (!formData.business_type) e.business_type = 'Select the closest match — you can add details later';
    if (!formData.city.trim()) e.city = 'Which city was this in?';
    if (!formData.state) e.state = 'Which state?';
    if (!formData.street_address || !formData.street_address.trim()) e.street_address = 'A street address helps attorneys verify the location — approximate is fine';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep4 = () => {
    const e = {};
    if (!formData.contact_name.trim()) e.contact_name = 'An attorney will need your name to follow up';
    const email = formData.contact_email.trim();
    if (!email) {
      e.contact_email = 'We\'ll only use this to send you updates about your case';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.contact_email = 'This doesn\'t look quite right — check for typos (e.g., name@email.com)';
    }
    const digits = (formData.contact_phone || '').replace(/\D/g, '');
    if (!formData.contact_phone.trim()) {
      e.contact_phone = 'A phone number lets attorneys reach you directly';
    } else if (digits.length !== 10) {
      e.contact_phone = 'US phone numbers are 10 digits — check for missing or extra numbers';
    }
    if (!formData.contact_preference) e.contact_preference = 'How would you prefer to be contacted?';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e = {};
    if (!formData.incident_date) {
      e.incident_date = 'When did this happen? An approximate date is fine';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (formData.incident_date > today) e.incident_date = 'This date is in the future — did you mean a past date?';
    }
    if (!formData.visited_before) e.visited_before = 'This helps attorneys understand the pattern — just pick the closest answer';
    if (!formData.narrative || !formData.narrative.trim()) {
      e.narrative = 'Tell us what happened in your own words — there are no wrong answers';
    } else if (formData.narrative.trim().length < 50) {
      e.narrative = `Almost there — a few more details would help (${formData.narrative.trim().length}/50 characters)`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2Digital = () => {
    const e = {};
    const url = formData.url_domain.trim();
    if (!url) {
      e.url_domain = 'What website or app had the accessibility issue?';
    } else {
      const urlPattern = /^(https?:\/\/)?[\w.-]+\.\w{2,}(\/.*)?$|^[\w\s]+$/i;
      if (!urlPattern.test(url)) {
        e.url_domain = 'Try entering just the website address (e.g., www.example.com) or the app name';
      }
    }
    if (!formData.assistive_tech || formData.assistive_tech.length === 0) {
      e.assistive_tech = 'Which tools were you using when you encountered the barrier?';
    }
    if (!formData.business_name.trim()) e.business_name = 'What company or organization runs this website/app?';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleBack = () => {
    setErrors({});
    if (isFromPathway && step <= 2) return;
    if (step === 1) { setStep(0); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const formRegion = document.querySelector('[role="form"]');
      if (formRegion) {
        formRegion.setAttribute('tabIndex', '-1');
        formRegion.focus({ preventScroll: true });
      }
    }, 150);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    const now = new Date().toISOString();
    const isPhysical = formData.violation_type === 'physical_space';

    // 1. Upload photos (if any) via UploadFile integration
    let photoUrls = [];
    if (formData.photos && formData.photos.length > 0) {
      for (const photo of formData.photos) {
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({
            file: photo.file
          });
          if (file_url) photoUrls.push(file_url);
        } catch (uploadErr) {
          console.error('Photo upload failed:', uploadErr);
        }
      }
    }

    // 2. Create Case record
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
      photos: photoUrls,
      intake_source: isFromPathway ? 'pathway' : 'direct',
      status: 'submitted',
      submitted_at: now
    };

    // If user is logged in, attach their ID
    if (currentUser) {
      casePayload.submitter_user_id = currentUser.id;
    }

    try {
      const newCase = await base44.entities.Case.create(casePayload);
      setCaseId(newCase.id);

      // 3. Create TimelineEvent
      await base44.entities.TimelineEvent.create({
        case_id: newCase.id,
        event_type: 'submitted',
        event_description: 'Your ADA violation report has been received and is pending review.',
        actor_role: 'system',
        visible_to_user: true,
        created_at: now
      });

      base44.analytics.track({ eventName: 'report_completed', properties: { violation_type: formData.violation_type, source: isFromPathway ? 'pathway' : 'direct' } });
      trackEvent('report_completed', { violation_type: formData.violation_type, source: isFromPathway ? 'pathway' : 'direct' }, 'Intake');

      setSubmitting(false);
      setSubmitted(true);
      clearDraft(); // COGA: Clear saved draft on successful submit
    } catch (err) {
      console.error('Case submission failed:', err);
      setSubmitting(false);
      setErrors(prev => ({ ...prev, submit: 'Something went wrong submitting your report. Your information has been preserved — please try the Submit button again. If the problem continues, email support@adalegallink.com.' }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--page-bg-subtle)',
      minHeight: 'calc(100vh - 200px)',
      padding: 'var(--space-xl) var(--space-lg)'
    }}>
      <div style={{
        maxWidth: step === 0 && !submitted ? '860px' : '720px',
        margin: '0 auto',
        transition: 'max-width 0.3s ease'
      }}>
        {/* Exit button — shown during wizard steps, not triage */}
        {!submitted && step > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-sm)' }}>
            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600,
                color: 'var(--body-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.375rem 0.5rem'
              }}
              aria-label="Exit form"
            >
              ✕ Exit
            </button>
          </div>
        )}

        {/* COGA: Draft restored notification */}
        {draftRestored && !submitted && step > 0 && (
          <div
            role="status"
            aria-live="polite"
            style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #93C5FD',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-md) var(--space-lg)',
              marginBottom: 'var(--space-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-md)',
              flexWrap: 'wrap'
            }}
          >
            <p style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#1E40AF',
              margin: 0
            }}>
              ✓ Your previous progress has been restored.
            </p>
            <button
              type="button"
              onClick={() => {
                clearDraft();
                setFormData({
                  violation_type: '', business_name: '', business_type: '', city: '', state: '',
                  street_address: '', url_domain: '', assistive_tech: [], violation_subtype: '',
                  incident_date: '', visited_before: '', narrative: '',
                  contact_name: '', contact_email: '', contact_phone: '', contact_preference: '', photos: []
                });
                setStep(0);
                setDraftRestored(false);
              }}
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#1E40AF',
                background: 'transparent',
                border: '1px solid #93C5FD',
                borderRadius: 'var(--radius-sm)',
                padding: '0.375rem 0.75rem',
                cursor: 'pointer',
                minHeight: '36px'
              }}
            >
              Start over
            </button>
          </div>
        )}

        <h1 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          fontWeight: 700,
          color: 'var(--heading)',
          marginBottom: 'var(--space-xs)',
          textAlign: 'center'
        }}>
          {submitted ? 'Thank You' : step === 0 ? 'What kind of access barrier did you experience?' : 'Report an ADA Violation'}
        </h1>
        {!submitted && step > 0 && (
          <p style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: '1rem',
            color: 'var(--body-secondary)',
            textAlign: 'center',
            marginBottom: 'var(--space-2xl)'
          }}>
            No account required. Your information is kept confidential.
            {' '}We share qualifying reports with ADA attorneys in our network. While not every report results in attorney representation, every submission is reviewed — and we provide resources to help you take action regardless.
          </p>
        )}

        {!submitted && step > 0 && (
          <ProgressBar
            currentStep={isFromPathway ? step - 1 : step}
            totalOverride={isFromPathway ? 4 : undefined}
            labelsOverride={isFromPathway ? ['Details', 'Incident', 'Contact', 'Review'] : undefined}
            onStepClick={(targetStep) => {
              // COGA: Allow clicking completed steps to go back
              const actualStep = isFromPathway ? targetStep + 1 : targetStep;
              if (actualStep < step) {
                setErrors({});
                goToStep(actualStep);
              }
            }}
          />
        )}

        <div
          style={step === 0 && !submitted ? {
            padding: 'clamp(1rem, 3vw, 1.5rem) 0'
          } : {
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: 'clamp(1.5rem, 4vw, 2.5rem)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}
          role="form"
          aria-label="ADA Violation Report Form"
        >
          {/* Screen reader step announcement */}
          <div aria-live="polite" className="sr-only" style={{
            position: 'absolute', width: '1px', height: '1px',
            overflow: 'hidden', clip: 'rect(0,0,0,0)', clipPath: 'inset(50%)', whiteSpace: 'nowrap', border: 0
          }}>
            {submitted
              ? 'Your report has been submitted successfully.'
              : step === 0
                ? 'Select the type of access barrier you experienced.'
                : `Step ${isFromPathway ? step - 1 : step} of ${isFromPathway ? 4 : 5}: ${
                    (isFromPathway
                      ? ['Details', 'Incident', 'Contact', 'Review']
                      : ['Violation Type', 'Details', 'Incident', 'Contact', 'Review']
                    )[step - 1] || ''
                  }`
            }
          </div>

          {errors.submit && (
            <div role="alert" style={{
              background: '#FEE2E2', border: '1px solid #FCA5A5',
              borderRadius: 'var(--radius-md)', padding: '16px',
              marginBottom: 'var(--space-xl)', fontFamily: 'Manrope, sans-serif',
              fontSize: '0.9375rem', color: '#991B1B', lineHeight: 1.6
            }}>
              <strong>Submission Error:</strong> {errors.submit}
            </div>
          )}

          {/* COGA: Error summary banner — shows count + clickable links to each error */}
          {(() => {
            const fieldErrors = Object.entries(errors).filter(([k]) => k !== 'submit');
            if (fieldErrors.length === 0) return null;
            const FIELD_LABELS = {
              business_name: 'Business name',
              business_type: 'Business type',
              city: 'City',
              state: 'State',
              street_address: 'Street address',
              url_domain: 'Website URL',
              assistive_tech: 'Assistive technology',
              incident_date: 'Incident date',
              visited_before: 'Visited before',
              narrative: 'Description',
              contact_name: 'Full name',
              contact_email: 'Email',
              contact_phone: 'Phone',
              contact_preference: 'Contact preference'
            };
            return (
              <div
                id="error-summary"
                role="alert"
                tabIndex={-1}
                style={{
                  background: '#FEF2F2',
                  border: '2px solid #FCA5A5',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  marginBottom: 'var(--space-xl)',
                  fontFamily: 'Manrope, sans-serif',
                  outline: 'none'
                }}
              >
                <p style={{
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  color: '#991B1B',
                  margin: '0 0 8px 0'
                }}>
                  {fieldErrors.length === 1
                    ? 'There is 1 field that needs your attention:'
                    : `There are ${fieldErrors.length} fields that need your attention:`}
                </p>
                <ul style={{
                  margin: 0,
                  padding: '0 0 0 20px',
                  listStyle: 'none'
                }}>
                  {fieldErrors.map(([field, msg]) => (
                    <li key={field} style={{ marginBottom: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(field);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el.focus();
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontFamily: 'Manrope, sans-serif',
                          fontSize: '0.8125rem',
                          color: '#991B1B',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        {FIELD_LABELS[field] || field}: {msg}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}
          {/* Pathway context banner */}
          {isFromPathway && !submitted && step <= 5 && (
            <div style={{
              background: 'var(--card-bg-tinted)', border: '1px solid #FDBA7440',
              borderRadius: 'var(--radius-md)', padding: '12px 16px',
              marginBottom: 'var(--space-xl)', display: 'flex',
              alignItems: 'flex-start', gap: '10px'
            }}>
              <span aria-hidden="true" style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '1px' }}>✓</span>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
                color: 'var(--body)', margin: 0, lineHeight: 1.5
              }}>
                We've carried over your answers from the Rights Pathway. Just fill in the remaining details below.
              </p>
            </div>
          )}

          {submitted && (
            <>
              <SuccessStep caseData={formData} caseId={caseId} isLoggedIn={!!currentUser} />
              <TitleIIIInfoBox />
            </>
          )}

          {!submitted && step === 0 && (
            <TitleTriageStep onSelectTitleIII={() => goToStep(1)} />
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

          {!submitted && step >= 1 && step < 5 && (
            <WizardNavButtons
              showBack={isFromPathway ? step > 2 : step > 0}
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