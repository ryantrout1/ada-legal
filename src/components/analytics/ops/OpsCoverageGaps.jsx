import React, { useMemo } from 'react';

const STATE_ABBR_TO_NAME = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',
  HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',
  LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',
  MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',
  NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',
  OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
  SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',
  WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'
};

const STATE_NAME_TO_ABBR = Object.fromEntries(Object.entries(STATE_ABBR_TO_NAME).map(([k, v]) => [v, k]));

function normalizeState(s) {
  if (!s) return '';
  const t = s.trim();
  if (t.length === 2) return t.toUpperCase();
  return STATE_NAME_TO_ABBR[t] || t;
}

export default function OpsCoverageGaps({ cases, lawyers }) {
  const rows = useMemo(() => {
    const approvedLawyers = lawyers.filter(l => l.account_status === 'approved');
    const lawyersByState = {};
    approvedLawyers.forEach(l => {
      (l.states_of_practice || []).forEach(s => { lawyersByState[s] = (lawyersByState[s] || 0) + 1; });
    });

    const now = new Date();
    const monthMs = 30 * 24 * 3600000;
    const stateMap = {};
    cases.forEach(c => {
      const st = normalizeState(c.state);
      if (!st) return;
      if (!stateMap[st]) stateMap[st] = { total: 0, recentCount: 0 };
      stateMap[st].total++;
      const d = new Date(c.submitted_at || c.created_date);
      if (now - d < monthMs) stateMap[st].recentCount++;
    });

    return Object.entries(stateMap).map(([state, data]) => {
      const lawyerCount = lawyersByState[state] || 0;
      const demandScore = lawyerCount > 0 ? Math.round((data.recentCount / lawyerCount) * 10) / 10 : data.recentCount > 0 ? 999 : 0;
      return { state, total: data.total, monthly: data.recentCount, lawyers: lawyerCount, demandScore, noCoverage: lawyerCount === 0 };
    }).sort((a, b) => b.demandScore - a.demandScore);
  }, [cases, lawyers]);

  const th = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
    color: 'var(--slate-500)', textAlign: 'left', padding: '8px 10px',
    borderBottom: '2px solid var(--slate-200)', textTransform: 'uppercase', letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  };
  const td = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-700)',
    padding: '8px 10px', borderBottom: '1px solid var(--slate-100)',
  };

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid var(--slate-200)', borderRadius: '10px', padding: '16px' }}>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 600, color: 'var(--slate-900)', margin: '0 0 12px' }}>
        Coverage Gaps
      </h2>
      {rows.length === 0 ? (
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)', fontSize: '0.875rem' }}>No geographic data yet</p>
      ) : (
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
            <thead>
              <tr>
                <th style={th}>State</th>
                <th style={{ ...th, textAlign: 'center' }}>Total Cases</th>
                <th style={{ ...th, textAlign: 'center' }}>Monthly</th>
                <th style={{ ...th, textAlign: 'center' }}>Active Lawyers</th>
                <th style={{ ...th, textAlign: 'center' }}>Demand Score</th>
                <th style={th}>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.state} style={{ backgroundColor: r.noCoverage ? '#FEE2E2' : 'transparent' }}>
                  <td style={{ ...td, fontWeight: 600 }}>{r.state}</td>
                  <td style={{ ...td, textAlign: 'center' }}>{r.total}</td>
                  <td style={{ ...td, textAlign: 'center' }}>{r.monthly}</td>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 600, color: r.noCoverage ? '#B91C1C' : 'var(--slate-900)' }}>
                    {r.lawyers}
                  </td>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: r.demandScore > 5 ? '#B91C1C' : r.demandScore > 2 ? '#92400E' : 'var(--slate-700)' }}>
                    {r.demandScore === 999 ? '∞' : r.demandScore}
                  </td>
                  <td style={td}>
                    {r.noCoverage ? (
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#B91C1C' }}>
                        🔴 No attorney coverage
                      </span>
                    ) : (
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: '#15803D' }}>
                        ✓ Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}