import React, { useState, useMemo } from 'react';
import { S, Dot, Tag, Bar, Panel, PanelHead, SevBadge, catName, fmtDate, isDigital, getSeverity, getCategory, getDate, getViews } from './IntelShared';

export default function IntelCaseDetail({ data }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [sort, setSort] = useState({ col: 'date', dir: 'desc' });
  const [collapsedStates, setCollapsedStates] = useState({});
  const [expandedCase, setExpandedCase] = useState(null);

  const uniqueStates = useMemo(() => [...new Set(data.list.map(c => (c.state || '').trim().toUpperCase()))].filter(Boolean).sort(), [data.list]);

  const cases = useMemo(() => {
    let list = [...data.list];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => (c.business_name || '').toLowerCase().includes(q) || (c.city || '').toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      list = statusFilter === 'zero_views'
        ? list.filter(c => c.status === 'available' && !getViews(c))
        : list.filter(c => c.status === statusFilter);
    }
    if (stateFilter !== 'all') list = list.filter(c => (c.state || '').trim().toUpperCase() === stateFilter);

    // Sort
    list.sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      if (sort.col === 'date') return dir * getDate(a).localeCompare(getDate(b));
      if (sort.col === 'biz') return dir * (a.business_name || '').localeCompare(b.business_name || '');
      if (sort.col === 'sev') { const o = { high: 0, medium: 1, low: 2 }; return dir * ((o[getSeverity(a)] || 2) - (o[getSeverity(b)] || 2)); }
      if (sort.col === 'views') return dir * (getViews(a) - getViews(b));
      if (sort.col === 'status') return dir * (a.status || '').localeCompare(b.status || '');
      return 0;
    });
    return list;
  }, [data.list, search, statusFilter, stateFilter, sort]);

  // Group by state
  const stateGroups = useMemo(() => {
    const groups = {};
    cases.forEach(c => {
      const st = (c.state || '').trim().toUpperCase() || '??';
      if (!groups[st]) groups[st] = { st, cases: [], h: 0, m: 0, l: 0, zv: 0 };
      groups[st].cases.push(c);
      groups[st][getSeverity(c)[0]]++;
      if (!getViews(c) && c.status === 'available') groups[st].zv++;
    });
    return Object.values(groups).sort((a, b) => b.cases.length - a.cases.length);
  }, [cases]);

  const now = Date.now();
  const needsAttn = (c) => c.status === 'available' && !getViews(c) && getSeverity(c) === 'high' && (now - new Date(getDate(c)).getTime()) > 48 * 3600000;

  const toggleSort = (col) => setSort(s => s.col === col ? { col, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { col, dir: 'desc' });
  const sortIcon = (col) => sort.col === col ? (sort.dir === 'desc' ? ' ↓' : ' ↑') : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Filters */}
      <Panel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text" placeholder="Search business or city…" value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: '1 1 180px', minWidth: 140, padding: '6px 10px', fontSize: '0.72rem', fontFamily: 'Manrope, sans-serif', border: '1px solid #E2E8F0', borderRadius: 6, outline: 'none', minHeight: 32 }}
          />
          <div style={{ display: 'flex', gap: 3 }}>
            {[['all', 'All'], ['available', 'Available'], ['assigned', 'Assigned'], ['pending_review', 'Pending'], ['zero_views', 'Zero Views']].map(([v, l]) => (
              <button key={v} onClick={() => setStatusFilter(v)} style={{
                padding: '4px 10px', fontSize: '0.6rem', fontWeight: statusFilter === v ? 700 : 500,
                background: statusFilter === v ? '#C2410C' : '#FFF', color: statusFilter === v ? '#FFF' : '#64748B',
                border: '1px solid ' + (statusFilter === v ? '#C2410C' : '#E2E8F0'), borderRadius: 5, cursor: 'pointer', minHeight: 28,
              }}>{l}{v === 'zero_views' ? ` (${data.zeroView})` : ''}</button>
            ))}
          </div>
          <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} aria-label="Filter by state"
            style={{ padding: '6px 10px', fontSize: '0.7rem', fontFamily: 'Manrope, sans-serif', border: '1px solid #E2E8F0', borderRadius: 6, minHeight: 32, cursor: 'pointer' }}>
            <option value="all">All States</option>
            {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ fontSize: '0.65rem', color: '#94A3B8', marginLeft: 'auto' }}>{cases.length} of {data.list.length} cases</span>
        </div>
      </Panel>

      {/* Grouped tables */}
      {stateGroups.map(g => {
        const isCollapsed = collapsedStates[g.st];
        return (
          <Panel key={g.st} style={{ padding: 0, overflow: 'hidden' }}>
            <button onClick={() => setCollapsedStates(s => ({ ...s, [g.st]: !s[g.st] }))} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
              border: 'none', background: '#F8F8FA', cursor: 'pointer', textAlign: 'left', borderBottom: isCollapsed ? 'none' : '1px solid #E8E8EC',
            }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: '0.9rem', color: 'var(--slate-900, #1A1A2E)' }}>{g.st}</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--slate-900, #1A1A2E)' }}>{g.cases.length} {g.cases.length === 1 ? 'case' : 'cases'}</span>
              <div style={{ display: 'flex', gap: 6, fontSize: '0.6rem', color: '#64748B' }}>
                {g.h > 0 && <span style={{ color: S.high.fg }}>{g.h} high</span>}
                {g.m > 0 && <span style={{ color: S.medium.fg }}>{g.m} med</span>}
                {g.l > 0 && <span style={{ color: S.low.fg }}>{g.l} low</span>}
              </div>
              {g.zv > 0 && <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: '#FEF3C7', color: '#92400E' }}>{g.zv} unseen</span>}
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#CBD5E1' }}>{isCollapsed ? '▾' : '▴'}</span>
            </button>

            {!isCollapsed && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                  <thead>
                    <tr>
                      {[
                        { key: 'date', label: 'Date', align: 'left' },
                        { key: 'biz', label: 'Business', align: 'left' },
                        { key: 'city', label: 'City', align: 'left' },
                        { key: 'cat', label: 'Category', align: 'left' },
                        { key: 'sev', label: 'Severity', align: 'center' },
                        { key: 'status', label: 'Status', align: 'left' },
                        { key: 'views', label: 'Views', align: 'center' },
                        { key: 'flag', label: '', align: 'center' },
                      ].map(h => (
                        <th key={h.key}
                          onClick={() => h.key !== 'cat' && h.key !== 'flag' && toggleSort(h.key)}
                          style={{
                            textAlign: h.align, padding: '4px 8px', fontSize: '0.55rem', fontWeight: 800, color: '#94A3B8',
                            borderBottom: '1px solid #E8E8EC', textTransform: 'uppercase', letterSpacing: '0.06em',
                            cursor: h.key !== 'cat' && h.key !== 'flag' ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap',
                          }}
                        >{h.label}{sortIcon(h.key)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {g.cases.map(c => {
                      const attn = needsAttn(c);
                      const isExp = expandedCase === c.id;
                      const ageMs = now - new Date(getDate(c)).getTime();
                      const ageDays = Math.floor(ageMs / 86400000);
                      const ageLabel = ageDays === 0 ? 'Today' : ageDays === 1 ? 'Yesterday' : `${ageDays} days ago`;
                      const sameBiz = data.list.filter(x => x.business_name === c.business_name && x.id !== c.id);
                      const sameCity = data.list.filter(x => x.city === c.city && x.id !== c.id);
                      const cityData = data.cities.find(x => x.name === (c.city || '').trim());
                      const stateData = data.states.find(x => x.st === (c.state || '').trim().toUpperCase());
                      const sev = getSeverity(c);
                      const views = getViews(c);
                      const cat = getCategory(c);

                      return (
                        <React.Fragment key={c.id}>
                          <tr onClick={() => setExpandedCase(isExp ? null : c.id)} style={{
                            borderBottom: isExp ? 'none' : '1px solid #F8F8FA', cursor: 'pointer',
                            background: isExp ? '#F8F8FA' : attn ? '#FEF2F2' : views === 0 && c.status === 'available' ? '#FFFBF7' : 'transparent',
                            transition: 'background 0.1s',
                          }}>
                            <td style={{ padding: '5px 8px', color: '#94A3B8', whiteSpace: 'nowrap' }}>{fmtDate(getDate(c))}</td>
                            <td style={{ padding: '5px 8px', fontWeight: 600, color: 'var(--slate-900, #1A1A2E)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.business_name || 'Unknown'}</td>
                            <td style={{ padding: '5px 8px', color: '#64748B' }}>{c.city}</td>
                            <td style={{ padding: '5px 8px', color: '#64748B', textTransform: 'capitalize' }}>{catName(cat)}{isDigital(cat) && <Tag bg="#DBEAFE" fg="#1E40AF"> DIG</Tag>}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center' }}><SevBadge severity={sev} /></td>
                            <td style={{ padding: '5px 8px' }}>
                              <Dot color={c.status === 'assigned' || c.status === 'in_progress' ? '#22C55E' : c.status === 'pending_review' ? '#F59E0B' : '#94A3B8'} size={6} />
                              <span style={{ marginLeft: 4, color: '#64748B', textTransform: 'capitalize' }}>{(c.status || '').replace(/_/g, ' ')}</span>
                            </td>
                            <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 600, color: views ? 'var(--slate-900, #1A1A2E)' : '#DC2626' }}>{views}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                              {attn ? <span title="High severity, zero views, stale" style={{ fontSize: '0.65rem' }}>⚠️</span>
                                : <span style={{ fontSize: '0.65rem', color: '#CBD5E1' }}>{isExp ? '▴' : '▾'}</span>}
                            </td>
                          </tr>

                          {isExp && (
                            <tr><td colSpan={8} style={{ padding: 0, background: '#F8F8FA', borderBottom: '2px solid #E2E8F0' }}>
                              <div style={{ padding: '12px 16px 14px', display: 'flex', gap: 16 }}>
                                {/* Left: case info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ marginBottom: 10 }}>
                                    <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>What was reported</div>
                                    {c.ai_summary || c.narrative ? (
                                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-900, #1A1A2E)', lineHeight: 1.5, fontStyle: 'italic' }}>"{c.ai_summary || c.narrative}"</div>
                                    ) : (
                                      <div style={{ fontSize: '0.72rem', color: '#CBD5E1', fontStyle: 'italic' }}>No narrative provided</div>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.68rem', color: '#64748B', marginBottom: 8 }}>
                                    <div><span style={{ fontWeight: 700, color: 'var(--slate-900, #1A1A2E)' }}>{ageLabel}</span> <span style={{ color: '#94A3B8' }}>({fmtDate(getDate(c))})</span></div>
                                    {c.status === 'available' && ageDays > 2 && (
                                      <div style={{ color: ageDays > 7 ? '#DC2626' : ageDays > 3 ? '#92400E' : '#64748B', fontWeight: 600 }}>
                                        Sitting for {ageDays} days{ageDays > 7 ? ' — needs action' : ''}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                                    {views === 0 ? (
                                      <span style={{ color: '#DC2626', fontWeight: 600 }}>No attorneys have viewed this case</span>
                                    ) : (
                                      <span><strong style={{ color: 'var(--slate-900, #1A1A2E)' }}>{views}</strong> attorney view{views > 1 ? 's' : ''}{c.status === 'available' ? ' — viewed but not yet claimed' : ''}</span>
                                    )}
                                  </div>
                                </div>
                                {/* Right: context cards */}
                                <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  <div style={{ padding: '8px 10px', borderRadius: 6, background: '#FFF', border: '1px solid #E8E8EC' }}>
                                    <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>This business</div>
                                    {sameBiz.length > 0 ? (
                                      <div style={{ fontSize: '0.68rem' }}>
                                        <span style={{ fontWeight: 700, color: '#B91C1C' }}>{sameBiz.length} other report{sameBiz.length > 1 ? 's' : ''}</span>
                                        <div style={{ fontSize: '0.6rem', color: '#64748B', marginTop: 2 }}>
                                          {sameBiz.map(x => catName(getCategory(x))).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                                        </div>
                                      </div>
                                    ) : (
                                      <div style={{ fontSize: '0.68rem', color: '#15803D' }}>First report for this business</div>
                                    )}
                                  </div>
                                  <div style={{ padding: '8px 10px', borderRadius: 6, background: '#FFF', border: '1px solid #E8E8EC' }}>
                                    <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{c.city}, {(c.state || '').toUpperCase()}</div>
                                    <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                                      <strong style={{ color: 'var(--slate-900, #1A1A2E)' }}>{sameCity.length + 1}</strong> total reports in this city
                                    </div>
                                    <div style={{ fontSize: '0.65rem', marginTop: 3 }}>
                                      {cityData?.atty ? <span style={{ color: '#15803D', fontWeight: 600 }}>Attorney active in this city</span>
                                        : <span style={{ color: '#DC2626', fontWeight: 600 }}>No attorney coverage</span>}
                                    </div>
                                  </div>
                                  {stateData && (
                                    <div style={{ padding: '8px 10px', borderRadius: 6, background: '#FFF', border: '1px solid #E8E8EC' }}>
                                      <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>State coverage</div>
                                      <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                                        <strong style={{ color: 'var(--slate-900, #1A1A2E)' }}>{stateData.lawyers}</strong> attorney{stateData.lawyers !== 1 ? 's' : ''} · {stateData.n} cases
                                        {stateData.lawyers > 0 && <span style={{ color: stateData.ratio > 5 ? '#92400E' : '#15803D' }}> · {stateData.ratio}:1 ratio</span>}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td></tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        );
      })}

      {cases.length === 0 && (
        <Panel><div style={{ textAlign: 'center', padding: 20, fontSize: '0.78rem', color: '#94A3B8' }}>No cases match your filters</div></Panel>
      )}
    </div>
  );
}
