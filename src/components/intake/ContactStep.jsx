import React from 'react';
import FormField from './FormField';
import { inputStyle, focusHandler, blurHandler, SELECTED_BG } from './formStyles';

const CONTACT_PREF_OPTIONS = [
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'no_preference', label: 'No Preference' }
];

export default function ContactStep({ data, onChange, errors }) {
  return (
    <div>
      <h2 style={{
        fontFamily: 'Fraunces, serif',
        fontSize: '1.25rem',
        fontWeight: 600,
        color: 'var(--heading)',
        margin: '0 0 var(--space-sm) 0'
      }}>
        Your Contact Information
      </h2>
      <p style={{
        fontFamily: 'Manrope, sans-serif',
        fontSize: '1.0625rem',
        color: 'var(--body)',
        marginBottom: 'var(--space-xl)',
        lineHeight: 1.6
      }}>
        Provide your contact information so a matched attorney can reach you.
      </p>

      <FormField label="Full Name" id="contact_name" required error={errors.contact_name}>
        <input
          id="contact_name"
          type="text"
          autoComplete="name"
          placeholder="Your full name"
          value={data.contact_name || ''}
          onChange={e => onChange('contact_name', e.target.value)}
          onFocus={focusHandler}
          onBlur={blurHandler}
          aria-required="true"
          aria-invalid={!!errors.contact_name}
          aria-describedby={errors.contact_name ? 'contact_name-error' : undefined}
          style={inputStyle}
        />
      </FormField>

      <FormField
        label="Email Address"
        id="contact_email"
        required
        error={errors.contact_email}
        helperText="We will use this to create your account and send case updates."
      >
        <input
          id="contact_email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={data.contact_email || ''}
          onChange={e => onChange('contact_email', e.target.value)}
          onFocus={focusHandler}
          onBlur={blurHandler}
          aria-required="true"
          aria-invalid={!!errors.contact_email}
          aria-describedby={errors.contact_email ? 'contact_email-error' : 'contact_email-helper'}
          style={inputStyle}
        />
      </FormField>

      <FormField label="Phone Number" id="contact_phone" required error={errors.contact_phone}>
        <input
          id="contact_phone"
          type="tel"
          autoComplete="tel"
          placeholder="(555) 123-4567"
          value={data.contact_phone || ''}
          onChange={e => onChange('contact_phone', e.target.value)}
          onFocus={focusHandler}
          onBlur={blurHandler}
          aria-required="true"
          aria-invalid={!!errors.contact_phone}
          aria-describedby={errors.contact_phone ? 'contact_phone-error' : undefined}
          style={inputStyle}
        />
      </FormField>

      <FormField
        label="Preferred Contact Method"
        id="contact_preference"
        required
        error={errors.contact_preference}
        helperText="Select one option."
      >
        <fieldset
          id="contact_preference"
          tabIndex={-1}
          role="radiogroup"
          style={{ border: 'none', margin: 0, padding: 0 }}
          aria-required="true"
          aria-invalid={!!errors.contact_preference}
          aria-describedby={errors.contact_preference ? 'contact_preference-error' : 'contact_preference-helper'}
          aria-label="Preferred contact method"
        >
          <legend style={{
            position: 'absolute', width: '1px', height: '1px',
            padding: 0, margin: '-1px', overflow: 'hidden',
            clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0
          }}>
            Preferred contact method
          </legend>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            {CONTACT_PREF_OPTIONS.map(option => {
              const isSelected = data.contact_preference === option.value;
              const radioId = `pref-${option.value}`;
              return (
                <label
                  key={option.value}
                  htmlFor={radioId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 1rem',
                    backgroundColor: isSelected ? SELECTED_BG : 'var(--surface)',
                    border: `2px solid ${isSelected ? '#C2410C' : 'var(--border)'}`,
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
                    id={radioId}
                    type="radio"
                    name="contact_preference"
                    value={option.value}
                    checked={isSelected}
                    onChange={() => onChange('contact_preference', option.value)}
                    style={{ accentColor: '#C2410C', cursor: 'pointer' }}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </FormField>
    </div>
  );
}