import React from 'react';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function DetailItem({ label, value }) {
  return (
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
        color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.05em',
        margin: '0 0 2px 0'
      }}>{label}</p>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
        color: 'var(--slate-800)', margin: 0, lineHeight: 1.5,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word'
      }}>{value || '—'}</p>
    </div>
  );
}

export default function CaseDetailPanel({ caseData }) {
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';

  return (
    <div style={{ padding: 'var(--space-lg)' }}>
      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>

        {/* Violation Details */}
        <div>
          <h3 style={{
            fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 600,
            color: 'var(--slate-900)', marginBottom: 'var(--space-md)',
            paddingBottom: 'var(--space-xs)', borderBottom: '1px solid var(--slate-200)'
          }}>Violation Details</h3>
          <DetailItem label="Type" value={isPhysical ? 'Physical Space' : 'Digital / Website'} />
          <DetailItem label="Business Name" value={c.business_name} />
          <DetailItem label="Business Type" value={c.business_type} />
          {isPhysical && (
            <>
              <DetailItem label="Street Address" value={c.street_address} />
              <DetailItem label="City / State" value={[c.city, c.state].filter(Boolean).join(', ')} />
              <DetailItem label="Violation Sub-type" value={c.violation_subtype} />
            </>
          )}
          {!isPhysical && (
            <>
              <DetailItem label="URL / App" value={c.url_domain} />
              <DetailItem label="Assistive Tech" value={(c.assistive_tech || []).join(', ')} />
            </>
          )}
        </div>

        {/* Incident & Contact */}
        <div>
          <h3 style={{
            fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 600,
            color: 'var(--slate-900)', marginBottom: 'var(--space-md)',
            paddingBottom: 'var(--space-xs)', borderBottom: '1px solid var(--slate-200)'
          }}>Incident</h3>
          <DetailItem label="Incident Date" value={formatDate(c.incident_date)} />
          <DetailItem label="Visited Before" value={
            c.visited_before === 'yes' ? 'Yes' : c.visited_before === 'no' ? 'No' : c.visited_before === 'first_time' ? 'First Time' : c.visited_before
          } />

          <h3 style={{
            fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 600,
            color: 'var(--slate-900)', marginBottom: 'var(--space-md)', marginTop: 'var(--space-lg)',
            paddingBottom: 'var(--space-xs)', borderBottom: '1px solid var(--slate-200)'
          }}>Contact Information</h3>
          <DetailItem label="Name" value={c.contact_name} />
          <DetailItem label="Email" value={c.contact_email} />
          <DetailItem label="Phone" value={c.contact_phone} />
          <DetailItem label="Preferred Contact" value={
            c.contact_preference === 'no_preference' ? 'No Preference' : c.contact_preference
          } />
        </div>
      </div>

      {/* Full-width narrative */}
      <div style={{ marginTop: 'var(--space-lg)' }}>
        <h3 style={{
          fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 600,
          color: 'var(--slate-900)', marginBottom: 'var(--space-sm)',
          paddingBottom: 'var(--space-xs)', borderBottom: '1px solid var(--slate-200)'
        }}>Narrative</h3>
        <div style={{
          backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)',
          borderRadius: 'var(--radius-md)', padding: 'var(--space-md)',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
          color: 'var(--slate-800)', lineHeight: 1.7, whiteSpace: 'pre-wrap'
        }}>
          {c.narrative || '—'}
        </div>
      </div>

      {/* Admin notes if any */}
      {c.admin_notes && (
        <div style={{ marginTop: 'var(--space-md)' }}>
          <DetailItem label="Admin Notes" value={c.admin_notes} />
        </div>
      )}
    </div>
  );
}