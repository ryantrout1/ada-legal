import React, { useMemo } from 'react';

const CELLS = [
  { key: 'total',    label: 'QUEUE TOTAL',    bgActive: 'rgba(241,245,249,0.6)', color: 'var(--heading)' },
  { key: 'ready',    label: 'READY',           bgActive: 'rgba(220,252,231,0.5)', color: 'var(--suc-fg)' },
  { key: 'needs',    label: 'NEEDS INFO',      bgActive: 'rgba(254,243,199,0.5)', color: 'var(--wrn-fg)' },
  { key: 'high',     label: 'HIGH SEV',        bgActive: 'rgba(254,226,226,0.5)', color: 'var(--err-fg)' },
  { key: 'clusters', label: 'CLUSTERS',        bgActive: 'rgba(219,234,254,0.5)', color: '#1E3A8A' },
];

export default function CompactQCStatsBar({ cases, activeFilter, onFilterChange }) {
  const stats = useMemo(() => {
    const submitted = cases.filter(c => c.status === 'submitted');
    const total = submitted.length;
    const ready = submitted.filter(c => (c.ai_completeness_score ?? 0) >= 80).length;
    const needs = submitted.filter(c => (c.ai_completeness_score ?? 0) < 50).length;
    const high = submitted.filter(c => c.ai_severity === 'high').length;

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

  const counts = { total: stats.total, ready: stats.ready, needs: stats.needs, high: stats.high, clusters: stats.clusters };

  return (
    <div className="qc-stats-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      {/* Unified bar */}
      <div style={{
        display: 'flex', flex: '1 1 auto', minWidth: 0,
        border: '1px solid var(--card-border)', borderRadius: '8px', overflow: 'hidden',
        backgroundColor: 'var(--card-bg)',
      }}>
        {CELLS.map((cell, i) => {
          const count = counts[cell.key];
          const isActive = activeFilter === cell.key || (cell.key === 'total' && !activeFilter);
          const isZero = count === 0;
          return (
            <button
              key={cell.key}
              role="button"
              aria-label={
                cell.key === 'total'
                  ? `Show all ${count} cases in queue`
                  : `Filter to ${count} ${cell.label.toLowerCase()} cases`
              }
              aria-pressed={isActive}
              onClick={() => onFilterChange(cell.key === 'total' ? null : (activeFilter === cell.key ? null : cell.key))}
              className="qc-bar-cell"
              style={{
                flex: '1 1 0', display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '10px 6px', minHeight: '60px',
                border: 'none', cursor: 'pointer', position: 'relative',
                backgroundColor: isActive ? cell.bgActive : 'transparent',
                borderRight: i < CELLS.length - 1 ? '1px solid var(--card-border)' : 'none',
                transition: 'background-color 0.15s',
                borderBottom: isActive ? `2px solid ${cell.color}` : '2px solid transparent',
              }}
            >
              <span style={{
                fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.2,
                color: isZero ? 'var(--body-secondary)' : cell.color,
              }}>
                {count}
              </span>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1.3,
                color: isZero ? 'var(--body-secondary)' : 'var(--body-secondary)',
              }}>
                {cell.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick Insights — inline text */}
      <div className="qc-quick-insights" style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)',
        lineHeight: 1.4, whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        <span>{stats.newToday} new today</span>
        {stats.topCluster && (
          <>
            <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
            <span>Top cluster: {stats.topCluster.name} ({stats.topCluster.size})</span>
          </>
        )}
        <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
        <span>{stats.readyPct}% review-ready</span>
      </div>

      <style>{`
        .qc-bar-cell:focus-visible {
          outline: 3px solid #2563EB !important;
          outline-offset: -2px !important;
          z-index: 1;
        }
        .qc-bar-cell:hover {
          background-color: var(--page-bg-subtle) !important;
        }
        @media (max-width: 480px) {
          .qc-stats-row {
            flex-direction: column !important;
          }
          .qc-quick-insights {
            white-space: normal !important;
            font-size: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
}