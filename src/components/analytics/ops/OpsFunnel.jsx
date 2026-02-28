import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function OpsFunnel({ cases, contactLogs }) {
  const { stages, bottleneckIdx } = useMemo(() => {
    const submitted = cases.length;
    const approved = cases.filter(c => ['available', 'expired', 'assigned', 'in_progress', 'closed'].includes(c.status)).length;
    const viewed = cases.filter(c => (c.marketplace_views || 0) > 0).length;
    const assignedCount = cases.filter(c => ['assigned', 'in_progress', 'closed'].includes(c.status)).length;
    const contactSet = new Set(contactLogs.map(l => l.case_id));
    const contacted = cases.filter(c => contactSet.has(c.id)).length;
    const resolved = cases.filter(c => c.status === 'closed').length;

    // Avg time between stages
    const approvedCases = cases.filter(c => c.submitted_at && c.approved_at);
    const avgSubToApprove = approvedCases.length > 0
      ? Math.round(approvedCases.reduce((s, c) => s + (new Date(c.approved_at) - new Date(c.submitted_at)) / 3600000, 0) / approvedCases.length)
      : null;

    const assignedCases = cases.filter(c => c.approved_at && c.assigned_at);
    const avgApproveToAssign = assignedCases.length > 0
      ? Math.round(assignedCases.reduce((s, c) => s + (new Date(c.assigned_at) - new Date(c.approved_at)) / 3600000, 0) / assignedCases.length)
      : null;

    const contactedCases = assignedCases.filter(c => {
      return contactLogs.some(l => l.case_id === c.id);
    });
    const avgAssignToContact = contactedCases.length > 0
      ? Math.round(contactedCases.reduce((s, c) => {
          const logs = contactLogs.filter(l => l.case_id === c.id);
          const earliest = Math.min(...logs.map(l => new Date(l.logged_at || l.created_date).getTime()));
          return s + (earliest - new Date(c.assigned_at).getTime()) / 3600000;
        }, 0) / contactedCases.length)
      : null;

    const stageList = [
      { label: 'Submitted', count: submitted, avgTime: null },
      { label: 'Approved', count: approved, avgTime: avgSubToApprove },
      { label: 'Viewed', count: viewed, avgTime: null },
      { label: 'Assigned', count: assignedCount, avgTime: avgApproveToAssign },
      { label: 'Contacted', count: contacted, avgTime: avgAssignToContact },
      { label: 'Resolved', count: resolved, avgTime: null },
    ];

    // Compute conversion rates and find bottleneck
    let worstIdx = -1;
    let worstRate = 101;
    stageList.forEach((stage, i) => {
      if (i > 0) {
        const prev = stageList[i - 1].count;
        stage.convRate = prev > 0 ? Math.round((stage.count / prev) * 100) : 0;
        if (prev > 0 && stage.convRate < worstRate) {
          worstRate = stage.convRate;
          worstIdx = i;
        }
      } else {
        stage.convRate = null;
      }
    });

    return { stages: stageList, bottleneckIdx: worstIdx };
  }, [cases, contactLogs]);

  const maxCount = Math.max(stages[0]?.count || 1, 1);

  function barColor(convRate) {
    if (convRate === null) return '#C2410C';
    if (convRate < 25) return '#DC2626';
    if (convRate < 50) return '#92400E';
    return '#15803D';
  }

  function formatTime(hrs) {
    if (hrs === null) return '';
    if (hrs < 1) return '<1h';
    if (hrs < 48) return `${hrs}h`;
    return `${Math.round(hrs / 24)}d`;
  }

  const bottleneck = bottleneckIdx > 0 ? stages[bottleneckIdx] : null;

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid var(--slate-200)', borderRadius: '10px', padding: '16px' }}>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 600, color: 'var(--slate-900)', margin: '0 0 12px' }}>
        Case Engagement Funnel
      </h2>

      {/* Accessible data table */}
      <div className="sr-only">
        <table>
          <caption>Engagement funnel data</caption>
          <thead><tr><th>Stage</th><th>Count</th><th>Conversion</th><th>Avg Time</th></tr></thead>
          <tbody>{stages.map(s => (
            <tr key={s.label}><td>{s.label}</td><td>{s.count}</td><td>{s.convRate !== null ? s.convRate + '%' : ''}</td><td>{formatTime(s.avgTime)}</td></tr>
          ))}</tbody>
        </table>
      </div>

      <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {stages.map((stage, i) => {
          const barWidth = Math.max((stage.count / maxCount) * 100, 3);
          const color = barColor(stage.convRate);
          const isBottleneck = i === bottleneckIdx;

          return (
            <div key={stage.label}>
              {/* Conversion arrow between stages */}
              {i > 0 && stage.convRate !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '90px', marginBottom: '2px' }}>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 600, color: color }}>
                    ↓ {stage.convRate}%
                  </span>
                  {stage.avgTime !== null && (
                    <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.625rem', color: 'var(--slate-500)' }}>
                      Avg {formatTime(stage.avgTime)}
                    </span>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-600)',
                  minWidth: '80px', textAlign: 'right', flexShrink: 0,
                  fontWeight: isBottleneck ? 700 : 400,
                }}>{stage.label}</span>
                <div style={{ flex: 1, height: '20px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    height: '100%', width: `${barWidth}%`, backgroundColor: color,
                    borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '6px',
                    transition: 'width 0.3s ease',
                  }}>
                    {barWidth > 15 && (
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: 'white' }}>
                        {stage.count}
                      </span>
                    )}
                  </div>
                  {barWidth <= 15 && (
                    <span style={{
                      position: 'absolute', left: `calc(${barWidth}% + 6px)`, top: '50%', transform: 'translateY(-50%)',
                      fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--slate-700)',
                    }}>
                      {stage.count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottleneck callout */}
      {bottleneck && bottleneck.convRate < 60 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px',
          padding: '10px 14px', backgroundColor: '#FEF3C7', borderRadius: '8px',
        }}>
          <AlertTriangle size={16} style={{ color: '#92400E', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#92400E' }}>
            <strong>Bottleneck:</strong> Only {bottleneck.convRate}% of {stages[bottleneckIdx - 1].label.toLowerCase()} cases reach {bottleneck.label.toLowerCase()} — may need attention
          </span>
        </div>
      )}
    </div>
  );
}