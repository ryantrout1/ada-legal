import React, { useState } from 'react';
import AuditViolationItem from './AuditViolationItem';
import AuditSiteReport from './AuditSiteReport';

const IMPACT_CONFIG = {
  critical: { color: '#991B1B', bg: '#FEE2E2', label: 'Critical' },
  serious:  { color: '#EA580C', bg: '#FFF7ED', label: 'Serious' },
  moderate: { color: '#D97706', bg: '#FEF3C7', label: 'Moderate' },
  minor:    { color: '#1E3A8A', bg: '#DBEAFE', label: 'Minor' }
};

function countByImpact(violations) {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  violations.forEach(v => { counts[v.impact] = (counts[v.impact] || 0) + 1; });
  return counts;
}

function generateExportText(results, siteResults) {
  let text = '=== ACCESSIBILITY AUDIT REPORT ===\n';
  text += `Generated: ${new Date().toLocaleString()}\n\n`;

  if (results) {
    text += `--- Current Page: ${results.page} ---\n`;
    text += `URL: ${results.url}\n`;
    const counts = countByImpact(results.violations);
    text += `Summary: ${counts.critical} critical, ${counts.serious} serious, ${counts.moderate} moderate, ${counts.minor} minor\n`;
    text += `Total violations: ${results.violations.length} | Passes: ${results.passes}\n\n`;

    results.violations.forEach((v, i) => {
      text += `[${(v.impact || '').toUpperCase()}] #${i + 1}: ${v.id}\n`;
      text += `  Description: ${v.description}\n`;
      text += `  Help: ${v.help}\n`;
      v.nodes.forEach((n, ni) => {
        text += `  Element ${ni + 1}: ${n.target.join(', ')}\n`;
        text += `    Fix: ${n.failureSummary || 'See axe-core docs'}\n`;
      });
      text += '\n';
    });
  }

  if (siteResults) {
    text += '\n=== FULL SITE AUDIT ===\n';
    text += `Score estimate: ${siteResults.score}%\n`;
    text += `Total violations across all pages: ${siteResults.totalViolations}\n\n`;

    siteResults.pages.forEach(p => {
      text += `--- ${p.page} ---\n`;
      if (p.error) { text += `  Error: ${p.error}\n`; return; }
      text += `  Violations: ${p.violations.length} | Passes: ${p.passes}\n`;
      p.violations.forEach(v => {
        text += `  [${(v.impact || '').toUpperCase()}] ${v.id}: ${v.help} (${v.nodes.length} elements)\n`;
      });
      text += '\n';
    });

    if (siteResults.commonViolations.length > 0) {
      text += '--- Most Common Violations ---\n';
      siteResults.commonViolations.slice(0, 10).forEach((v, i) => {
        text += `  ${i + 1}. ${v.id} — ${v.totalNodes} elements across ${v.pages.length} page(s): ${v.pages.join(', ')}\n`;
      });
    }
  }

  return text;
}

export default function AuditPanel({
  results, running, siteResults, runningSite, siteProgress,
  currentPageName, onClose, onRerun, onRunSiteAudit, onHighlight
}) {
  const [tab, setTab] = useState('page'); // 'page' | 'site'
  const [copied, setCopied] = useState(false);

  const counts = results ? countByImpact(results.violations) : null;

  const handleExport = () => {
    const text = generateExportText(results, siteResults);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div role="dialog" aria-label="Accessibility audit panel" aria-modal="false" style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: 'min(420px, 100vw)', zIndex: 10000,
      backgroundColor: '#FFFFFF', borderRight: '2px solid #E2E8F0',
      boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Manrope, sans-serif',
      animation: 'a11ySlideIn 0.2s ease-out'
    }}>
      <style>{`
        @keyframes a11ySlideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
       @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1rem', borderBottom: '1px solid #E2E8F0',
        backgroundColor: '#1E293B', color: 'white', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.125rem' }}>♿</span>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>A11y Audit</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleExport} style={{
            background: copied ? '#16A34A' : '#475569', color: 'white',
            border: 'none', borderRadius: '4px', padding: '0.25rem 0.625rem',
            fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
          }}>
            {copied ? '✓ Copied' : 'Export Report'}
          </button>
          <button onClick={onClose} style={{
            background: 'transparent', color: 'white', border: 'none',
            cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1, padding: '0.25rem'
          }}>✕</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', borderBottom: '2px solid #E2E8F0', flexShrink: 0
      }}>
        {['page', 'site'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '0.5rem', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.8125rem',
            backgroundColor: tab === t ? '#DBEAFE' : 'white',
            color: tab === t ? '#1E3A8A' : '#475569',
            borderBottom: tab === t ? '2px solid #1D4ED8' : '2px solid transparent'
          }}>
            {t === 'page' ? 'Current Page' : 'Full Site'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {tab === 'page' && (
          <>
            <div style={{ marginBottom: '0.75rem' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569' }}>Page</p>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#1E293B' }}>
                {results?.page || currentPageName || '—'}
              </p>
            </div>

            <button onClick={onRerun} disabled={running} style={{
              width: '100%', padding: '0.5rem', marginBottom: '1rem',
              backgroundColor: running ? '#94A3B8' : '#1E3A8A', color: 'white',
              border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.8125rem',
              cursor: running ? 'default' : 'pointer'
            }}>
              {running ? 'Running audit…' : 'Re-run Page Audit'}
            </button>

            {running && (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#475569' }}>
                <div className="a11y-spinner" style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ fontSize: '0.8125rem' }}>Analyzing page accessibility…</p>
              </div>
            )}

            {results && !running && (
              <>
                {/* Summary badges */}
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {Object.entries(IMPACT_CONFIG).map(([key, cfg]) => (
                    <span key={key} style={{
                      padding: '0.2rem 0.5rem', borderRadius: '9999px',
                      fontSize: '0.6875rem', fontWeight: 700,
                      backgroundColor: cfg.bg, color: cfg.color
                    }}>
                      {counts[key]} {cfg.label}
                    </span>
                  ))}
                </div>

                {results.violations.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '2rem 1rem',
                    backgroundColor: '#DCFCE7', borderRadius: '8px', marginTop: '0.5rem'
                  }}>
                    <span style={{ fontSize: '2rem' }}>🎉</span>
                    <p style={{ fontWeight: 700, color: '#15803D', margin: '0.5rem 0 0' }}>
                      No violations found!
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: '#16A34A', margin: '0.25rem 0 0' }}>
                      {results.passes} rules passed
                    </p>
                  </div>
                ) : (
                  <div>
                    {results.violations
                      .sort((a, b) => {
                        const order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
                        return (order[a.impact] ?? 4) - (order[b.impact] ?? 4);
                      })
                      .map((v, i) => (
                        <AuditViolationItem
                          key={v.id + i}
                          violation={v}
                          index={i}
                          config={IMPACT_CONFIG[v.impact]}
                          onHighlight={onHighlight}
                        />
                      ))
                    }
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === 'site' && (
          <AuditSiteReport
            siteResults={siteResults}
            runningSite={runningSite}
            siteProgress={siteProgress}
            onRunSiteAudit={onRunSiteAudit}
            impactConfig={IMPACT_CONFIG}
          />
        )}
      </div>
    </div>
  );
}