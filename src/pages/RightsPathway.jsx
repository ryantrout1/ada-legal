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
    <div ref={topRef} style={{
      minHeight: '100vh', background: 'var(--slate-50)', padding: '48px 24px 64px'
    }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{
            display: 'inline-block', background: '#9A3412', color: 'white',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '4px 14px', borderRadius: '100px', marginBottom: '12px'
          }}>
            Personalized Rights Pathway
          </span>
          <h1 style={{
            fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 8px'
          }}>
            Know Your Rights
          </h1>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
            color: '#475569', margin: 0, lineHeight: 1.6
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
                color: 'var(--slate-600)'
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
                height: '6px', borderRadius: '100px', background: 'var(--slate-200)',
                overflow: 'hidden'
              }}
            >
              <div style={{
                height: '100%', borderRadius: '100px', background: '#C2410C',
                width: `${progressPct}%`, transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        {/* Wizard Steps */}
        {!showResults && (
          <div style={{
            background: 'white', border: '1px solid var(--slate-200)', borderRadius: '20px',
            padding: '32px'
          }}>
            <h2
              ref={stepHeadingRef}
              tabIndex={-1}
              style={{
                fontFamily: 'Fraunces, serif', fontSize: '1.375rem', fontWeight: 700,
                color: 'var(--slate-900)', margin: '0 0 20px', outline: 'none'
              }}
            >
              {stepQuestions[currentStepKey]}
            </h2>

            <div
              role="radiogroup"
              aria-label={stepQuestions[currentStepKey]}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              {getOptions().map(opt => (
                <PathwayCard
                  key={opt.value}
                  emoji={opt.emoji}
                  title={opt.title}
                  subtitle={opt.subtitle}
                  isSelected={answers[currentStepKey] === opt.value}
                  onClick={() => handleSelect(currentStepKey, opt.value)}
                />
              ))}
            </div>

            {/* Back button */}
            {currentStepIndex > 0 && (
              <div style={{ marginTop: '20px' }}>
                <button onClick={handleBack} style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', fontWeight: 600,
                  color: '#475569', padding: '8px 4px', minHeight: '44px',
                  borderRadius: '6px', outline: 'none'
                }}
                onFocus={e => { e.currentTarget.style.outline = '2px solid #C2410C'; e.currentTarget.style.outlineOffset = '2px'; }}
                onBlur={e => { e.currentTarget.style.outline = 'none'; }}
                >
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
          overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0, padding: 0, margin: '-1px'
        }}>
          {showResults ? 'Your personalized rights summary is now displayed.' :
            `Step ${currentStepIndex + 1} of ${totalSteps}: ${stepQuestions[currentStepKey]}`}
        </div>
      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          * { transition: none !important; animation: none !important; }
        }
      `}</style>
    </div>
  );
}