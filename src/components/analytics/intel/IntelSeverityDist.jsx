import React from 'react';
import { S, pct, Panel, PanelHead } from './IntelShared';

export default function IntelSeverityDist({ data }) {
  return (
    <Panel>
      <PanelHead title="Severity Distribution" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {[['high', data.high], ['medium', data.med], ['low', data.low]].map(([s, n]) => {
          const c = S[s];
          return (
            <div key={s} style={{ flex: 1, padding: '10px', borderRadius: 8, background: c.bg, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 800, color: c.fg, lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: c.fg, opacity: 0.7, textTransform: 'uppercase', marginTop: 2 }}>{s}</div>
              <div style={{ fontSize: '0.55rem', color: c.fg, opacity: 0.5, marginTop: 1 }}>{pct(n, data.total)}%</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', height: 14, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct(data.high, data.total)}%`, background: S.high.dot }} />
        <div style={{ width: `${pct(data.med, data.total)}%`, background: S.medium.dot }} />
        <div style={{ width: `${pct(data.low, data.total)}%`, background: S.low.dot }} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: '0.58rem', color: '#94A3B8', borderTop: '1px solid #F1F1F5', paddingTop: 6 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: S.high.dot }} /> High ({pct(data.high, data.total)}%)</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: S.medium.dot }} /> Medium ({pct(data.med, data.total)}%)</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: S.low.dot }} /> Low ({pct(data.low, data.total)}%)</span>
        <span style={{ marginLeft: 'auto' }}>Physical {data.physical} · Digital {data.digital}</span>
      </div>
    </Panel>
  );
}
