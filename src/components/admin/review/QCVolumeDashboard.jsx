import React, { useMemo } from 'react';

const CARDS = [
  { key: 'total',   label: 'Queue Total',         bg: 'var(--slate-100)',   color: 'var(--slate-900)' },
  { key: 'ready',   label: 'Ready for Review',     bg: 'var(--success-100)', color: '#15803D' },
  { key: 'needs',   label: 'Needs More Info',       bg: 'var(--warning-100)', color: '#B45309' },
  { key: 'high',    label: 'High Severity',         bg: 'var(--error-100)',   color: '#B91C1C' },
  { key: 'clusters', label: 'Clusters (2+ reports)', bg: 'var(--info-100)',   color: '#1D4ED8' },
];

export default function QCVolumeDashboard({ cases, activeFilter, onFilterChange }) {
  const stats = useMemo(() => {
    const submitted = cases.filter(c => c.status === 'submitted');
    const total = submitted.length;
    const ready = submitted.filter(c => (c.ai_completeness_score ?? 0) >= 80).length;
    const needs = submitted.filter(c => (c.ai_completeness_score ?? 0) < 50).length;
    const high = submitted.filter(c => c.ai_severity === 'high').length;

    // Distinct clusters with size >= 2
    const clusterIds = new Set();
    submitted.forEach(c => {
      if (c.ai_duplicate_cluster_id && (c.ai_duplicate_cluster_size ?? 0) >= 2) {
        clusterIds.add(c.ai_duplicate_cluster_id);
      }
    });
    const clusters = clusterIds.size;

    // Quick insights
    const today = new Date().toISOString().split('T')[0];
    const newToday = submitted.filter(c => {
      const d = c.submitted_at || c.created_date;
      return d && String(d).startsWith(today);
    }).length;

    // Top cluster
    const clusterMap = {};
    submitted.forEach(c => {
      if (c.ai_duplicate_cluster_id && (c.ai_duplicate_cluster_size ?? 0) >= 2) {
        if (!clusterMap[c.ai_duplicate_cluster_id]) {
          clusterMap[c.ai_duplicate_cluster_id] = { name: c.business_name, size: c.ai_duplicate_cluster_size ?? 0 };
        }
        if ((c.ai_duplicate_cluster_size ?? 0) > clusterMap[c.ai_duplicate_cluster_id].size) {
          clusterMap[c.ai_duplicate_cluster_id] = { name: c.business_name, size: c.ai_duplicate_cluster_size ?? 0 };
        }
      }
    });
    let topCluster = null;
    Object.values(clusterMap).forEach(v => {
      if (!topCluster || v.size > topCluster.size) topCluster = v;
    });

    const readyPct = total > 0 ? Math.round((ready / total) * 100) : 0;

    return { total, ready, needs, high, clusters, newToday, topCluster, readyPct };
  }, [cases]);

  const counts = {
    total: stats.total,
    ready: stats.ready,
    needs: stats.needs,
    high: stats.high,
    clusters: stats.clusters,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Stat cards row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '12px',
      }}>
        {CARDS.map(card => {
          const isActive = activeFilter === card.key;
          return (
            <button
              key={card.key}
              role="button"
              aria-label={
                card.key === 'total'
                  ? `Show all ${counts[card.key]} cases in queue`
                  : `Filter to ${counts[card.key]} ${card.label.toLowerCase()} cases`
              }
              onClick={() => onFilterChange(card.key === 'total' ? null : (isActive ? null : card.key))}
              style={{
                background: card.bg,
                border: 'none',
                borderRadius: '12px',
                padding: '16px 12px',
                minHeight: '44px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                borderBottom: isActive ? `3px solid ${card.color}` : '3px solid transparent',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                outline: 'none',
              }}
              onFocus={(e) => {}}
              className="qc-stat-card"
            >
              <span style={{
                fontFamily: 'Fraunces, serif',
                fontSize: '2rem',
                fontWeight: 700,
                lineHeight: 1.1,
                color: card.color,
              }}>
                {counts[card.key]}
              </span>
              <span style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: 'var(--slate-500)',
                textAlign: 'center',
                lineHeight: 1.3,
              }}>
                {card.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Clear filter link */}
      {activeFilter && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => onFilterChange(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.8125rem',
              color: 'var(--terra-600)',
              textDecoration: 'underline',
              padding: '4px 8px',
            }}
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Quick Insights bar */}
      <div style={{
        fontFamily: 'Manrope, sans-serif',
        fontSize: '0.875rem',
        color: 'var(--slate-600)',
        lineHeight: 1.5,
        padding: '0 4px',
      }}>
        <span>{stats.newToday} new report{stats.newToday !== 1 ? 's' : ''} today</span>
        <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
        {stats.topCluster ? (
          <>
            <span>Top cluster: {stats.topCluster.name} ({stats.topCluster.size} reports)</span>
            <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
          </>
        ) : null}
        <span>{stats.readyPct}% of queue is review-ready</span>
      </div>

      {/* Responsive + focus styles */}
      <style>{`
        .qc-stat-card:focus-visible {
          outline: 3px solid #1D4ED8 !important;
          outline-offset: 2px !important;
        }
        @media (max-width: 768px) {
          .qc-stat-card {
            padding: 12px 8px !important;
          }
        }
        @media (max-width: 600px) {
          div:has(> .qc-stat-card) {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}