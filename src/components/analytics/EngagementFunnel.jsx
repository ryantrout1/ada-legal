import React from 'react';

export default function EngagementFunnel({ cases, contactLogs }) {
  const submitted = cases.length;
  const approved = cases.filter(c =>
    ['available', 'expired', 'assigned', 'in_progress', 'closed'].includes(c.status)
  ).length;
  const viewed = cases.filter(c => (c.marketplace_views || 0) > 0).length;
  const assigned = cases.filter(c =>
    ['assigned', 'in_progress', 'closed'].includes(c.status)
  ).length;

  const caseIdsWithContact = new Set(contactLogs.map(l => l.case_id));
  const contacted = cases.filter(c => caseIdsWithContact.has(c.id)).length;
  const resolved = cases.filter(c => c.status === 'closed').length;

  const stages = [
    { label: 'Submitted', count: submitted },
    { label: 'Approved', count: approved },
    { label: 'Viewed', count: viewed },
    { label: 'Assigned', count: assigned },
    { label: 'Contacted', count: contacted },
    { label: 'Resolved', count: resolved }
  ];

  const maxCount = Math.max(submitted, 1);

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
      borderRadius: 'var(--radius-md)', padding: '12px'
    }}>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700,
        color: 'var(--slate-800)', marginBottom: '0.625rem', marginTop: 0
      }}>Case Engagement Funnel</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {stages.map((stage, i) => {
          const prev = i > 0 ? stages[i - 1].count : null;
          const convRate = prev && prev > 0 ? Math.round((stage.count / prev) * 100) : null;
          const barWidth = maxCount > 0 ? Math.max((stage.count / maxCount) * 100, 2) : 2;

          return (
            <div key={stage.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-600)',
                minWidth: '72px', textAlign: 'right', flexShrink: 0
              }}>{stage.label}</span>
              <div style={{ flex: 1, height: '16px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  height: '100%', width: `${barWidth}%`,
                  backgroundColor: '#C2410C',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '0.375rem'
                }}>
                  {barWidth > 12 && (
                    <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: 'white' }}>
                      {stage.count}
                    </span>
                  )}
                </div>
                {barWidth <= 12 && (
                  <span style={{
                    position: 'absolute', left: `${barWidth + 1}%`, top: '50%', transform: 'translateY(-50%)',
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--slate-700)'
                  }}>
                    {stage.count}
                  </span>
                )}
              </div>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', color: 'var(--slate-500)',
                minWidth: '70px', flexShrink: 0
              }}>
                {convRate !== null ? `${stage.count} of ${prev} — ${convRate}%` : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}