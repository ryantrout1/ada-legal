import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../../../utils';
import useIntelData from './useIntelData';
import IntelKPIStrip from './IntelKPIStrip';
import IntelReportingActivity from './IntelReportingActivity';
import IntelGeographic from './IntelGeographic';
import IntelBarrierTypes from './IntelBarrierTypes';
import IntelSeverityDist from './IntelSeverityDist';
import IntelBusinesses from './IntelBusinesses';
import IntelSupplyGaps from './IntelSupplyGaps';
import IntelCaseDetail from './IntelCaseDetail';
import IntelGuide from './IntelGuide';
import { fmtDate } from './IntelShared';

export default function PlatformIntelligence() {
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [filter, setFilter] = useState({ sev: 'all', type: 'all' });
  const [tab, setTab] = useState('impact');

  useEffect(() => {
    async function init() {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        if (user?.role === 'lawyer') window.location.href = createPageUrl('LawyerDashboard');
        else window.location.href = createPageUrl('Home');
        return;
      }
      const [allCases, allLawyers] = await Promise.all([
        base44.entities.Case.list('-created_date', 1000),
        base44.entities.LawyerProfile.list('-created_date', 500),
      ]);
      setCases(allCases);
      setLawyers(allLawyers);
      setLoading(false);
    }
    init();
  }, []);

  const data = useIntelData(cases, lawyers, filter);

  if (loading) {
    return (
      <div role="status" aria-label="Loading analytics" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', gap: '1rem' }}>
        <h1 className="sr-only">Platform Intelligence</h1>
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: '#475569' }}>Loading intelligence…</p>
      </div>
    );
  }

  const filterPill = (val, label, group) => ({
    padding: '5px 12px', fontSize: '0.65rem', fontWeight: filter[group] === val ? 700 : 500,
    background: filter[group] === val ? '#C2410C' : '#FFF', color: filter[group] === val ? '#FFF' : '#94A3B8',
    border: '1px solid ' + (filter[group] === val ? '#C2410C' : '#E2E8F0'), borderRadius: 6, cursor: 'pointer', minHeight: 30,
  });

  const tabStyle = (t) => ({
    padding: '6px 14px', fontSize: '0.7rem', fontWeight: tab === t ? 700 : 500,
    background: tab === t ? '#C2410C' : 'transparent', color: tab === t ? '#FFF' : '#94A3B8',
    border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'all 0.1s',
  });

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', padding: '20px 16px 60px', fontFamily: "'Manrope', sans-serif", background: 'var(--slate-50, #F6F6F8)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.6rem', fontWeight: 800, color: 'var(--slate-900, #1A1A2E)', margin: 0 }}>Platform Intelligence</h1>
          <p style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: 2 }}>
            {data.total} reports · {data.states.length} states · {data.cities.length} cities · Updated {fmtDate(new Date().toISOString().split('T')[0])}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {['all', 'high', 'medium', 'low'].map(v => (
            <button key={v} onClick={() => setFilter(f => ({ ...f, sev: v }))} style={filterPill(v, v, 'sev')}>
              {v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
          <span style={{ width: 8 }} />
          {['all', 'physical', 'digital'].map(v => (
            <button key={v} onClick={() => setFilter(f => ({ ...f, type: v }))} style={filterPill(v, v, 'type')}>
              {v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Strip */}
      <IntelKPIStrip data={data} />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 3, background: '#E8E8EC', borderRadius: 8, padding: 3, marginTop: 16, marginBottom: 16 }}>
        <button style={tabStyle('impact')} onClick={() => setTab('impact')}>Violation Intelligence</button>
        <button style={tabStyle('supply')} onClick={() => setTab('supply')}>Supply & Gaps</button>
        <button style={tabStyle('cases')} onClick={() => setTab('cases')}>Case Detail</button>
        <button style={tabStyle('guide')} onClick={() => setTab('guide')}>Guide Intelligence</button>
      </div>

      {/* Tab content */}
      {tab === 'impact' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <IntelReportingActivity data={data} />
          <IntelGeographic data={data} />
          <IntelBarrierTypes data={data} />
          <IntelSeverityDist data={data} />
          <IntelBusinesses data={data} />
        </div>
      )}

      {tab === 'supply' && <IntelSupplyGaps data={data} />}

      {tab === 'cases' && <IntelCaseDetail data={data} />}

      {tab === 'guide' && <IntelGuide />}
    </div>
  );
}
