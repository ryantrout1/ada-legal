import React from 'react';
import {
  Send, Search, CheckCircle, XCircle, Globe, UserCheck,
  Phone, RotateCcw, Lock
} from 'lucide-react';

const eventIcons = {
  submitted: Send,
  reviewed: Search,
  approved: CheckCircle,
  rejected: XCircle,
  available: Globe,
  assigned: UserCheck,
  contact_logged: Phone,
  reclaimed: RotateCcw,
  closed: Lock
};

const eventColors = {
  submitted: '#1D4ED8',
  reviewed: '#92400E',
  approved: '#15803D',
  rejected: '#B91C1C',
  available: '#7C3AED',
  assigned: '#1D4ED8',
  contact_logged: '#065F46',
  reclaimed: '#92400E',
  closed: '#475569'
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
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
        color: 'var(--slate-500)', margin: 0
      }}>
        No timeline events yet.
      </p>
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.created_at || b.created_date) - new Date(a.created_at || a.created_date)
  );

  return (
    <div role="list" aria-label="Case timeline" style={{ position: 'relative', paddingLeft: '2rem' }}>
      {/* Vertical line */}
      <div style={{
        position: 'absolute', left: '11px', top: '4px', bottom: '4px',
        width: '2px', backgroundColor: 'var(--slate-200)'
      }} />

      {sorted.map((ev, i) => {
        const Icon = eventIcons[ev.event_type] || Send;
        const color = eventColors[ev.event_type] || 'var(--slate-500)';

        return (
        <div role="listitem" key={ev.id || i} style={{
            position: 'relative', marginBottom: i < sorted.length - 1 ? 'var(--space-lg)' : 0
          }}>
            {/* Dot */}
            <div style={{
              position: 'absolute', left: '-2rem', top: '2px',
              width: '24px', height: '24px', borderRadius: '50%',
              backgroundColor: 'white', border: `2px solid ${color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon size={12} aria-hidden="true" style={{ color }} />
            </div>

            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
              color: 'var(--slate-500)', margin: '0 0 0.25rem 0'
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
        );
      })}
    </div>
  );
}