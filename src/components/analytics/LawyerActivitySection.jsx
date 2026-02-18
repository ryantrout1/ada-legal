import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function LawyerActivitySection({ lawyers, cases, contactLogs }) {
  const approvedLawyers = lawyers
    .filter(l => l.account_status === 'approved')
    .map(l => {
      const myCases = cases.filter(c => c.assigned_lawyer_id === l.id);
      const activeCases = myCases.filter(c => c.status === 'assigned' || c.status === 'in_progress').length;
      const totalCases = myCases.length;

      // Avg contact time: hours between assigned_at and first ContactLog logged_at
      const casesWithAssign = myCases.filter(c => c.assigned_at);
      let avgContactHrs = null;
      if (casesWithAssign.length > 0) {
        const times = casesWithAssign
          .map(c => {
            const logs = contactLogs.filter(lg => lg.case_id === c.id && lg.lawyer_id === l.id);
            if (logs.length === 0) return null;
            const earliest = logs.reduce((min, lg) => {
              const t = new Date(lg.logged_at || lg.created_date);
              return t < min ? t : min;
            }, new Date('2999-01-01'));
            return (earliest - new Date(c.assigned_at)) / (1000 * 60 * 60);
          })
          .filter(t => t !== null);
        if (times.length > 0) {
          avgContactHrs = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        }
      }

      return {
        id: l.id,
        name: l.full_name,
        firm: l.firm_name,
        activeCases,
        totalCases,
        avgContactHrs,
        flagged: !!l.flagged
      };
    })
    .sort((a, b) => b.activeCases - a.activeCases);

  const th = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
    color: 'var(--slate-500)', textAlign: 'left', padding: '0.4rem 0.75rem',
    borderBottom: '2px solid var(--slate-200)', textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };
  const td = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-700)',
    padding: '0.35rem 0.75rem', borderBottom: '1px solid var(--slate-100)'
  };

  return (
    <div>
      <div style={{
        backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
        borderRadius: 'var(--radius-md)', overflow: 'auto'
      }}>
        {approvedLawyers.length === 0 ? (
          <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)', padding: '12px', textAlign: 'center' }}>No approved lawyers yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Lawyer Name</th>
                <th style={th}>Firm</th>
                <th style={{ ...th, textAlign: 'center' }}>Active Cases</th>
                <th style={{ ...th, textAlign: 'center' }}>Total Cases</th>
                <th style={{ ...th, textAlign: 'center' }}>Avg Contact Time</th>
                <th style={{ ...th, textAlign: 'center' }}>Flagged</th>
              </tr>
            </thead>
            <tbody>
              {approvedLawyers.map(l => (
                <tr key={l.id}>
                  <td style={{ ...td, fontWeight: 600, color: 'var(--slate-900)' }}>{l.name}</td>
                  <td style={td}>{l.firm}</td>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{l.activeCases}</td>
                  <td style={{ ...td, textAlign: 'center' }}>{l.totalCases}</td>
                  <td style={{ ...td, textAlign: 'center' }}>{l.avgContactHrs !== null ? `${l.avgContactHrs}h` : '—'}</td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    {l.flagged ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#B91C1C', fontWeight: 600 }}>
                        <AlertTriangle size={14} /> Yes
                      </span>
                    ) : (
                      <span style={{ color: 'var(--slate-400)' }}>No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}