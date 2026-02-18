import React from 'react';
import { Building2, Globe, MapPin, Calendar, User, Mail, Phone } from 'lucide-react';

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: 'var(--space-md)' }}>
      <Icon size={18} aria-hidden="true" style={{ color: 'var(--slate-400)', flexShrink: 0, marginTop: '2px' }} />
      <div>
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
          color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>{label}</span>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
          color: 'var(--slate-800)', margin: '2px 0 0 0', lineHeight: 1.5
        }}>{value}</p>
      </div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function SubmissionDetails({ caseData }) {
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-lg)' }}>
        <div>
          <DetailRow icon={isPhysical ? Building2 : Globe} label="Violation Type"
            value={isPhysical ? 'Physical Space' : 'Digital / Website'} />
          <DetailRow icon={Building2} label="Business Name" value={c.business_name} />
          <DetailRow icon={Building2} label="Business Type" value={c.business_type} />
          <DetailRow icon={MapPin} label="Location" value={
            isPhysical
              ? [c.street_address, c.city, c.state].filter(Boolean).join(', ')
              : [c.city, c.state].filter(Boolean).join(', ') || null
          } />
          {isPhysical && <DetailRow icon={Building2} label="Violation Sub-type" value={c.violation_subtype} />}
          {!isPhysical && <DetailRow icon={Globe} label="URL / Domain" value={c.url_domain} />}
          {!isPhysical && c.assistive_tech?.length > 0 && (
            <DetailRow icon={Globe} label="Assistive Tech" value={c.assistive_tech.join(', ')} />
          )}
          <DetailRow icon={Calendar} label="Incident Date" value={formatDate(c.incident_date)} />
        </div>
        <div>
          <DetailRow icon={User} label="Contact Name" value={c.contact_name} />
          <DetailRow icon={Mail} label="Email" value={c.contact_email} />
          <DetailRow icon={Phone} label="Phone" value={c.contact_phone} />
          <DetailRow icon={User} label="Contact Preference" value={
            c.contact_preference === 'phone' ? 'Phone'
              : c.contact_preference === 'email' ? 'Email'
              : 'No Preference'
          } />
          <DetailRow icon={Calendar} label="Submitted" value={formatDate(c.submitted_at || c.created_date)} />
        </div>
      </div>

      {c.narrative && (
        <div style={{ marginTop: 'var(--space-lg)' }}>
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
            color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>Narrative</span>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
            color: 'var(--slate-700)', lineHeight: 1.7, whiteSpace: 'pre-wrap',
            marginTop: '0.375rem'
          }}>
            {c.narrative}
          </p>
        </div>
      )}
    </div>
  );
}