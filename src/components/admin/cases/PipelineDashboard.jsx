import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';

const RESOLVED_KEYS = new Set(['closed', 'rejected']);
const ACTIVE_KEYS = new Set(['submitted', 'under_review', 'available', 'assigned', 'in_progress']);

const STAGES = [
  { key: 'submitted',    label: 'Submitted',    subtitle: null },
  { key: 'under_review', label: 'In Review',    subtitle: null },
  { key: 'available',    label: 'Available',    subtitle: null },
  { key: 'assigned',     label: 'Assigned',     subtitle: null },
  { key: 'in_progress',  label: 'In Progress',  subtitle: null },
  { key: 'closed',       label: 'Closed',       subtitle: null },
  { key: 'rejected',     label: 'Rejected',     subtitle: null },
];

/* Active-stage base colors (used when count > 0) */
const ACTIVE_COLORS = {
  submitted:    { bg: '#FFF7ED', numColor: '#9A3412', labelColor: '#9A3412', border: '2px solid #FB923C' },
  under_review: { bg: '#DBEAFE', numColor: '#1D4ED8', labelColor: '#1D4ED8', border: 'none' },
  available:    { bg: '#FEF1EC', numColor: '#9A3412', labelColor: '#9A3412', border: 'none' },
  assigned:     { bg: '#FEF3C7', numColor: '#92400E', labelColor: '#92400E', border: 'none' },
  in_progress:  { bg: '#DCFCE7', numColor: '#15803D', labelColor: '#15803D', border: 'none' },
};

/* Resolved-stage colors (muted regardless of count) */
const RESOLVED_COLORS = {
  closed:   { bg: '#F1F5F9', numColor: '#5E6B7C', labelColor: '#586577' },
  rejected: { bg: '#F1F5F9', numColor: '#DC2626', labelColor: '#DC2626' },
};

/* Zero-case styling — nearly invisible */
const ZERO_STYLE = { bg: '#FAFAF9', numColor: '#CBD5E1', labelColor: '#5E6B7C', border: 'none' };

function getCardStyle(key, count) {
  if (count === 0) return ZERO_STYLE;
  if (RESOLVED_KEYS.has(key)) return { ...RESOLVED_COLORS[key], border: 'none' };
  return ACTIVE_COLORS[key] || ZERO_STYLE;
}

export default function PipelineDashboard({ cases, activeStatus, onStatusClick, needAttentionCount, avgAssignDays }) {
  const counts = {};
  STAGES.forEach(s => { counts[s.key] = 0; });
  cases.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });

  /* Bottleneck = highest count among ACTIVE stages only */
  const bottleneckKey = useMemo(() => {
    let maxKey = null;
    let maxCount = 0;
    STAGES.forEach(s => {
      if (ACTIVE_KEYS.has(s.key) && counts[s.key] > maxCount) {
        maxCount = counts[s.key];
        maxKey = s.key;
      }
    });
    return maxCount > 0 ? maxKey : null;
  }, [cases]);

  const bottleneckIdx = STAGES.findIndex(s => s.key === bottleneckKey);

  return (
    <div>
      <div className="pipeline-card-row" style={{ display: 'flex', alignItems: 'center', gap: '0', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory', paddingBottom: '4px' }}>
        {STAGES.map((stage, i) => {
          const count = counts[stage.key];
          const active = activeStatus === stage.key;
          const isBottleneck = stage.key === bottleneckKey && count > 0;
          const cs = getCardStyle(stage.key, count);
          const arrowHighlighted = i > 0 && (i - 1) === bottleneckIdx && counts[bottleneckKey] > 0;

          return (
            <React.Fragment key={stage.key}>
              {i > 0 && (
                <ArrowRight
                  size={16}
                  className="pipeline-arrow"
                  style={{
                    color: arrowHighlighted ? '#F97316' : '#CBD5E1',
                    flexShrink: 0,
                    margin: '0 2px',
                    transition: 'color 0.3s',
                  }}
                  aria-hidden="true"
                />
              )}
              <button
                aria-label={`Filter to ${stage.label}: ${count} cases${isBottleneck ? ' (highest volume)' : ''}`}
                aria-pressed={active}
                onClick={() => onStatusClick(stage.key)}
                className={`pipeline-card${isBottleneck ? ' pipeline-bottleneck' : ''}`}
                style={{
                  flex: '1 0 110px',
                  minHeight: '44px',
                  padding: '12px 14px',
                  backgroundColor: cs.bg,
                  border: cs.border || 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  scrollSnapAlign: 'start',
                  transition: 'box-shadow 0.15s, border-bottom-color 0.15s',
                  boxShadow: active ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                  borderBottom: isBottleneck
                    ? '3px solid #F97316'
                    : active
                      ? '3px solid var(--slate-700)'
                      : '3px solid transparent',
                  position: 'relative',
                }}
              >
                <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700, color: cs.numColor, margin: 0, lineHeight: 1 }}>
                  {count}
                </p>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 600, color: cs.labelColor, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                  {stage.label}
                </p>
                {stage.subtitle && count > 0 && (
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.625rem', color: cs.labelColor, margin: '1px 0 0', opacity: 0.7 }}>
                    {stage.subtitle}
                  </p>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)', margin: '10px 0 0', lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--slate-700)' }}>{cases.length}</strong> total cases
        {' · '}
        <strong style={{ color: needAttentionCount > 0 ? '#D97706' : 'var(--slate-700)' }}>{needAttentionCount}</strong> need attention
      </p>

      <style>{`
        @keyframes bottleneckPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.25); }
          50% { box-shadow: 0 0 0 4px rgba(249,115,22,0.12); }
        }
        .pipeline-bottleneck {
          animation: bottleneckPulse 2.5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .pipeline-bottleneck { animation: none !important; }
        }
        @media (max-width: 768px) {
          .pipeline-card-row {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 6px !important;
            overflow: visible !important;
          }
          .pipeline-card-row .pipeline-arrow { display: none !important; }
          .pipeline-card { flex: unset !important; min-width: 0 !important; }
        }
      `}</style>
    </div>
  );
}