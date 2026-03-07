import React, { useState, useRef, useEffect } from 'react';
import PathwayCard from '../components/pathway/PathwayCard';
import PathwayResults from '../components/pathway/PathwayResults';
import { generateResults } from '../components/pathway/PathwayLogic';

const STEPS_CONFIG = {
  physical_access: ['category', 'location', 'timing', 'barrier'],
  digital_access: ['category', 'location', 'timing'],
  service_animal: ['category', 'location', 'timing'],
  communication: ['category', 'location', 'timing'],
  employment: ['category', 'timing'],
  housing: ['category', 'timing'],
};

const STEP_LABELS = {
  category: 'What Happened',
  location: 'Where',
  timing: 'When',
  barrier: 'Barrier',
};

const CATEGORY_OPTIONS = [
  { emoji: '🚪', title: "I couldn't physically access a place", subtitle: 'Ramp, door, restroom, parking, elevator, or other physical barrier', value: 'physical_access' },
  { emoji: '💻', title: "A website or app didn't work for me", subtitle: 'Screen reader, keyboard, captions, or other digital barrier', value: 'digital_access' },
  { emoji: '🐕‍🦺', title: 'My service animal was refused', subtitle: 'Told to leave, denied entry, or asked for documentation', value: 'service_animal' },
  { emoji: '💼', title: 'I experienced job discrimination', subtitle: 'Hiring, firing, accommodations, or workplace barriers', value: 'employment' },
  { emoji: '🏠', title: 'I have a housing/landlord issue', subtitle: 'Service animal, modifications, or accessibility in housing', value: 'housing' },
  { emoji: '🗣️', title: 'I was denied communication access', subtitle: 'No interpreter, no Braille, no captions, or other communication barrier', value: 'communication' },
];

const LOCATION_OPTIONS = {
  physical_access: [
    { emoji: '🍽️', title: 'Restaurant or cafe', value: 'restaurant' },
    { emoji: '🏪', title: 'Store or shopping center', value: 'store' },
    { emoji: '🏨', title: 'Hotel or lodging', value: 'hotel' },
    { emoji: '🏥', title: 'Medical office or hospital', value: 'medical' },
    { emoji: '🏛️', title: 'Government building', value: 'government' },
    { emoji: '🏫', title: 'School or university', value: 'school' },
    { emoji: '🏢', title: 'Other business', value: 'other_business' },
  ],
  digital_access: [
    { emoji: '🏢', title: 'Business website', value: 'business_website' },
    { emoji: '🏛️', title: 'Government website', value: 'government_website' },
    { emoji: '📱', title: 'Mobile app', value: 'app' },
    { emoji: '🛒', title: 'Online store / e-commerce', value: 'ecommerce' },
  ],
  service_animal: [
    { emoji: '🍽️', title: 'Restaurant or cafe', value: 'restaurant' },
    { emoji: '🏪', title: 'Store or shopping center', value: 'store' },
    { emoji: '🏨', title: 'Hotel or lodging', value: 'hotel' },
    { emoji: '🏥', title: 'Medical office or hospital', value: 'medical' },
    { emoji: '🏛️', title: 'Government building', value: 'government' },
    { emoji: '🏫', title: 'School or university', value: 'school' },
    { emoji: '🏢', title: 'Other business', value: 'other_business' },
  ],
  communication: [
    { emoji: '🏥', title: 'Hospital or medical office', value: 'hospital_public' },
    { emoji: '🏛️', title: 'Government office or court', value: 'government' },
    { emoji: '🏫', title: 'School or university', value: 'school' },
    { emoji: '🏢', title: 'Business', value: 'other_business' },
  ],
};

const TIMING_OPTIONS = [
  { emoji: '📅', title: 'This week', value: 'this_week' },
  { emoji: '🗓️', title: 'This month', value: 'this_month' },
  { emoji: '⏳', title: '1–6 months ago', value: '1_6_months' },
  { emoji: '📆', title: '6–12 months ago', value: '6_12_months' },
  { emoji: '⌛', title: 'More than a year ago', value: 'over_1_year' },
];

const BARRIER_OPTIONS = [
  { emoji: '🚫', title: 'No ramp or stairs only', value: 'no_ramp' },
  { emoji: '🅿️', title: 'No accessible parking / parking blocked', value: 'no_parking' },
  { emoji: '🚻', title: 'Inaccessible restroom', value: 'restroom' },
  { emoji: '🚪', title: 'Narrow doorway or entrance blocked', value: 'narrow_door' },
  { emoji: '🛗', title: 'No elevator or elevator broken', value: 'elevator' },
  { emoji: '📏', title: "Counter too high or can't reach", value: 'counter_high' },
  { emoji: '❓', title: 'Other barrier', value: 'other' },
];

export default function RightsPathway() {
  const [answers, setAnswers] = useState({ category: '', location: '', timing: '', barrier: '' });
  const [showResults, setShowResults] = useState(false);
  const stepHeadingRef = useRef(null);
  const topRef = useRef(null);

  const steps = answers.category ? (STEPS_CONFIG[answers.category] || ['category', 'timing']) : ['category'];
  const currentStepKey = (() => {
    if (!answers.category) return 'category';
    for (const s of steps) {
      if (s === 'category' && !answers.category) return 'category';
      if (s === 'location' && !answers.location) return 'location';
      if (s === 'timing' && !answers.timing) return 'timing';
      if (s === 'barrier' && !answers.barrier) return 'barrier';
    }
    return 'done';
  })();

  const currentStepIndex = currentStepKey === 'done' ? steps.length : steps.indexOf(currentStepKey);
  const totalSteps = steps.length;

  useEffect(() => {
    if (currentStepKey === 'done' && !showResults) {
      setShowResults(true);
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentStepKey, showResults]);

  useEffect(() => {
    if (!showResults && stepHeadingRef.current) {
      stepHeadingRef.current.focus();
    }
  }, [currentStepKey, showResults]);

  const handleSelect = (key, value) => {
    const next = { ...answers, [key]: value };
    // Reset downstream answers
    if (key === 'category') {
      next.location = '';
      next.timing = '';
      next.barrier = '';
      setShowResults(false);
    }
    if (key === 'location') {
      next.timing = '';
      next.barrier = '';
    }
    if (key === 'timing') {
      next.barrier = '';
    }
    setAnswers(next);
  };

  const handleBack = () => {
    if (showResults) {
      setShowResults(false);
      const lastKey = steps[steps.length - 1];
      setAnswers({ ...answers, [lastKey]: '' });
      return;
    }
    const idx = steps.indexOf(currentStepKey);
    if (idx <= 0) return;
    const prevKey = steps[idx - 1];
    setAnswers({ ...answers, [prevKey]: '' });
  };

  const handleStartOver = () => {
    setAnswers({ category: '', location: '', timing: '', barrier: '' });
    setShowResults(false);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const results = showResults ? generateResults(answers) : null;

  const stepQuestions = {
    category: 'What happened?',
    location: 'Where did this happen?',
    timing: 'When did this happen?',
    barrier: 'What was the barrier?',
  };

  const getOptions = () => {
    if (currentStepKey === 'category') return CATEGORY_OPTIONS;
    if (currentStepKey === 'location') return LOCATION_OPTIONS[answers.category] || [];
    if (currentStepKey === 'timing') return TIMING_OPTIONS;
    if (currentStepKey === 'barrier') return BARRIER_OPTIONS;
    return [];
  };

  const progressPct = showResults ? 100 : totalSteps > 0 ? (currentStepIndex / totalSteps) * 100 : 0;

  return (
    <div ref={topRef} className="pw-page-wrap" style={{
      minHeight: '100vh', background: 'var(--page-bg-subtle)', padding: '48px 24px 64px'
    }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{
            display: 'inline-block', background: 'var(--section-label)', color: 'white',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '4px 14px', borderRadius: '100px', marginBottom: '12px'
          }}>
            Personalized Rights Pathway
          </span>
          <h1 style={{
            fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 700, color: 'var(--heading)', margin: '0 0 8px'
          }}>
            Know Your Rights
          </h1>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
            color: 'var(--body-secondary)', margin: 0, lineHeight: 1.6
          }}>
            Answer a few questions and we'll show you exactly what the law says about your situation.
          </p>
        </div>

        {/* Progress Bar */}
        {!showResults && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 600,
                color: 'var(--body)'
              }}>
                Step {currentStepIndex + 1} of {totalSteps}: {STEP_LABELS[currentStepKey]}
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={Math.round(progressPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Step ${currentStepIndex + 1} of ${totalSteps}`}
              style={{
                height: '6px', borderRadius: '100px', background: 'var(--card-bg)',
                overflow: 'hidden'
              }}
            >
              <div style={{
                height: '100%', borderRadius: '100px', background: 'var(--accent)',
                width: `${progressPct}%`, transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        {/* Wizard Steps */}
        {!showResults && (
          <div className="pw-card-inner" style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px',
            padding: '32px'
          }}>
            <h2
              ref={stepHeadingRef}
              tabIndex={-1}
              style={{
                fontFamily: 'Fraunces, serif', fontSize: '1.375rem', fontWeight: 700,
                color: 'var(--heading)', margin: '0 0 20px', outline: 'none'
              }}
            >
              {stepQuestions[currentStepKey]}
            </h2>

            <div
              role="radiogroup"
              aria-label={stepQuestions[currentStepKey]}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              {getOptions().map((opt, idx, arr) => (
                <PathwayCard
                  key={opt.value}
                  emoji={opt.emoji}
                  title={opt.title}
                  subtitle={opt.subtitle}
                  isSelected={answers[currentStepKey] === opt.value}
                  onClick={() => handleSelect(currentStepKey, opt.value)}
                  index={idx}
                  totalOptions={arr.length}
                  onArrowNav={(newIdx) => {
                    const cards = document.querySelectorAll('[role="radiogroup"] [role="radio"]');
                    cards[newIdx]?.focus();
                  }}
                />
              ))}
            </div>

            {/* Back button */}
            {currentStepIndex > 0 && (
              <div style={{ marginTop: '20px' }}>
                <button onClick={handleBack} className="pw-btn" style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', fontWeight: 600,
                  color: 'var(--body-secondary)', padding: '8px 4px', minHeight: '44px',
                  borderRadius: '6px'
                }}>
                  ← Back
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {showResults && results && (
          <PathwayResults results={results} answers={answers} onStartOver={handleStartOver} />
        )}

        {/* Live region */}
        <div aria-live="polite" style={{
          position: 'absolute', width: '1px', height: '1px',
          overflow: 'hidden', clip: 'rect(0,0,0,0)', clipPath: 'inset(50%)', whiteSpace: 'nowrap', border: 0, padding: 0, margin: '-1px'
        }}>
          {showResults ? 'Your personalized rights summary is now displayed.' :
            `Step ${currentStepIndex + 1} of ${totalSteps}: ${stepQuestions[currentStepKey]}`}
        </div>
      </div>

      <style>{`
        .pw-card:focus-visible {
          outline: 3px solid var(--accent-light) !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 3px rgba(194,65,12,0.4) !important;
        }
        .pw-btn:focus-visible {
          outline: 3px solid var(--accent-light);
          outline-offset: 2px;
        }
        .pw-link:focus-visible {
          outline: 3px solid var(--accent-light);
          outline-offset: 2px;
          border-radius: 10px;
        }
        @media (max-width: 360px) {
          .pw-page-wrap {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
          .pw-card-inner {
            padding: 28px 20px !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          * { transition: none !important; animation: none !important; }
        }
        @media (prefers-contrast: more) {
          .pw-card {
            border-width: 2px !important;
          }
          .pw-card-inner {
            border-width: 2px !important;
          }
        }
      `}</style>
    </div>
  );
}