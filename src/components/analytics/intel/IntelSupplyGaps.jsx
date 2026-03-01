import React from 'react';
import { S, Dot, Tag, CoveragePill, Panel, PanelHead, pct, catName, fmtDate, getSeverity, getViews, isDigital } from './IntelShared';

function DemandVsSupply({ data }) {
  const ratio = data.activeLawyers > 0 ? Math.round(data.total / data.activeLawyers) : '∞';
  const needed = Math.max(0, Math.ceil(data.total / 5) - data.activeLawyers);

  return (
    <Panel>
      <PanelHead title="Demand vs Supply" />
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, textAlign: 'center', padding: '12px 10px', borderRadius: 8, background: '#FEE2E2' }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '2.2rem', fontWeight: 800, color: '#B91C1C', lineHeight: 1 }}>{data.unclaimed}</div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#DC2626', marginTop: 3 }}>Unclaimed Cases</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '1rem', color: '#CBD5E1', fontWeight: 300 }}>vs</div>
        <div style={{ flex: 1, textAlign: 'center', padding: '12px 10px', borderRadius: 8, background: data.activeLawyers >= 5 ? '#DCFCE7' : '#FEF3C7' }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '2.2rem', fontWeight: 800, color: data.activeLawyers >= 5 ? '#15803D' : '#92400E', lineHeight: 1 }}>{data.activeLawyers}</div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: data.activeLawyers >= 5 ? '#16A34A' : '#B45309', marginTop: 3 }}>Active Attorneys</div>
        </div>
      </div>
      <div style={{ padding: '10px 12px', background: '#F8F8FA', borderRadius: 8, fontSize: '0.72rem', color: '#64748B', lineHeight: 1.6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Cases per attorney</span>
          <strong style={{ color: 'var(--slate-900, #1A1A2E)' }}>{ratio}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Target ratio</span>
          <strong style={{ color: '#15803D' }}>≤ 5</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E8E8EC', paddingTop: 4 }}>
          <span>Attorneys needed</span>
          <strong style={{ color: '#DC2626' }}>+{needed}</strong>
        </div>
      </div>
    </Panel>
  );
}

function CoverageByState({ data }) {
  return (
    <Panel>
      <PanelHead title="Attorney Coverage by State" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {data.states.map(st => {
          const noCoverage = st.lawyers === 0 && st.n > 0;
          return (
            <div key={st.st} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem', padding: '6px 8px', borderRadius: 6, background: noCoverage ? '#FFF5F5' : 'transparent', borderBottom: '1px solid #F8F8FA' }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 800, color: 'var(--slate-900, #1A1A2E)', width: 24, flexShrink: 0 }}>{st.st}</span>
              <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: 'var(--slate-900, #1A1A2E)', width: 22, textAlign: 'right' }}>{st.n}</span>
              <span style={{ fontSize: '0.6rem', color: '#94A3B8', flex: 1 }}>{st.n === 1 ? 'report' : 'reports'}</span>
              <CoveragePill lawyers={st.lawyers} ratio={st.ratio} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, fontSize: '0.56rem', color: '#94A3B8', borderTop: '1px solid #F1F1F5', paddingTop: 6 }}>
        <Tag bg="#DCFCE7" fg="#15803D">Covered</Tag><span>≤5/atty</span>
        <Tag bg="#FEF3C7" fg="#92400E">Strained</Tag><span>&gt;5</span>
        <Tag bg="#FEE2E2" fg="#B91C1C">No Coverage</Tag><span>0 attorneys</span>
      </div>
    </Panel>
  );
}

function RecruitmentPriorities({ data }) {
  const priorities = data.states
    .filter(st => st.lawyers === 0 || st.ratio > 5)
    .sort((a, b) => {
      if (a.lawyers === 0 && b.lawyers > 0) return -1;
      if (a.lawyers > 0 && b.lawyers === 0) return 1;
      return b.n - a.n;
    });

  return (
    <Panel style={{ gridColumn: '1 / -1' }}>
      <PanelHead title="Recruitment Priorities" right="Where to focus attorney outreach" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {priorities.map(st => {
          const noCoverage = st.lawyers === 0;
          const needed = noCoverage ? Math.ceil(st.n / 5) : Math.max(0, Math.ceil(st.n / 5) - st.lawyers);
          const topCatEntry = Object.entries(st.cats).sort((a, b) => b[1] - a[1])[0];
          return (
            <div key={st.st} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: noCoverage ? '#FFF5F5' : '#FFFBF7', border: '1px solid ' + (noCoverage ? '#FECACA' : '#FDE68A') }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: '0.9rem', color: 'var(--slate-900, #1A1A2E)', width: 26 }}>{st.st}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--slate-900, #1A1A2E)' }}>
                  {noCoverage ? `${st.n} cases with zero attorney coverage` : `${st.n} cases for ${st.lawyers} attorney${st.lawyers > 1 ? 's' : ''} (${st.ratio}:1 ratio)`}
                </div>
                <div style={{ fontSize: '0.62rem', color: '#64748B', marginTop: 2 }}>
                  Top barrier: {topCatEntry ? `${catName(topCatEntry[0])} (${topCatEntry[1]})` : '—'}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 800, color: noCoverage ? '#B91C1C' : '#92400E' }}>+{needed}</div>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#94A3B8' }}>NEEDED</div>
              </div>
            </div>
          );
        })}
        {priorities.length === 0 && (
          <div style={{ padding: 16, textAlign: 'center', fontSize: '0.75rem', color: '#15803D', background: '#DCFCE7', borderRadius: 8 }}>All states have adequate coverage</div>
        )}
      </div>
    </Panel>
  );
}

function PipelineFunnel({ data }) {
  const stages = [
    { l: 'Submitted', n: data.total, c: '#94A3B8' },
    { l: 'Approved', n: data.list.filter(c => c.status !== 'pending_review' && c.status !== 'submitted').length || data.list.filter(c => c.approved_at).length || data.total, c: '#64748B' },
    { l: 'Viewed', n: data.list.filter(c => (c.marketplace_views || 0) > 0).length, c: '#C2410C' },
    { l: 'Assigned', n: data.assigned, c: '#15803D' },
  ];
  const maxN = stages[0].n || 1;

  return (
    <Panel>
      <PanelHead title="Pipeline Funnel" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {stages.map((s, i) => {
          const w = Math.max(s.n / maxN * 100, 3);
          const prev = i > 0 ? stages[i - 1].n : null;
          const conv = prev > 0 ? pct(s.n, prev) : null;
          const bigDrop = conv !== null && conv < 30;
          return (
            <div key={s.l}>
              {conv !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 80, marginBottom: 2 }}>
                  <span style={{ fontSize: '0.55rem', fontWeight: 700, color: bigDrop ? '#DC2626' : '#94A3B8' }}>↓ {conv}%</span>
                  {bigDrop && <span style={{ fontSize: '0.5rem', color: '#DC2626', fontWeight: 600 }}>⚠ major drop-off</span>}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 72, fontSize: '0.68rem', fontWeight: 600, color: 'var(--slate-900, #1A1A2E)', textAlign: 'right', flexShrink: 0 }}>{s.l}</span>
                <div style={{ flex: 1, height: 20, background: '#F1F1F5', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${w}%`, height: '100%', background: s.c, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6, minWidth: 24 }}>
                    {w > 12 && <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#FFF' }}>{s.n}</span>}
                  </div>
                </div>
                {w <= 12 && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--slate-900, #1A1A2E)', flexShrink: 0 }}>{s.n}</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, padding: '8px 10px', background: '#FFF7ED', borderRadius: 6, fontSize: '0.65rem', color: '#9A3412', lineHeight: 1.5 }}>
        {(() => {
          const viewed = data.list.filter(c => (c.marketplace_views || 0) > 0).length;
          const viewRate = pct(viewed, data.total);
          if (viewRate < 30) return `Only ${viewRate}% of cases have been viewed by attorneys. This is the biggest bottleneck — lawyers may not be finding cases in the marketplace.`;
          if (pct(data.assigned, viewed) < 30) return `Cases are being viewed but not claimed. Attorneys may need more incentive or case details may need improvement.`;
          return `Pipeline is flowing. Monitor for sustained conversion.`;
        })()}
      </div>
    </Panel>
  );
}

function InvisibleCases({ data }) {
  const zv = data.list.filter(c => c.status === 'available' && !(c.marketplace_views || 0));
  const bySt = {};
  zv.forEach(c => { const st = (c.state || '').trim().toUpperCase(); if (!bySt[st]) bySt[st] = { st, cases: [] }; bySt[st].cases.push(c); });
  const groups = Object.values(bySt).sort((a, b) => b.cases.length - a.cases.length);

  return (
    <Panel>
      <PanelHead title="Invisible Cases" right={`${zv.length} unseen by lawyers`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {groups.map(g => (
          <div key={g.st}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: '0.78rem', color: 'var(--slate-900, #1A1A2E)' }}>{g.st}</span>
              <span style={{ fontSize: '0.6rem', color: '#94A3B8' }}>{g.cases.length} unseen</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {g.cases.slice(0, 6).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 4, background: '#FAFAFA', fontSize: '0.68rem' }}>
                  <Dot color={S[getSeverity(c)].dot} size={6} />
                  <span style={{ flex: 1, fontWeight: 600, color: 'var(--slate-900, #1A1A2E)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.business_name || 'Unknown'}</span>
                  <span style={{ color: '#CBD5E1', flexShrink: 0, fontSize: '0.6rem' }}>{fmtDate(c.submitted_at || c.created_date)}</span>
                </div>
              ))}
              {g.cases.length > 6 && (
                <div style={{ fontSize: '0.6rem', color: '#94A3B8', paddingLeft: 14 }}>+{g.cases.length - 6} more</div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: '0.56rem', color: '#94A3B8', borderTop: '1px solid #F1F1F5', paddingTop: 6 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>Severity: <Dot color={S.high.dot} size={5} /> High <Dot color={S.medium.dot} size={5} /> Med <Dot color={S.low.dot} size={5} /> Low</span>
      </div>
    </Panel>
  );
}

export default function IntelSupplyGaps({ data }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <DemandVsSupply data={data} />
      <CoverageByState data={data} />
      <RecruitmentPriorities data={data} />
      <PipelineFunnel data={data} />
      <InvisibleCases data={data} />
    </div>
  );
}
