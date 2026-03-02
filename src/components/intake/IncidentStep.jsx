import React from 'react';
import FormField from './FormField';
import PhotoUpload from './PhotoUpload';

const VISITED_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'first_time', label: 'First Time' }
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

export default function IncidentStep({ data, onChange, errors }) {
  const today = new Date().toISOString().split('T')[0];
  const charCount = (data.narrative || '').length;

  return (
    <div>
      <p style={{
        fontFamily: 'Manrope, sans-serif',
        fontSize: '1.0625rem',
        color: 'var(--body)',
        marginBottom: 'var(--space-xl)',
        lineHeight: 1.6
      }}>
        Provide details about the incident so an attorney can evaluate your case.
      </p>

      <FormField label="When did this happen?" id="incident_date" required error={errors.incident_date}>
        <input
          id="incident_date"
          type="date"
          max={today}
          value={data.incident_date || ''}
          onChange={e => onChange('incident_date', e.target.value)}
          onFocus={focusHandler}
          onBlur={blurHandler}
          aria-required="true"
          aria-invalid={!!errors.incident_date}
          aria-describedby={errors.incident_date ? 'incident_date-error' : undefined}
          style={inputStyle}
        />
      </FormField>

      <FormField
        label="Have you visited/used this location or website before?"
        id="visited_before"
        required
        error={errors.visited_before}
      >
        <fieldset
          style={{ border: 'none', margin: 0, padding: 0 }}
          aria-required="true"
          aria-invalid={!!errors.visited_before}
          aria-describedby={errors.visited_before ? 'visited_before-error' : undefined}
        >
          <legend style={{
            position: 'absolute', width: '1px', height: '1px',
            padding: 0, margin: '-1px', overflow: 'hidden',
            clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0
          }}>
            Have you visited/used this location or website before?
          </legend>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            {VISITED_OPTIONS.map(option => {
              const isSelected = data.visited_before === option.value;
              const radioId = `visited-${option.value}`;
              return (
                <label
                  key={option.value}
                  htmlFor={radioId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 1rem',
                    backgroundColor: isSelected ? '#FFF8F5' : 'var(--surface)',
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
                    name="visited_before"
                    value={option.value}
                    checked={isSelected}
                    onChange={() => onChange('visited_before', option.value)}
                    style={{ accentColor: '#C2410C', cursor: 'pointer' }}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </FormField>

      <FormField label="Describe What Happened" id="narrative" required error={errors.narrative}>
        <textarea
          id="narrative"
          placeholder="Please describe the ADA violation you experienced in detail. Include what you observed, when it happened, and how it affected you."
          value={data.narrative || ''}
          onChange={e => onChange('narrative', e.target.value)}
          onFocus={focusHandler}
          onBlur={blurHandler}
          aria-required="true"
          aria-invalid={!!errors.narrative}
          aria-describedby={errors.narrative ? 'narrative-error' : 'narrative-count'}
          rows={6}
          style={{
            ...inputStyle,
            minHeight: '140px',
            resize: 'vertical',
            lineHeight: 1.6
          }}
        />
        <p
          id="narrative-count"
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.8125rem',
            color: charCount >= 50 ? 'var(--success-600)' : 'var(--body-secondary)',
            margin: 'var(--space-xs) 0 0 0',
            lineHeight: 1.4
          }}
        >
          {charCount} characters (minimum 50)
        </p>
      </FormField>

      {/* Photo Upload — Optional */}
      <FormField
        label="Photos of the Violation"
        id="photos"
        helperText="Optional — photos of barriers like missing ramps, blocked parking, narrow doorways, or inaccessible restrooms help attorneys evaluate your case faster."
      >
        <PhotoUpload
          photos={data.photos || []}
          onChange={(updated) => onChange('photos', updated)}
        />
      </FormField>
    </div>
  );
}