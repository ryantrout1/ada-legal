import React, { useState } from 'react';
import { S, Dot, Tag, Panel, PanelHead, catName, fmtDate, getSeverity, getViews } from './IntelShared';

export default function IntelBusinesses({ data }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <Panel style={{ gridColumn: '1 / -1' }}>
      <PanelHead title="Business Accountability" right={`${data.bizzes.filter(b => b.cases.length > 1).length} repeat offenders · ${data.bizzes.length} total`} />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
          <thead>
            <tr>
              {['Business', 'City', 'Reports', 'Severity', 'Views', 'Attorney', ''].map(h => (
                <th key={h} style={{ textAlign: ['Reports', 'Views'].includes(h) ? 'center' : h === '' ? 'center' : 'left', padding: '5px 8px', fontSize: '0.58rem', fontWeight: 800, color: '#94A3B8', borderBottom: '2px solid #E8E8EC', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.bizzes.slice(0, 15).map(b => {
              const isOpen = expanded === b.name;
              const repeat = b.cases.length > 1;
              const worst = b.h > 0 ? 'high' : b.m > 0 ? 'medium' : 'low';
              return (
                <React.Fragment key={b.name}>
                  <tr onClick={() => setExpanded(isOpen ? null : b.name)} style={{ cursor: 'pointer', background: isOpen ? '#F8F8FA' : repeat ? '#FFFBF7' : 'transparent', borderBottom: '1px solid #F1F1F5', transition: 'background 0.1s' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600, color: 'var(--slate-900, #1A1A2E)' }}>
                      {b.name}
                      {repeat && <Tag bg="#FEE2E2" fg="#B91C1C"> ×{b.cases.length}</Tag>}
                    </td>
                    <td style={{ padding: '6px 8px', color: '#64748B' }}>{b.city}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}>{b.cases.length}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: S[worst].bg, color: S[worst].fg, textTransform: 'capitalize' }}>{worst}</span>
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', color: b.views > 0 ? 'var(--slate-900, #1A1A2E)' : '#DC2626', fontWeight: b.views ? '600' : '400' }}>{b.views}</td>
                    <td style={{ padding: '6px 8px' }}>{b.atty ? <Dot color="#22C55E" size={8} /> : <Dot color="#EF4444" size={8} />}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', color: '#CBD5E1', fontSize: '0.65rem' }}>{isOpen ? '▴' : '▾'}</td>
                  </tr>
                  {isOpen && (
                    <>
                      <tr style={{ background: '#F8F8FA' }}>
                        <td colSpan={7} style={{ padding: '8px 8px 4px 24px' }}>
                          <div style={{ display: 'flex', gap: 12, fontSize: '0.65rem', color: '#64748B', marginBottom: 4 }}>
                            <span>Severity: <strong style={{ color: S.high.fg }}>{b.h} high</strong> · <strong style={{ color: S.medium.fg }}>{b.m} med</strong> · <strong style={{ color: S.low.fg }}>{b.l} low</strong></span>
                            <span>Total views: <strong>{b.views}</strong></span>
                          </div>
                        </td>
                      </tr>
                      {b.cases.map(c => (
                        <tr key={c.id} style={{ background: '#F8F8FA', fontSize: '0.65rem' }}>
                          <td style={{ padding: '3px 8px 3px 24px', color: '#94A3B8' }}>{fmtDate(c.submitted_at || c.created_date)}</td>
                          <td style={{ padding: '3px 8px', color: '#64748B', textTransform: 'capitalize' }}>{catName(c.ai_category || c.violation_subtype || c.violation_type)}</td>
                          <td />
                          <td style={{ padding: '3px 8px' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '0 4px', borderRadius: 99, background: S[getSeverity(c)].bg, color: S[getSeverity(c)].fg, textTransform: 'capitalize' }}>{getSeverity(c)[0]}</span>
                          </td>
                          <td style={{ padding: '3px 8px', textAlign: 'center', color: getViews(c) ? '#64748B' : '#DC2626' }}>{getViews(c)}</td>
                          <td colSpan={2} style={{ padding: '3px 8px', color: '#94A3B8', fontStyle: 'italic', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.ai_summary || c.narrative || '—'}</td>
                        </tr>
                      ))}
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
