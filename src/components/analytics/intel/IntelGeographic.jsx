import React, { useState } from 'react';
import { S, Dot, Tag, Bar, CoveragePill, Panel, PanelHead, catName } from './IntelShared';

export default function IntelGeographic({ data }) {
  const [expanded, setExpanded] = useState(null);
  const maxState = data.states[0]?.n || 1;

  return (
    <Panel>
      <PanelHead title="Geographic" right={`${data.states.length} states · ${data.cities.length} cities`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {data.states.map((st, si) => {
          const isOpen = expanded === st.st;
          const noCoverage = st.lawyers === 0 && st.n > 0;
          const strained = st.lawyers > 0 && st.ratio > 5;
          const maxCityInState = st.cities[0]?.n || 1;
          const worstSev = st.h > 0 ? 'high' : st.m > 0 ? 'medium' : 'low';

          return (
            <div key={st.st}>
              <button onClick={() => setExpanded(isOpen ? null : st.st)} aria-expanded={isOpen} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem',
                padding: '7px 10px', border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
                background: isOpen ? '#F8F8FA' : noCoverage ? '#FFF5F5' : 'transparent', transition: 'background 0.1s',
              }}>
                <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: '0.85rem', color: 'var(--slate-900, #1A1A2E)', width: 26, flexShrink: 0 }}>{st.st}</span>
                <div style={{ flex: 1 }}><Bar v={st.n} max={maxState} color={si === 0 ? '#C2410C' : noCoverage ? '#EF4444' : '#94A3B8'} h={10} /></div>
                <span style={{ fontFamily: 'Fraunces, serif', width: 24, textAlign: 'right', fontWeight: 700, color: 'var(--slate-900, #1A1A2E)', flexShrink: 0, fontSize: '0.85rem' }}>{st.n}</span>
                <Dot color={S[worstSev].dot} size={8} />
                <CoveragePill lawyers={st.lawyers} ratio={st.ratio} />
                <span style={{ fontSize: '0.7rem', color: '#CBD5E1', width: 10, textAlign: 'center', flexShrink: 0 }}>{isOpen ? '▴' : '▾'}</span>
              </button>

              {isOpen && (
                <div style={{ marginLeft: 34, paddingLeft: 10, borderLeft: '2px solid #E2E8F0', marginTop: 2, marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '6px 0 8px', borderBottom: '1px solid #F1F1F5', marginBottom: 4, fontSize: '0.65rem', color: '#64748B' }}>
                    <span>Severity: <strong style={{ color: S.high.fg }}>{st.h} high</strong> · <strong style={{ color: S.medium.fg }}>{st.m} med</strong> · <strong style={{ color: S.low.fg }}>{st.l} low</strong></span>
                    <span>Attorneys: <strong style={{ color: st.lawyers > 0 ? '#15803D' : '#DC2626' }}>{st.lawyers}</strong></span>
                    {st.lawyers > 0 && <span>Ratio: <strong style={{ color: st.ratio > 8 ? '#DC2626' : st.ratio > 5 ? '#92400E' : '#15803D' }}>{st.ratio} cases per attorney</strong></span>}
                    {st.newThisMonth > 0 && <span>New this month: <strong style={{ color: '#1E40AF' }}>{st.newThisMonth}</strong></span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {st.cities.map((c, ci) => {
                      const topCat = Object.entries(c.cats).sort((a, b) => b[1] - a[1])[0];
                      const cWorst = c.h > 0 ? 'high' : c.m > 0 ? 'medium' : 'low';
                      return (
                        <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.68rem', padding: '3px 6px', borderRadius: 4, background: ci === 0 ? '#FAFAFA' : 'transparent' }}>
                          <span style={{ width: 90, fontWeight: 600, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{c.name}</span>
                          <div style={{ flex: 1 }}><Bar v={c.n} max={maxCityInState} color={ci === 0 ? '#C2410C' : '#CBD5E1'} h={7} /></div>
                          <span style={{ width: 16, textAlign: 'right', fontWeight: 700, color: 'var(--slate-900, #1A1A2E)', flexShrink: 0 }}>{c.n}</span>
                          <Dot color={S[cWorst].dot} size={6} />
                          <span style={{ fontSize: '0.55rem', color: '#94A3B8', flexShrink: 0, textTransform: 'capitalize', width: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topCat ? catName(topCat[0]) : ''}</span>
                          <span style={{ width: 10, textAlign: 'center', flexShrink: 0 }}>{c.atty ? <Dot color="#22C55E" size={6} /> : <Dot color="#EF4444" size={6} />}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: '0.56rem', color: '#94A3B8', borderTop: '1px solid #F1F1F5', paddingTop: 6, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>Severity: <Dot color={S.high.dot} size={5} /> High <Dot color={S.medium.dot} size={5} /> Med <Dot color={S.low.dot} size={5} /> Low</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <Tag bg="#DCFCE7" fg="#15803D">Covered</Tag>
          <Tag bg="#FEF3C7" fg="#92400E">Strained</Tag>
          <Tag bg="#FEE2E2" fg="#B91C1C">No Coverage</Tag>
        </span>
      </div>
    </Panel>
  );
}
