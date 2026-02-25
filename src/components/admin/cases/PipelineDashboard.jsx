import React from 'react';
import { ChevronRight } from 'lucide-react';

const STAGES = [
  { key: 'submitted', label: 'Submitted', bg: 'var(--slate-100, #F1F5F9)', color: 'var(--slate-700, #475569)', borderColor: '#475569' },
  { key: 'under_review', label: 'In Review', bg: 'var(--info-100, #DBEAFE)', color: '#1D4ED8', borderColor: '#1D4ED8' },
  { key: 'available', label: 'Available', bg: 'var(--terra-100, #FEF1EC)', color: '#9A3412', borderColor: '#C2410C', subtitle: 'In marketplace' },
  { key: 'assigned', label: 'Assigned', bg: 'var(--warning-100, #FEF3C7)', color: '#92400E', borderColor: '#D97706' },
  { key: 'in_progress', label: 'In Progress', bg: 'var(--success-100, #DCFCE7)', color: '#15803D', borderColor: '#15803D' },
  { key: 'closed', label: 'Closed', bg: 'var(--slate-200, #E2E8F0)', color: 'var(--slate-500, #64748B)', borderColor: '#94A3B8' },
  { key: 'rejected', label: 'Rejected', bg: 'var(--error-100, #FEE2E2)', color: '#B91C1C', borderColor: '#DC2626' },
];

export default function PipelineDashboard({ cases, activeStatus, onStatusClick, needAttentionCount, avgAssignDays }) {
  const counts = {};
  STAGES.forEach(s => { counts[s.key] = 0; });
  cases.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });

  return (
    <div>
      {/* Pipeline cards */}
      <div className="pipeline-card-row" style={{ display: 'flex', alignItems: 'center', gap: '0', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory', paddingBottom: '4px' }}>
        {STAGES.map((stage, i) => {
          const active = activeStatus === stage.key;
          return (
            <React.Fragment key={stage.key}>
              {i > 0 && (
                <ChevronRight size={16} style={{ color: 'var(--slate-300)', flexShrink: 0 }} aria-hidden="true" />
              )}
              <button
                role="button"
                aria-label={`Filter to ${stage.label}: ${counts[stage.key]} cases`}
                aria-pressed={active}
                onClick={() => onStatusClick(stage.key)}
                className="pipeline-card"
                style={{
                  flex: '1 0 110px',
                  minHeight: '44px',
                  padding: '12px 14px',
                  backgroundColor: stage.bg,
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  scrollSnapAlign: 'start',
                  transition: 'box-shadow 0.15s, border-bottom 0.15s',
                  boxShadow: active ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                  borderBottom: active ? `3px solid ${stage.borderColor}` : '3px solid transparent',
                  position: 'relative',
                }}
              >
                <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700, color: stage.color, margin: 0, lineHeight: 1 }}>
                  {counts[stage.key]}
                </p>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 600, color: stage.color, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                  {stage.label}
                </p>
                {stage.subtitle && (
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.625rem', color: stage.color, margin: '1px 0 0', opacity: 0.7 }}>
                    {stage.subtitle}
                  </p>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Summary line */}
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)', margin: '10px 0 0', lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--slate-700)' }}>{cases.length}</strong> total cases
        {' · '}
        <strong style={{ color: needAttentionCount > 0 ? '#D97706' : 'var(--slate-700)' }}>{needAttentionCount}</strong> need attention
        {' · '}
        Avg time to assignment: <strong style={{ color: 'var(--slate-700)' }}>{avgAssignDays}</strong> days
      </p>

      <style>{`
        @media (max-width: 768px) {
          .pipeline-card-row {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 6px !important;
            overflow: visible !important;
          }
          .pipeline-card-row svg { display: none !important; }
          .pipeline-card { flex: unset !important; min-width: 0 !important; }
        }
      `}</style>
    </div>
  );
}