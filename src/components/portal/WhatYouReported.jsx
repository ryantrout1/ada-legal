import React from 'react';
import { Building2, Globe } from 'lucide-react';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const labelStyle = {
  fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
  color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 3px'
};
const valStyle = {
  fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 600,
  color: 'var(--heading)', margin: 0
};

export default function WhatYouReported({ caseData }) {
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';
  const prefLabel = { phone: 'Phone', email: 'Email', no_preference: 'No Preference' }[c.contact_preference] || c.contact_preference;
  const location = isPhysical
    ? [c.street_address, c.city, c.state].filter(Boolean).join(', ')
    : [c.city, c.state].filter(Boolean).join(', ') || '—';

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '24px'
    }}>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600, color: 'var(--heading)', margin: '0 0 16px' }}>
        What You Reported
      </h2>

      {/* Violation Summary Card */}
      <div style={{ backgroundColor: 'var(--page-bg-subtle)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
        {/* Type Header */}
        <div style={{
          padding: '10px 16px',
          backgroundColor: isPhysical ? 'var(--card-bg-tinted)' : '#DBEAFE',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {isPhysical
            ? <Building2 size={16} style={{ color: 'var(--accent)' }} />
            : <Globe size={16} style={{ color: '#1E3A8A' }} />
          }
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700,
            color: isPhysical ? 'var(--accent)' : '#1E3A8A'
          }}>
            {isPhysical ? 'Physical Space Violation' : 'Digital / Website Violation'}
          </span>
        </div>
        {/* Row 2 — 3 columns */}
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div>
            <p style={labelStyle}>Business Name</p>
            <p style={valStyle}>{c.business_name}</p>
          </div>
          <div>
            <p style={labelStyle}>Business Type</p>
            <p style={valStyle}>{c.business_type || '—'}</p>
          </div>
          <div>
            <p style={labelStyle}>Location</p>
            <p style={valStyle}>{location}</p>
          </div>
        </div>
        {/* Row 3 — 2 columns */}
        <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <p style={labelStyle}>{isPhysical ? 'Violation Subtype' : 'Domain'}</p>
            <p style={valStyle}>{isPhysical ? (c.violation_subtype || '—') : (c.url_domain || '—')}</p>
          </div>
          <div>
            <p style={labelStyle}>Incident Date</p>
            <p style={valStyle}>{formatDate(c.incident_date)}</p>
          </div>
        </div>
        {!isPhysical && c.assistive_tech?.length > 0 && (
          <div style={{ padding: '0 16px 16px' }}>
            <p style={labelStyle}>Assistive Technologies</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {c.assistive_tech.map((t, i) => (
                <span key={i} style={{
                  display: 'inline-block', padding: '2px 10px', borderRadius: '6px',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
                  color: '#1E3A8A', backgroundColor: '#DBEAFE'
                }}>{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Narrative */}
      {c.narrative && (
        <div style={{
          borderLeft: '3px solid var(--accent)',
          backgroundColor: '#FFF8F5', borderRadius: '0 10px 10px 0', padding: '16px',
          marginBottom: '16px'
        }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--heading)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
            {c.narrative}
          </p>
        </div>
      )}

      {/* Contact Info */}
      <div style={{ backgroundColor: 'var(--page-bg-subtle)', borderRadius: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            Your Contact Info
          </p>
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: '8px',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
            color: 'var(--accent)', backgroundColor: 'var(--card-bg-tinted)'
          }}>You prefer: {prefLabel}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div>
            <p style={labelStyle}>Name</p>
            <p style={valStyle}>{c.contact_name}</p>
          </div>
          <div>
            <p style={labelStyle}>Email</p>
            <p style={valStyle}>{c.contact_email}</p>
          </div>
          <div>
            <p style={labelStyle}>Phone</p>
            <p style={valStyle}>{c.contact_phone}</p>
          </div>
        </div>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: '#475569', fontStyle: 'italic', margin: '12px 0 0' }}>
          This information is only shared with your assigned attorney.
        </p>
      </div>
    </div>
  );
}