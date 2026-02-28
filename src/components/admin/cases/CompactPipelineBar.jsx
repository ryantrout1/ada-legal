import React, { useMemo } from 'react';

const STAGES = [
  { key: 'submitted',    label: 'Submitted' },
  { key: 'under_review', label: 'In Review' },
  { key: 'available',    label: 'Available' },
  { key: 'assigned',     label: 'Assigned' },
  { key: 'in_progress',  label: 'In Progress' },
  { key: 'closed',       label: 'Closed' },
  { key: 'rejected',     label: 'Rejected' },
];

const ACTIVE_KEYS = new Set(['submitted', 'under_review', 'available', 'assigned', 'in_progress']);

const CELL_BG = {
  submitted:    'rgba(251,146,60,0.08)',
  under_review: 'rgba(59,130,246,0.08)',
  available:    'rgba(194,65,12,0.08)',
  assigned:     'rgba(217,119,6,0.08)',
  in_progress:  'rgba(22,163,74,0.08)',
  closed:       'rgba(148,163,184,0.05)',
  rejected:     'rgba(220,38,38,0.05)',
};

const NUM_COLOR = {
  submitted:    '#9A3412',
  under_review: '#1D4ED8',
  available:    '#9A3412',
  assigned:     '#92400E',
  in_progress:  '#15803D',
  closed:       '#64748B',
  rejected:     '#DC2626',
};

const BOTTLENECK_BORDER_COLOR = {
  submitted:    '#FB923C',
  under_review: '#3B82F6',
  available:    '#EA580C',
  assigned:     '#D97706',
  in_progress:  '#16A34A',
};

export default function CompactPipelineBar({ cases, activeStatus, onStatusClick, secondaryStats }) {
  const counts = {};
  STAGES.forEach(s => { counts[s.key] = 0; });
  cases.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });

  const bottleneckKey = useMemo(() => {
    let maxKey = null, maxCount = 0;
    STAGES.forEach(s => {
      if (ACTIVE_KEYS.has(s.key) && counts[s.key] > maxCount) {
        maxCount = counts[s.key];
        maxKey = s.key;
      }
    });
    return maxCount > 0 ? maxKey : null;
  }, [cases]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
      {/* Pipeline Bar */}
      <div
        className="compact-pipeline-bar"
        style={{
          display: 'flex',
          flex: '1 1 auto',
          minWidth: 0,
          border: '1px solid var(--slate-200)',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: 'white',
        }}
      >
        {STAGES.map((stage, i) => {
          const count = counts[stage.key];
          const active = activeStatus === stage.key;
          const isBottleneck = stage.key === bottleneckKey && count > 0;
          const isEmpty = count === 0;

          return (
            <button
              key={stage.key}
              role="button"
              aria-label={`Filter to ${stage.label}: ${count} cases${isBottleneck ? ' (highest volume)' : ''}`}
              aria-pressed={active}
              onClick={() => onStatusClick(stage.key)}
              className="compact-pipeline-cell"
              style={{
                flex: '1 1 0',
                minWidth: 0,
                minHeight: '44px',
                padding: '6px 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: 'none',
                borderLeft: i > 0 ? '1px solid var(--slate-200)' : 'none',
                borderBottom: isBottleneck
                  ? `2px solid ${BOTTLENECK_BORDER_COLOR[stage.key] || '#EA580C'}`
                  : active
                    ? '2px solid var(--slate-700)'
                    : '2px solid transparent',
                backgroundColor: active ? 'var(--slate-50)' : (isEmpty ? 'white' : CELL_BG[stage.key]),
                transition: 'background-color 0.15s, border-bottom-color 0.15s',
                outline: 'none',
              }}
            >
              <span style={{
                fontFamily: 'Fraunces, serif',
                fontSize: '1.25rem',
                fontWeight: 700,
                lineHeight: 1,
                color: isEmpty ? 'var(--slate-500)' : NUM_COLOR[stage.key],
              }}>
                {count}
              </span>
              <span style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.625rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                marginTop: '1px',
                color: isEmpty ? 'var(--slate-500)' : 'var(--slate-500)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}>
                {stage.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Secondary Stats — inline text */}
      <div
        className="compact-secondary-stats"
        role="status"
        aria-label="Secondary statistics"
        style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.8rem',
          color: 'var(--slate-500)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        <span>⏱ {secondaryStats.pendingReview} pending</span>
        <span style={{ margin: '0 6px', color: 'var(--slate-400)' }}>·</span>
        <span>👤 {secondaryStats.activeLawyers} lawyer{secondaryStats.activeLawyers !== 1 ? 's' : ''}</span>
        <span style={{ margin: '0 6px', color: 'var(--slate-400)' }}>·</span>
        <span>📋 {secondaryStats.lawyerApps} app{secondaryStats.lawyerApps !== 1 ? 's' : ''}</span>
        <span style={{ margin: '0 6px', color: 'var(--slate-400)' }}>·</span>
        <span>✓ {secondaryStats.compliance} contact</span>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .compact-secondary-stats {
            white-space: normal !important;
            flex-basis: 100% !important;
            margin-top: -8px;
          }
          .compact-pipeline-cell span:first-child {
            font-size: 1rem !important;
          }
          .compact-pipeline-cell span:last-child {
            font-size: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}