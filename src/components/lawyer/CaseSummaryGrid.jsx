import React from 'react';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function extractDomain(url) {
  if (!url) return '—';
  try { const c = url.startsWith('http') ? url : `https://${url}`; return new URL(c).hostname; }
  catch { return url.split('/')[0]; }
}

const labelStyle = { fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 2px' };
const valueStyle = { fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 };

export default function CaseSummaryGrid({ caseData }) {
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';
  const visitedLabel = { yes: 'Yes', no: 'No', first_time: 'First Time' }[c.visited_before] || '—';

  const items = [
    { label: 'Business Type', value: c.business_type || '—' },
    { label: 'Location', value: isPhysical ? [c.street_address, c.city, c.state].filter(Boolean).join(', ') : [c.city, c.state].filter(Boolean).join(', ') || '—' },
    { label: isPhysical ? 'Violation Subtype' : 'Domain', value: isPhysical ? (c.violation_subtype || '—') : extractDomain(c.url_domain) },
    { label: 'Incident Date', value: formatDate(c.incident_date) },
    { label: 'Assigned', value: formatDate(c.assigned_at) },
    { label: 'Visit History', value: visitedLabel },
  ];

  return (
    <div style={{
      backgroundColor: 'var(--slate-50)', borderRadius: '10px', padding: '14px',
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px'
    }}>
      {items.map((item, i) => (
        <div key={i}>
          <p style={labelStyle}>{item.label}</p>
          <p style={valueStyle}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}