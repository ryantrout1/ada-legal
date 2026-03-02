import React from 'react';
import FormField from './FormField';

const ASSISTIVE_TECH_OPTIONS = [
  { value: 'Screen Reader', label: 'Screen Reader (JAWS, NVDA, VoiceOver)' },
  { value: 'Voice Control', label: 'Voice Control' },
  { value: 'Screen Magnification', label: 'Screen Magnification' },
  { value: 'Keyboard-Only', label: 'Keyboard-Only Navigation' },
  { value: 'Other', label: 'Other' }
];

const inputStyle = {
  width: '100%',
  minHeight: '44px',
  padding: '0.625rem 0.75rem',
  fontFamily: 'Manrope, sans-serif',
  fontSize: '1rem',
  color: 'var(--heading)',
  backgroundColor: 'var(--surface)',
  border: '2px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box'
};

const focusHandler = (e) => {
  e.target.style.borderColor = '#1D4ED8';
  e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.15)';
};

const blurHandler = (e) => {
  e.target.style.borderColor = 'var(--border)';
  e.target.style.boxShadow = 'none';
};

export default function DigitalWebsiteStep({ data, onChange, errors }) {
  const selectedTech = data.assistive_tech || [];

  const toggleTech = (value) => {
    const updated = selectedTech.includes(value)
      ? selectedTech.filter(v => v !== value)
      : [...selectedTech, value];
    onChange('assistive_tech', updated);
  };

  return (
    <div>
      <p style={{
        fontFamily: 'Manrope, sans-serif',
        fontSize: '1.0625rem',
        color: 'var(--body)',
        marginBottom: 'var(--space-xl)',
        lineHeight: 1.6
      }}>
        Tell us about the website or app where you experienced an accessibility barrier.
      </p>

      <FormField label="Website URL or App Name" id="url_domain" required error={errors.url_domain}>
        <input
          id="url_domain"
          type="text"
          placeholder="e.g., www.example.com"
          value={data.url_domain || ''}
          onChange={e => onChange('url_domain', e.target.value)}
          onFocus={focusHandler}
          onBlur={blurHandler}
          aria-required="true"
          aria-invalid={!!errors.url_domain}
          aria-describedby={errors.url_domain ? 'url_domain-error' : undefined}
          style={inputStyle}
        />
      </FormField>

      <FormField label="Assistive Technology Used" id="assistive_tech" required error={errors.assistive_tech}>
        <fieldset
          style={{ border: 'none', margin: 0, padding: 0 }}
          aria-required="true"
          aria-invalid={!!errors.assistive_tech}
          aria-describedby={errors.assistive_tech ? 'assistive_tech-error' : undefined}
        >
          <legend className="sr-only" style={{
            position: 'absolute', width: '1px', height: '1px',
            padding: 0, margin: '-1px', overflow: 'hidden',
            clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0
          }}>
            Select assistive technologies used
          </legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {ASSISTIVE_TECH_OPTIONS.map(option => {
              const isChecked = selectedTech.includes(option.value);
              const checkboxId = `tech-${option.value.replace(/\s/g, '-').toLowerCase()}`;
              return (
                <label
                  key={option.value}
                  htmlFor={checkboxId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 0.75rem',
                    backgroundColor: isChecked ? '#FFF8F5' : 'var(--surface)',
                    border: `2px solid ${isChecked ? '#C2410C' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: '0.9375rem',
                    color: 'var(--heading)',
                    minHeight: '44px'
                  }}
                >
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleTech(option.value)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: '#C2410C',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </FormField>

      <FormField label="Business/Organization Name" id="business_name" required error={errors.business_name}>
        <input
          id="business_name"
          type="text"
          placeholder="e.g., Acme Retail Inc."
          value={data.business_name || ''}
          onChange={e => onChange('business_name', e.target.value)}
          onFocus={focusHandler}
          onBlur={blurHandler}
          aria-required="true"
          aria-invalid={!!errors.business_name}
          aria-describedby={errors.business_name ? 'business_name-error' : undefined}
          style={inputStyle}
        />
      </FormField>
    </div>
  );
}