import React from 'react';
import FormField from './FormField';

const BUSINESS_TYPES = [
  'Restaurant',
  'Retail Store',
  'Medical Office',
  'Government Building',
  'Hotel/Lodging',
  'Entertainment Venue',
  'Education',
  'Transportation',
  'Other'
];

const VIOLATION_SUBTYPES = [
  'Parking',
  'Entrance/Exit',
  'Restroom',
  'Path of Travel',
  'Service Animal Denial',
  'Other'
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL',
  'GA','HI','ID','IL','IN','IA','KS','KY','LA','ME',
  'MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI',
  'SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

const STATE_NAMES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',
  HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',
  LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',
  MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',
  NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',
  OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
  SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',
  WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'
};

const inputStyle = {
  width: '100%',
  minHeight: '44px',
  padding: '0.625rem 0.75rem',
  fontFamily: 'Manrope, sans-serif',
  fontSize: '1rem',
  color: 'var(--slate-800)',
  backgroundColor: 'var(--surface)',
  border: '2px solid var(--slate-200)',
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
  e.target.style.borderColor = 'var(--slate-200)';
  e.target.style.boxShadow = 'none';
};

export default function PhysicalSpaceStep({ data, onChange, errors }) {
  const update = (field, value) => onChange(field, value);

  return (
    <div>
      <p style={{
        fontFamily: 'Manrope, sans-serif',
        fontSize: '1.0625rem',
        color: 'var(--slate-600)',
        marginBottom: 'var(--space-xl)',
        lineHeight: 1.6
      }}>
        Tell us about the location where the physical ADA violation occurred.
      </p>

      <FormField label="Business Name" id="business_name" required error={errors.business_name}>
        <input
          id="business_name"
          type="text"
          placeholder="e.g., Downtown Café"
          value={data.business_name || ''}
          onChange={e => update('business_name', e.target.value)}
          onFocus={focusHandler}
          onBlur={blurHandler}
          aria-required="true"
          aria-invalid={!!errors.business_name}
          aria-describedby={errors.business_name ? 'business_name-error' : undefined}
          style={inputStyle}
        />
      </FormField>

      <FormField label="Business Type" id="business_type" required error={errors.business_type}>
        <select
          id="business_type"
          value={data.business_type || ''}
          onChange={e => update('business_type', e.target.value)}
          onFocus={focusHandler}
          onBlur={blurHandler}
          aria-required="true"
          aria-invalid={!!errors.business_type}
          aria-describedby={errors.business_type ? 'business_type-error' : undefined}
          style={{ ...inputStyle, appearance: 'auto' }}
        >
          <option value="">Select a business type</option>
          {BUSINESS_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
        <FormField label="City" id="city" required error={errors.city}>
          <input
            id="city"
            type="text"
            placeholder="City"
            value={data.city || ''}
            onChange={e => update('city', e.target.value)}
            onFocus={focusHandler}
            onBlur={blurHandler}
            aria-required="true"
            aria-invalid={!!errors.city}
            aria-describedby={errors.city ? 'city-error' : undefined}
            style={inputStyle}
          />
        </FormField>

        <FormField label="State" id="state" required error={errors.state}>
          <select
            id="state"
            value={data.state || ''}
            onChange={e => update('state', e.target.value)}
            onFocus={focusHandler}
            onBlur={blurHandler}
            aria-required="true"
            aria-invalid={!!errors.state}
            aria-describedby={errors.state ? 'state-error' : undefined}
            style={{ ...inputStyle, appearance: 'auto' }}
          >
            <option value="">Select state</option>
            {US_STATES.map(s => (
              <option key={s} value={s}>{STATE_NAMES[s]}</option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField
        label="Street Address"
        id="street_address"
        required
        error={errors.street_address}
      >
        <input
          id="street_address"
          type="text"
          placeholder="e.g., 123 Main St"
          value={data.street_address || ''}
          onChange={e => update('street_address', e.target.value)}
          onFocus={focusHandler}
          onBlur={blurHandler}
          aria-required="true"
          aria-invalid={!!errors.street_address}
          aria-describedby={errors.street_address ? 'street_address-error' : undefined}
          style={inputStyle}
        />
      </FormField>

      <FormField label="Violation Sub-type" id="violation_subtype" required error={errors.violation_subtype}>
        <select
          id="violation_subtype"
          value={data.violation_subtype || ''}
          onChange={e => update('violation_subtype', e.target.value)}
          onFocus={focusHandler}
          onBlur={blurHandler}
          aria-required="true"
          aria-invalid={!!errors.violation_subtype}
          aria-describedby={errors.violation_subtype ? 'violation_subtype-error' : undefined}
          style={{ ...inputStyle, appearance: 'auto' }}
        >
          <option value="">Select violation type</option>
          {VIOLATION_SUBTYPES.map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </FormField>
    </div>
  );
}