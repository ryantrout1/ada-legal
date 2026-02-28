import React from 'react';

export default function ReporterFunnel({ events }) {
  const started = events.filter(e => e.event_name === 'report_started').length;
  const completed = events.filter(e => e.event_name === 'report_completed').length;
  const connected = events.filter(e => e.event_name === 'attorney_connect_clicked').length;

  const steps = [
    { label: 'Reports Started', count: started, color: '#C2410C' },
    { label: 'Reports Completed', count: completed, color: '#92400E' },
    { label: 'Attorney Clicked', count: connected, color: '#15803D' },
  ];

  const maxCount = Math.max(started, 1);

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid var(--slate-200)', borderRadius: '12px', padding: '20px' }}>
      <h4 style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 600, color: 'var(--slate-900)', margin: '0 0 16px' }}>
        Reporter Funnel
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {steps.map((step, i) => {
          const widthPct = Math.max((step.count / maxCount) * 100, 8);
          const prevCount = i > 0 ? steps[i - 1].count : null;
          const convRate = prevCount && prevCount > 0 ? Math.round((step.count / prevCount) * 100) : null;
          return (
            <div key={step.label}>
              {convRate !== null && (
                <div style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
                  color: 'var(--slate-500)', textAlign: 'center', marginBottom: '2px'
                }}>
                  ↓ {convRate}% conversion
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: `${widthPct}%`, minWidth: '60px',
                  backgroundColor: step.color, borderRadius: '6px',
                  padding: '10px 14px', transition: 'width 0.4s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '1.125rem',
                    fontWeight: 800, color: 'white'
                  }}>
                    {step.count}
                  </span>
                </div>
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                  fontWeight: 600, color: 'var(--slate-700)', whiteSpace: 'nowrap'
                }}>
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}