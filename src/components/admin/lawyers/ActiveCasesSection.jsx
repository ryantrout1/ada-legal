import React from 'react';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import LawyerBadge from './LawyerBadge';

const violationColors = {
  physical_space: { bg: '#FEF1EC', text: '#9A3412' },
  digital_website: { bg: '#EFF6FF', text: '#1D4ED8' }
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ActiveCasesSection({ lawyer, cases, contactLogs }) {
  const active = cases.filter(c =>
    c.assigned_lawyer_id === lawyer.id && (c.status === 'assigned' || c.status === 'in_progress')
  );

  return (
    <div>
      <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 0.75rem 0' }}>
        Active Cases ({active.length})
      </h3>
      {active.length === 0 ? (
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-500)', margin: 0 }}>No active cases.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {active.map(c => {
            const hasContact = contactLogs.some(l => l.case_id === c.id);
            const hoursSinceAssign = c.assigned_at ? Math.round((Date.now() - new Date(c.assigned_at).getTime()) / (1000 * 60 * 60)) : 0;
            const overdue = !hasContact && hoursSinceAssign > 24;
            const remaining = !hasContact && hoursSinceAssign <= 24 ? 24 - hoursSinceAssign : 0;
            const daysSince = c.assigned_at ? Math.round((Date.now() - new Date(c.assigned_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;

            const vColor = violationColors[c.violation_type] || { bg: '#F1F5F9', text: '#475569' };

            return (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
                padding: '0.625rem 0.875rem',
                backgroundColor: 'white', border: '1px solid var(--slate-200)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-800)' }}>
                    {c.business_name}
                  </span>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)', marginLeft: '0.5rem' }}>
                    {[c.city, c.state].filter(Boolean).join(', ')}
                  </span>
                </div>
                <span style={{
                  display: 'inline-block', padding: '0.15rem 0.5rem',
                  fontSize: '0.6875rem', fontWeight: 700, borderRadius: '9999px',
                  backgroundColor: vColor.bg, color: vColor.text
                }}>
                  {c.violation_type === 'physical_space' ? 'Physical' : 'Digital'}
                </span>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                  Assigned {formatDate(c.assigned_at)} ({daysSince}d ago)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                  {hasContact ? (
                    <>
                      <CheckCircle size={14} style={{ color: '#15803D' }} />
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#15803D' }}>Contacted</span>
                    </>
                  ) : overdue ? (
                    <>
                      <AlertTriangle size={14} style={{ color: '#B91C1C' }} />
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#B91C1C' }}>
                        No Contact — {hoursSinceAssign - 24}h overdue
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock size={14} style={{ color: '#D97706' }} />
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#D97706' }}>
                        {remaining}h remaining
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}