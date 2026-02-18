import React from 'react';

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
  const trimmed = s.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return STATE_NAME_TO_ABBR[trimmed] || trimmed;
}

export default function UnderservedAreas({ cases, lawyers }) {
  const approvedLawyers = lawyers.filter(l => l.account_status === 'approved');
  const availableCases = cases.filter(c => c.status === 'available');

  // Build map: state+city => { count, earliest created_date }
  const areaMap = {};
  availableCases.forEach(c => {
    const st = normalizeState(c.state);
    const city = (c.city || '').trim() || 'Unknown';
    const key = `${st}|${city}`;
    if (!areaMap[key]) areaMap[key] = { state: st, city, count: 0, totalAge: 0 };
    areaMap[key].count++;
    const age = (Date.now() - new Date(c.created_date || c.submitted_at).getTime()) / (1000 * 60 * 60 * 24);
    areaMap[key].totalAge += age;
  });

  // Lawyer count per state
  const lawyersByState = {};
  approvedLawyers.forEach(l => {
    (l.states_of_practice || []).forEach(s => {
      lawyersByState[s] = (lawyersByState[s] || 0) + 1;
    });
  });

  const rows = Object.values(areaMap)
    .filter(a => a.count >= 1)
    .map(a => ({
      ...a,
      activeLawyers: lawyersByState[a.state] || 0,
      avgDaysUnclaimed: Math.round(a.totalAge / a.count)
    }))
    .sort((a, b) => b.count - a.count);

  if (rows.length === 0) return null;

  const th = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
    color: 'var(--slate-500)', textAlign: 'left', padding: '0.4rem 0.75rem',
    borderBottom: '2px solid var(--slate-200)', textTransform: 'uppercase', letterSpacing: '0.04em'
  };
  const td = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-700)',
    padding: '0.35rem 0.75rem', borderBottom: '1px solid var(--slate-100)'
  };

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
      borderRadius: 'var(--radius-lg)', padding: '0.875rem 1rem'
    }}>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700,
        color: 'var(--slate-800)', marginBottom: '0.5rem', marginTop: 0
      }}>Underserved Areas</p>
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>State</th>
              <th style={th}>City</th>
              <th style={{ ...th, textAlign: 'center' }}>Available Cases</th>
              <th style={{ ...th, textAlign: 'center' }}>Active Lawyers</th>
              <th style={{ ...th, textAlign: 'center' }}>Avg Days Unclaimed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{
                backgroundColor: r.count > 0 && r.activeLawyers === 0 ? '#FEE2E2' : 'transparent'
              }}>
                <td style={{ ...td, fontWeight: 600 }}>{r.state}</td>
                <td style={td}>{r.city}</td>
                <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{r.count}</td>
                <td style={{ ...td, textAlign: 'center', color: r.activeLawyers === 0 ? '#B91C1C' : 'var(--slate-700)', fontWeight: r.activeLawyers === 0 ? 600 : 400 }}>
                  {r.activeLawyers}
                </td>
                <td style={{ ...td, textAlign: 'center' }}>{r.avgDaysUnclaimed}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}