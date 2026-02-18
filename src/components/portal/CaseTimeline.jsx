import React from 'react';

const DOT_COLORS = {
  submitted: '#475569',
  reviewed: '#1D4ED8',
  approved: '#15803D',
  rejected: '#B91C1C',
  available: '#15803D',
  assigned: 'var(--terra-600, #C2410C)',
  contact_logged: '#15803D',
  reclaimed: '#92400E',
  closed: 'var(--slate-600)'
};

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

export default function CaseTimeline({ events }) {
  if (!events || events.length === 0) {
    return (
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569', margin: 0 }}>
        No timeline events yet.
      </p>
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.created_at || b.created_date) - new Date(a.created_at || a.created_date)
  );

  return (
    <div role="list" aria-label="Case timeline" style={{ position: 'relative', paddingLeft: '24px' }}>
      <div style={{
        position: 'absolute', left: '7px', top: '8px', bottom: '8px',
        width: '2px', backgroundColor: 'var(--slate-200)'
      }} />
      {sorted.map((ev, i) => {
        const color = DOT_COLORS[ev.event_type] || 'var(--slate-500)';
        return (
          <div role="listitem" key={ev.id || i} style={{
            position: 'relative', marginBottom: i < sorted.length - 1 ? '12px' : 0
          }}>
            <div style={{
              position: 'absolute', left: '-20px', top: '8px',
              width: '12px', height: '12px', borderRadius: '50%',
              backgroundColor: color
            }} />
            <div style={{
              backgroundColor: 'var(--slate-50)', borderRadius: '10px', padding: '12px 14px'
            }}>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
                color: '#475569', margin: '0 0 4px'
              }}>
                {formatDateTime(ev.created_at || ev.created_date)}
              </p>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
                color: 'var(--slate-800)', margin: 0, lineHeight: 1.5
              }}>
                {ev.event_description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}