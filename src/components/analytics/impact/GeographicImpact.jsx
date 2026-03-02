import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const STATE_NAME_TO_ABBR = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA','Colorado':'CO',
  'Connecticut':'CT','Delaware':'DE','District of Columbia':'DC','Florida':'FL','Georgia':'GA',
  'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS','Kentucky':'KY',
  'Louisiana':'LA','Maine':'ME','Maryland':'MD','Massachusetts':'MA','Michigan':'MI','Minnesota':'MN',
  'Mississippi':'MS','Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH',
  'New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND',
  'Ohio':'OH','Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC',
  'South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA',
  'Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY'
};
function normalizeState(s) {
  if (!s) return '';
  const t = s.trim();
  if (t.length === 2) return t.toUpperCase();
  return STATE_NAME_TO_ABBR[t] || t;
}

export default function GeographicImpact({ cases, lawyers }) {
  const [showTable, setShowTable] = useState(false);

  const { cityData, stateData } = useMemo(() => {
    const approvedLawyers = lawyers.filter(l => l.account_status === 'approved');
    const lawyersByState = {};
    approvedLawyers.forEach(l => {
      (l.states_of_practice || []).forEach(s => { lawyersByState[s] = (lawyersByState[s] || 0) + 1; });
    });

    const cityMap = {};
    const stateMap = {};
    cases.forEach(c => {
      const st = normalizeState(c.state);
      const city = (c.city || '').trim();
      if (city && st) {
        const key = `${city}, ${st}`;
        if (!cityMap[key]) cityMap[key] = { name: key, count: 0 };
        cityMap[key].count++;
      }
      if (st) {
        if (!stateMap[st]) stateMap[st] = { state: st, total: 0, businesses: new Set(), topViolation: {}, hasCoverage: (lawyersByState[st] || 0) > 0 };
        stateMap[st].total++;
        if (c.ai_duplicate_cluster_id) stateMap[st].businesses.add(c.ai_duplicate_cluster_id);
        const vt = c.ai_category || c.violation_subtype || c.violation_type || 'other';
        stateMap[st].topViolation[vt] = (stateMap[st].topViolation[vt] || 0) + 1;
      }
    });

    const cities = Object.values(cityMap).sort((a, b) => b.count - a.count).slice(0, 20);
    const states = Object.values(stateMap).map(s => {
      const topV = Object.entries(s.topViolation).sort((a, b) => b[1] - a[1])[0];
      return { ...s, businesses: s.businesses.size, topViolationType: topV ? topV[0].replace(/_/g, ' ') : '—' };
    }).sort((a, b) => b.total - a.total);

    return { cityData: cities, stateData: states };
  }, [cases, lawyers]);

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600, color: 'var(--heading)', margin: 0 }}>
            Where are violations happening?
          </h3>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body-secondary)', margin: '2px 0 0' }}>Geographic Distribution</p>
        </div>
        <button onClick={() => setShowTable(!showTable)} style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', padding: '6px 12px', minHeight: '44px',
          border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'white',
          cursor: 'pointer', color: 'var(--body)',
        }}>
          {showTable ? 'Show Chart' : 'Show Data Table'}
        </button>
      </div>

      {showTable ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h4 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 8px' }}>Top 20 Cities</h4>
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--body-secondary)', borderBottom: '2px solid var(--border)', textTransform: 'uppercase' }}>City</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px', fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--body-secondary)', borderBottom: '2px solid var(--border)', textTransform: 'uppercase' }}>Reports</th>
                </tr></thead>
                <tbody>{cityData.map(c => (
                  <tr key={c.name}><td style={{ padding: '6px 8px', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', borderBottom: '1px solid var(--border-lighter)' }}>{c.name}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', borderBottom: '1px solid var(--border-lighter)' }}>{c.count}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          <div>
            <h4 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 8px' }}>States by Total Reports</h4>
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                <thead><tr>
                  {['State', 'Total', 'Businesses', 'Top Violation', 'Attorney Coverage'].map(h => (
                    <th key={h} style={{ textAlign: h === 'State' || h === 'Top Violation' || h === 'Attorney Coverage' ? 'left' : 'center', padding: '6px 8px', fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--body-secondary)', borderBottom: '2px solid var(--border)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{stateData.map(s => (
                  <tr key={s.state}>
                    <td style={{ padding: '6px 8px', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, borderBottom: '1px solid var(--border-lighter)' }}>{s.state}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', borderBottom: '1px solid var(--border-lighter)' }}>{s.total}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', borderBottom: '1px solid var(--border-lighter)' }}>{s.businesses}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', borderBottom: '1px solid var(--border-lighter)', textTransform: 'capitalize' }}>{s.topViolationType}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, borderBottom: '1px solid var(--border-lighter)', color: s.hasCoverage ? '#16A34A' : '#DC2626' }}>
                      {s.hasCoverage ? 'Yes' : 'No'}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="sr-only">
            <table><caption>Top 20 Cities by Reports</caption>
              <thead><tr><th>City</th><th>Reports</th></tr></thead>
              <tbody>{cityData.map(c => <tr key={c.name}><td>{c.name}</td><td>{c.count}</td></tr>)}</tbody>
            </table>
          </div>
          <div aria-hidden="true" style={{ width: '100%', height: Math.max(200, cityData.length * 32) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData} layout="vertical" barSize={18} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fill: 'var(--body-secondary)' }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fill: 'var(--body)' }} />
                <Tooltip contentStyle={{ fontFamily: 'Manrope, sans-serif', fontSize: 12 }} />
                <Bar dataKey="count" fill="#C2410C" radius={[0, 4, 4, 0]} name="Reports" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}