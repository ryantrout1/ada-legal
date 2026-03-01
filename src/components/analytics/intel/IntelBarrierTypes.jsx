import React from 'react';
import { S, Dot, Bar, Panel, PanelHead, pct, isDigital, catName } from './IntelShared';

function BarrierSection({ title, color, cats, maxVal, reportCount, totalReports }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--slate-900, #1A1A2E)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
        <span style={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: 600 }}>{reportCount} reports ({pct(reportCount, totalReports)}%)</span>
      </div>
      {cats.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {cats.map(c => {
            const worst = c.h > 0 ? 'high' : c.m > 0 ? 'medium' : 'low';
            return (
              <div key={c.cat} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
                <span style={{ width: 95, fontWeight: 600, color: 'var(--slate-900, #1A1A2E)', textTransform: 'capitalize', flexShrink: 0 }}>{catName(c.cat)}</span>
                <div style={{ flex: 1 }}><Bar v={c.n} max={maxVal} color={color} h={12} /></div>
                <span style={{ fontFamily: 'Fraunces, serif', width: 22, textAlign: 'right', fontWeight: 700, color: 'var(--slate-900, #1A1A2E)', flexShrink: 0 }}>{c.n}</span>
                <Dot color={S[worst].dot} size={8} />
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontStyle: 'italic' }}>No reports</div>
      )}
    </div>
  );
}

export default function IntelBarrierTypes({ data }) {
  const physCats = data.cats.filter(c => !isDigital(c.cat));
  const digCats = data.cats.filter(c => isDigital(c.cat));
  const maxPhys = physCats[0]?.n || 1;
  const maxDig = digCats[0]?.n || 1;

  return (
    <Panel>
      <PanelHead title="Barrier Types" right={`${data.cats.length} categories`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <BarrierSection title="Physical Barriers" color="#C2410C" cats={physCats} maxVal={maxPhys} reportCount={data.physical} totalReports={data.total} />
        <div style={{ height: 1, background: '#E8E8EC' }} />
        <BarrierSection title="Digital Barriers" color="#2563EB" cats={digCats} maxVal={maxDig} reportCount={data.digital} totalReports={data.total} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 10, fontSize: '0.56rem', color: '#94A3B8', borderTop: '1px solid #F1F1F5', paddingTop: 6 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>Highest severity: <Dot color={S.high.dot} size={5} /> High <Dot color={S.medium.dot} size={5} /> Med <Dot color={S.low.dot} size={5} /> Low</span>
      </div>
    </Panel>
  );
}
