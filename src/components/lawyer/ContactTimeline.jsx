import React, { useState } from 'react';
import { Phone, Mail, Users, MoreHorizontal } from 'lucide-react';

const METHOD_LABELS = { phone: 'Phone', email: 'Email', in_person: 'In Person', other: 'Other' };
const METHOD_EMOJIS = { phone: '📞', email: '✉️', in_person: '🤝', other: '💬' };
const TYPE_LABELS = { initial_contact: 'Initial Contact', follow_up: 'Follow-Up', case_update: 'Case Update' };
const TYPE_BADGE_COLORS = {
  initial_contact: { bg: '#DBEAFE', color: '#1E3A8A' },
  follow_up: { bg: '#DCFCE7', color: '#15803D' },
  case_update: { bg: '#FEF3C7', color: '#92400E' }
};

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function ContactTimeline({ logs }) {
  const [expandedId, setExpandedId] = useState(null);
  const sorted = [...logs].sort((a, b) => new Date(b.logged_at || b.created_date) - new Date(a.logged_at || a.created_date));

  if (sorted.length === 0) {
    return (
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-400)', fontStyle: 'italic', margin: 0 }}>
        No contacts logged yet.
      </p>
    );
  }

  return (
    <div>
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 8px' }}>
        Contact History
      </p>
      <div style={{ position: 'relative', paddingLeft: '20px' }}>
        <div style={{ position: 'absolute', left: '7px', top: '6px', bottom: '6px', width: '2px', backgroundColor: 'var(--slate-200)' }} />
        {sorted.map((log, i) => {
          const badgeColor = TYPE_BADGE_COLORS[log.contact_type] || { bg: 'var(--slate-100)', color: 'var(--slate-600)' };
          const isExpanded = expandedId === log.id;
          const hasNotes = log.notes && log.notes.trim().length > 0;
          return (
            <div key={log.id} style={{ position: 'relative', marginBottom: i < sorted.length - 1 ? '6px' : 0 }}>
              <div style={{
                position: 'absolute', left: '-16px', top: '6px',
                width: '12px', height: '12px', borderRadius: '50%',
                backgroundColor: 'var(--surface)', border: '2px solid #15803D',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#15803D' }} />
              </div>
              <button type="button" onClick={() => hasNotes && setExpandedId(isExpanded ? null : log.id)} style={{
                display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: '100%',
                background: 'none', border: 'none', cursor: hasNotes ? 'pointer' : 'default',
                textAlign: 'left', padding: '2px 0'
              }}>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                  {formatDateTime(log.logged_at || log.created_date)}
                </span>
                <span style={{
                  display: 'inline-block', padding: '1px 8px', borderRadius: '6px',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
                  backgroundColor: badgeColor.bg, color: badgeColor.color
                }}>{TYPE_LABELS[log.contact_type] || log.contact_type}</span>
                <span style={{ fontSize: '0.8125rem' }}>{METHOD_EMOJIS[log.contact_method] || '💬'}</span>
                {hasNotes && !isExpanded && (
                  <span style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-400)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0
                  }}>{log.notes}</span>
                )}
              </button>
              {isExpanded && hasNotes && (
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-600)',
                  lineHeight: 1.5, margin: '4px 0 0', whiteSpace: 'pre-wrap',
                  padding: '8px 10px', backgroundColor: 'var(--slate-50)', borderRadius: '6px'
                }}>{log.notes}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}