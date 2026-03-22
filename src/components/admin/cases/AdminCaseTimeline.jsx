import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

const ACTOR_BADGE = {
  system: { bg: 'var(--card-bg-tinted)', text: 'var(--body-secondary)', label: 'System' },
  admin:  { bg: '#DBEAFE', text: '#1E3A5F', label: 'Admin' },
  lawyer: { bg: '#FEF1EC', text: '#7C2D12', label: 'Lawyer' }
};

const EVENT_DOT = {
  submitted: 'var(--body-secondary)',
  reviewed: '#1D4ED8',
  approved: 'var(--suc-fg)',
  rejected: 'var(--err-fg)',
  available: 'var(--suc-fg)',
  assigned: 'var(--accent)',
  contact_logged: '#2563EB',
  reclaimed: 'var(--wrn-fg)',
  closed: 'var(--body-secondary)'
};

export default function AdminCaseTimeline({ caseId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function load() {
      const evts = await base44.entities.TimelineEvent.filter({ case_id: caseId }, '-created_date', 100);
      setEvents(evts);
      setLoading(false);
    }
    load();
  }, [caseId]);

  if (loading) {
    return (
      <div style={{ padding: '12px 0' }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body-secondary)' }}>Loading timeline…</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body-secondary)', padding: '8px 0' }}>
        No timeline events recorded.
      </p>
    );
  }

  const visible = showAll ? events : events.slice(0, 3);
  const remaining = events.length - 3;

  return (
    <div>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
        color: 'var(--body-secondary)', margin: '0 0 12px', textTransform: 'uppercase'
      }}>
        Timeline
      </p>
      <div style={{ position: 'relative', paddingLeft: '20px' }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute', left: '5px', top: '6px', bottom: '6px',
          width: '2px', backgroundColor: 'var(--card-border)'
        }} />

        {visible.map((evt, i) => {
          const dotColor = EVENT_DOT[evt.event_type] || 'var(--body-secondary)';
          const actor = ACTOR_BADGE[evt.actor_role] || ACTOR_BADGE.system;
          return (
            <div key={evt.id || i} style={{
              position: 'relative', paddingBottom: i < visible.length - 1 ? '14px' : '0'
            }}>
              {/* Dot */}
              <div style={{
                position: 'absolute', left: '-20px', top: '4px',
                width: '12px', height: '12px', borderRadius: '50%',
                backgroundColor: dotColor, border: '2px solid white'
              }} />
              {/* Content */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--body-secondary)', whiteSpace: 'nowrap'
                }}>
                  {formatDateTime(evt.created_at || evt.created_date)}
                </span>
                <span style={{
                  display: 'inline-block', padding: '1px 6px', borderRadius: '4px',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.625rem', fontWeight: 700,
                  color: actor.text, backgroundColor: actor.bg, textTransform: 'uppercase'
                }}>
                  {actor.label}
                </span>
              </div>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body)',
                margin: '2px 0 0', lineHeight: 1.5
              }}>
                {evt.event_description}
              </p>
            </div>
          );
        })}
      </div>

      {!showAll && remaining > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
            color: 'var(--accent)', padding: '8px 0 0 20px', minHeight: '36px'
          }}
        >
          Show {remaining} more event{remaining !== 1 ? 's' : ''}
        </button>
      )}
      {showAll && events.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
            color: 'var(--accent)', padding: '8px 0 0 20px', minHeight: '36px'
          }}
        >
          Show less
        </button>
      )}
    </div>
  );
}