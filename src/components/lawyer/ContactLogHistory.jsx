import React from 'react';
import { Phone, Mail, Users, MoreHorizontal } from 'lucide-react';

const METHOD_ICONS = { phone: Phone, email: Mail, in_person: Users, other: MoreHorizontal };
const TYPE_LABELS = { initial_contact: 'Initial Contact', follow_up: 'Follow-Up', case_update: 'Case Update' };
const METHOD_LABELS = { phone: 'Phone', email: 'Email', in_person: 'In Person', other: 'Other' };

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

export default function ContactLogHistory({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
        color: 'var(--body)', fontStyle: 'italic', margin: 0
      }}>
        No contact logs yet.
      </p>
    );
  }

  const sorted = [...logs].sort((a, b) => new Date(b.logged_at || b.created_date) - new Date(a.logged_at || a.created_date));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
      {sorted.map(log => {
        const Icon = METHOD_ICONS[log.contact_method] || MoreHorizontal;
        return (
          <div key={log.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
            padding: '0.5rem 0.75rem', backgroundColor: 'var(--page-bg-subtle)',
            borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-lighter)'
          }}>
            <Icon size={16} style={{ color: 'var(--body-secondary)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700,
                  color: 'var(--body)'
                }}>{TYPE_LABELS[log.contact_type] || log.contact_type}</span>
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
                  color: 'var(--body)'
                }}>via {METHOD_LABELS[log.contact_method] || log.contact_method}</span>
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
                  color: 'var(--body)', marginLeft: 'auto'
                }}>{formatDate(log.logged_at || log.created_date)}</span>
              </div>
              {log.notes && (
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                  color: 'var(--body)', margin: '4px 0 0 0', lineHeight: 1.5
                }}>{log.notes}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}