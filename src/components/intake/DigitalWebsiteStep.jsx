import React from 'react';
import FormField from './FormField';
import { inputStyle, focusHandler, blurHandler, SELECTED_BG } from './formStyles';

const ASSISTIVE_TECH_OPTIONS = [
  { value: 'Screen Reader', label: 'Screen Reader (JAWS, NVDA, VoiceOver)' },
  { value: 'Voice Control', label: 'Voice Control' },
  { value: 'Screen Magnification', label: 'Screen Magnification' },
  { value: 'Keyboard-Only', label: 'Keyboard-Only Navigation' },
  { value: 'Other', label: 'Other' }
];

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
      <h2 style={{
        fontFamily: 'Fraunces, serif',
        fontSize: '1.25rem',
        fontWeight: 600,
        color: 'var(--heading)',
        margin: '0 0 var(--space-sm) 0'
      }}>
        Website or App Details
      </h2>
      <p style={{
        fontFamily: 'Manrope, sans-serif',
        fontSize: '1.0625rem',
        color: 'var(--body)',
        marginBottom: 'var(--space-xl)',
        lineHeight: 1.6
      }}>
        Tell us about the website or app where you experienced an accessibility barrier.
      </p>

      <FormField label="Website URL or App Name" id="url_domain" required error={errors.url_domain}
        helperText="Paste the web address (e.g., www.example.com) or type the app name."
      >
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
          aria-describedby={errors.url_domain ? 'url_domain-error' : 'url_domain-helper'}
          style={inputStyle}
        />
      </FormField>

      <FormField
        label="Assistive Technology Used"
        id="assistive_tech"
        required
        error={errors.assistive_tech}
        helperText="Select all the tools you were using when you hit the barrier. For example: a screen reader like JAWS or VoiceOver, keyboard-only navigation, screen magnification, or voice control like Dragon."
      >
        <fieldset
          id="assistive_tech"
          tabIndex={-1}
          style={{ border: 'none', margin: 0, padding: 0 }}
          aria-required="true"
          aria-invalid={!!errors.assistive_tech}
          aria-describedby={errors.assistive_tech ? 'assistive_tech-error' : 'assistive_tech-helper'}
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
                    backgroundColor: isChecked ? SELECTED_BG : 'var(--surface)',
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

      <FormField label="Business/Organization Name" id="business_name" required error={errors.business_name}
        helperText="The company or organization that runs the website or app."
      >
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
          aria-describedby={errors.business_name ? 'business_name-error' : 'business_name-helper'}
          style={inputStyle}
        />
      </FormField>
    </div>
  );
}