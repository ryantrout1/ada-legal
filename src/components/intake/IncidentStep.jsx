import React, { useState } from 'react';
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

// P1 FIX: Sample narrative so users know what "good" looks like
const EXAMPLE_NARRATIVE = `I visited Riverside Pharmacy on January 8th to pick up a prescription. The only entrance had three steps and no ramp. I use a wheelchair, so I couldn't get inside at all. A staff member came out and told me they don't have an accessible entrance. I had to leave without my medication.`;

export default function IncidentStep({ data, onChange, errors }) {
  const today = new Date().toISOString().split('T')[0];
  const charCount = (data.narrative || '').trim().length;

  // P1 FIX: Toggle state for example narrative
  const [showExample, setShowExample] = useState(false);

  return (
    <div>
      <h2 style={{
        fontFamily: 'Fraunces, serif',
        fontSize: '1.25rem',
        fontWeight: 600,
        color: 'var(--heading)',
        margin: '0 0 var(--space-sm) 0'
      }}>
        About the Incident
      </h2>
      <p style={{
        fontFamily: 'Manrope, sans-serif',
        fontSize: '1.0625rem',
        color: 'var(--body)',
        marginBottom: 'var(--space-xl)',
        lineHeight: 1.6
      }}>
        Provide details about the incident so an attorney can evaluate your case.
      </p>

      {/* P1 FIX: Date field with "approximate is fine" helper text */}
      <FormField
        label="When did this happen?"
        id="incident_date"
        required
        error={errors.incident_date}
        helperText="An approximate date is fine — even just the month and year helps."
      >
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
          aria-describedby={errors.incident_date ? 'incident_date-error' : 'incident_date-helper'}
          style={inputStyle}
        />
      </FormField>

      <FormField
        label="Have you visited/used this location or website before?"
        id="visited_before"
        required
        error={errors.visited_before}
        helperText="Select one option."
      >
        <fieldset
          style={{ border: 'none', margin: 0, padding: 0 }}
          aria-required="true"
          aria-invalid={!!errors.visited_before}
          aria-describedby={errors.visited_before ? 'visited_before-error' : 'visited_before-helper'}
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

      {/* P1 FIX: Numbered writing guide + expandable example above narrative */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <label
          htmlFor="narrative"
          style={{
            display: 'block',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: 'var(--heading)',
            marginBottom: 'var(--space-xs)'
          }}
        >
          Describe What Happened
          <span aria-label="required" style={{ color: '#991B1B', marginLeft: '4px' }}>*</span>
        </label>

        {/* Numbered writing prompts */}
        <div
          id="narrative-guide"
          style={{
            backgroundColor: 'var(--card-bg-tinted)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: 'var(--space-sm)'
          }}
        >
          <p style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--heading)',
            margin: '0 0 8px 0'
          }}>
            Answer these three questions in your own words:
          </p>
          <ol style={{
            margin: 0,
            padding: '0 0 0 20px',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.9375rem',
            color: 'var(--body)',
            lineHeight: 1.7
          }}>
            <li>What was the barrier — what couldn't you access or do?</li>
            <li>How did it affect you?</li>
            <li>What happened when you tried to get help or use the space?</li>
          </ol>

          {/* Expandable example */}
          <button
            type="button"
            onClick={() => setShowExample(prev => !prev)}
            aria-expanded={showExample}
            className="narrative-example-toggle"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              padding: '8px 0 0 0',
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--accent-light)',
              cursor: 'pointer',
              textDecoration: 'underline',
              minHeight: '44px'
            }}
          >
            <span aria-hidden="true">{showExample ? '▲' : '▼'}</span>
            {showExample ? 'Hide example' : 'Show me an example'}
          </button>

          {showExample && (
            <div
              style={{
                marginTop: '10px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px'
              }}
            >
              <p style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--body-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: '0 0 6px 0'
              }}>
                Example response:
              </p>
              <p style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.9375rem',
                color: 'var(--body)',
                lineHeight: 1.65,
                margin: 0,
                fontStyle: 'italic'
              }}>
                "{EXAMPLE_NARRATIVE}"
              </p>
            </div>
          )}
        </div>

        <textarea
          id="narrative"
          placeholder="Write in your own words — there are no wrong answers."
          value={data.narrative || ''}
          onChange={e => onChange('narrative', e.target.value)}
          onFocus={focusHandler}
          onBlur={blurHandler}
          aria-required="true"
          aria-invalid={!!errors.narrative}
          aria-describedby={errors.narrative ? 'narrative-error' : 'narrative-guide narrative-count'}
          rows={6}
          style={{
            ...inputStyle,
            minHeight: '140px',
            resize: 'vertical',
            lineHeight: 1.6
          }}
        />

        {errors.narrative ? (
          <p
            id="narrative-error"
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.875rem',
              color: '#B91C1C',
              margin: 'var(--space-xs) 0 0 0',
              lineHeight: 1.5
            }}
          >
            {errors.narrative}
          </p>
        ) : (
          <p
            id="narrative-count"
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.875rem',
              color: charCount >= 50 ? 'var(--accent-success, #15803D)' : 'var(--body-secondary)',
              margin: 'var(--space-xs) 0 0 0',
              lineHeight: 1.4
            }}
          >
            {charCount < 50
              ? `${charCount} characters — aim for at least 50`
              : `✓ ${charCount} characters`
            }
          </p>
        )}
      </div>

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
