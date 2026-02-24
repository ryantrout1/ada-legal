import React, { useState } from 'react';
import ReviewSection, { ReviewItem } from './ReviewSection';

const VISITED_LABELS = { yes: 'Yes', no: 'No', first_time: 'First Time' };
const PREF_LABELS = { phone: 'Phone', email: 'Email', no_preference: 'No Preference' };

export default function ReviewStep({ data, onEdit, onSubmit, submitting }) {
  const [consent, setConsent] = useState(false);
  const isPhysical = data.violation_type === 'physical_space';

  return (
    <div>
      <p style={{
        fontFamily: 'Manrope, sans-serif',
        fontSize: '1.0625rem',
        color: 'var(--slate-600)',
        marginBottom: 'var(--space-xl)',
        lineHeight: 1.6
      }}>
        Please review your information before submitting.
      </p>

      {/* Violation Type */}
      <ReviewSection title="Violation Type" onEdit={() => onEdit(1)}>
        <ReviewItem label="Type" value={isPhysical ? 'Physical Space' : 'Digital / Website'} />
      </ReviewSection>

      {/* Location / Website Details */}
      <ReviewSection title={isPhysical ? 'Location Details' : 'Website Details'} onEdit={() => onEdit(2)}>
        <ReviewItem label="Business Name" value={data.business_name} />
        {isPhysical && (
          <>
            <ReviewItem label="Business Type" value={data.business_type} />
            <ReviewItem label="City" value={data.city} />
            <ReviewItem label="State" value={data.state} />
            {data.street_address && <ReviewItem label="Street Address" value={data.street_address} />}
            <ReviewItem label="Violation Sub-type" value={data.violation_subtype} />
          </>
        )}
        {!isPhysical && (
          <>
            <ReviewItem label="Website / App" value={data.url_domain} />
            <ReviewItem label="Assistive Tech" value={(data.assistive_tech || []).join(', ')} />
          </>
        )}
      </ReviewSection>

      {/* Incident Details */}
      <ReviewSection title="Incident Details" onEdit={() => onEdit(3)}>
        <ReviewItem label="Date" value={data.incident_date} />
        <ReviewItem label="Visited Before" value={VISITED_LABELS[data.visited_before] || data.visited_before} />
        <ReviewItem label="Description" value={data.narrative} />
        {data.photos && data.photos.length > 0 && (
          <>
            <ReviewItem label="Photos" value={`${data.photos.length} attached`} />
            <dt style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
              fontWeight: 600, color: 'var(--slate-600)'
            }}> </dt>
            <dd style={{ margin: 0 }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {data.photos.map((photo, i) => (
                  <img
                    key={i}
                    src={photo.data}
                    alt={`Violation photo ${i + 1}`}
                    style={{
                      width: '60px', height: '60px', objectFit: 'cover',
                      borderRadius: '6px', border: '1px solid var(--slate-200)'
                    }}
                  />
                ))}
              </div>
            </dd>
          </>
        )}
      </ReviewSection>

      {/* Contact Information */}
      <ReviewSection title="Contact Information" onEdit={() => onEdit(4)}>
        <ReviewItem label="Name" value={data.contact_name} />
        <ReviewItem label="Email" value={data.contact_email} />
        <ReviewItem label="Phone" value={data.contact_phone} />
        <ReviewItem label="Preferred Method" value={PREF_LABELS[data.contact_preference] || data.contact_preference} />
      </ReviewSection>

      {/* Consent */}
      <div style={{ marginTop: 'var(--space-xl)' }}>
        <label
          htmlFor="consent"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            cursor: 'pointer',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.9375rem',
            color: 'var(--slate-800)',
            lineHeight: 1.5
          }}
        >
          <input
            id="consent"
            type="checkbox"
            checked={consent}
            onChange={e => setConsent(e.target.checked)}
            aria-required="true"
            style={{
              width: '20px',
              height: '20px',
              accentColor: '#C2410C',
              cursor: 'pointer',
              flexShrink: 0,
              marginTop: '2px'
            }}
          />
          I confirm this information is accurate and understand that submitting this report does not guarantee attorney representation. I consent to my report being reviewed and, if approved, shared with licensed attorneys in the ADA Legal Link network.
        </label>

        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.8125rem',
          color: 'var(--slate-500)',
          fontStyle: 'italic',
          lineHeight: 1.5,
          marginTop: 'var(--space-md)',
          marginBottom: 'var(--space-xl)'
        }}>
          This platform is not a law firm and does not provide legal advice. Submitting a report does not create an attorney-client relationship.
        </p>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!consent || submitting}
          style={{
            width: '100%',
            padding: '0.875rem',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '1.0625rem',
            fontWeight: 700,
            color: 'white',
            backgroundColor: consent && !submitting ? 'var(--terra-600)' : 'var(--slate-400)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: consent && !submitting ? 'pointer' : 'not-allowed',
            minHeight: '52px',
            transition: 'all 0.2s',
            opacity: consent && !submitting ? 1 : 0.7
          }}
          onMouseEnter={e => { if (consent && !submitting) e.target.style.backgroundColor = 'var(--terra-700)'; }}
          onMouseLeave={e => { if (consent && !submitting) e.target.style.backgroundColor = 'var(--terra-600)'; }}
        >
          {submitting ? 'Submitting…' : 'Submit Report →'}
        </button>
      </div>
    </div>
  );
}