import React from 'react';

export default function AuditSiteReport({ siteResults, runningSite, siteProgress, onRunSiteAudit, impactConfig }) {
  return (
    <>
      <button onClick={onRunSiteAudit} disabled={runningSite} style={{
        width: '100%', padding: '0.625rem', marginBottom: '1rem',
        backgroundColor: runningSite ? '#94A3B8' : '#7C3AED', color: 'white',
        border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.8125rem',
        cursor: runningSite ? 'default' : 'pointer'
      }}>
        {runningSite ? 'Running Full Site Audit…' : 'Run Full Site Audit'}
      </button>

      {runningSite && (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: '#475569' }}>
          <div className="a11y-spinner" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: '0.8125rem' }}>{siteProgress || 'Preparing…'}</p>
          <p style={{ fontSize: '0.6875rem', color: '#434E5E' }}>
            This may take 1–2 minutes. Each page is loaded and audited individually.
          </p>
        </div>
      )}

      {siteResults && !runningSite && (
        <>
          {/* Score */}
          <div style={{
            textAlign: 'center', padding: '1.25rem', marginBottom: '1rem',
            backgroundColor: siteResults.score >= 90 ? '#DCFCE7' : siteResults.score >= 70 ? '#FEF3C7' : '#FEE2E2',
            borderRadius: '8px'
          }}>
            <p style={{
              fontSize: '2.5rem', fontWeight: 700, margin: 0,
              fontFamily: 'Fraunces, serif',
              color: siteResults.score >= 90 ? '#15803D' : siteResults.score >= 70 ? '#92400E' : '#B91C1C'
            }}>
              {siteResults.score}%
            </p>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', margin: '0.25rem 0 0' }}>
              Estimated Accessibility Score
            </p>
            <p style={{ fontSize: '0.6875rem', color: '#434E5E', margin: '0.25rem 0 0' }}>
              {siteResults.totalViolations} violation{siteResults.totalViolations !== 1 ? 's' : ''} across {siteResults.pages.length} pages
            </p>
          </div>

          {/* Per-page breakdown */}
          <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.5rem' }}>
            By Page
          </h3>
          {siteResults.pages.map(p => {
            const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
            p.violations.forEach(v => { counts[v.impact] = (counts[v.impact] || 0) + 1; });
            return (
              <div key={p.page} style={{
                padding: '0.5rem 0.75rem', marginBottom: '0.375rem',
                backgroundColor: '#FAFAFA', borderRadius: '6px',
                border: p.violations.length > 0 ? '1px solid #E2E8F0' : '1px solid #DCFCE7'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#1E293B' }}>{p.page}</span>
                  {p.error ? (
                    <span style={{ fontSize: '0.6875rem', color: '#991B1B' }}>{p.error}</span>
                  ) : p.violations.length === 0 ? (
                    <span style={{ fontSize: '0.6875rem', color: '#16A34A', fontWeight: 600 }}>✓ Clean</span>
                  ) : (
                    <span style={{ fontSize: '0.6875rem', color: '#991B1B', fontWeight: 600 }}>
                      {p.violations.length} issue{p.violations.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {p.violations.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    {Object.entries(counts).filter(([, c]) => c > 0).map(([impact, count]) => (
                      <span key={impact} style={{
                        padding: '0.1rem 0.375rem', borderRadius: '3px',
                        fontSize: '0.5625rem', fontWeight: 700,
                        backgroundColor: impactConfig[impact]?.bg || '#eee',
                        color: impactConfig[impact]?.color || '#333'
                      }}>
                        {count} {impact}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Most common violations */}
          {siteResults.commonViolations.length > 0 && (
            <>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '1rem 0 0.5rem' }}>
                Most Common Issues
              </h3>
              {siteResults.commonViolations.slice(0, 8).map((v, i) => (
                <div key={v.id} style={{
                  padding: '0.5rem 0.75rem', marginBottom: '0.375rem',
                  backgroundColor: '#FAFAFA', borderRadius: '6px',
                  borderLeft: `3px solid ${impactConfig[v.impact]?.color || '#ccc'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8125rem', color: '#1E293B' }}>{v.help}</p>
                      <p style={{ margin: '0.125rem 0 0', fontSize: '0.6875rem', color: '#475569', fontFamily: 'monospace' }}>{v.id}</p>
                    </div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#475569', flexShrink: 0 }}>
                      {v.totalNodes} el{v.totalNodes !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.6875rem', color: '#434E5E' }}>
                    Pages: {v.pages.join(', ')}
                  </p>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </>
  );
}