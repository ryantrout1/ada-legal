import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function OpsLawyerTable({ lawyers, cases, contactLogs }) {
  const rows = useMemo(() => {
    return lawyers
      .filter(l => l.account_status === 'approved')
      .map(l => {
        const myCases = cases.filter(c => c.assigned_lawyer_id === l.id);
        const active = myCases.filter(c => c.status === 'assigned' || c.status === 'in_progress').length;
        const resolved = myCases.filter(c => c.status === 'closed').length;
        const total = myCases.length;

        // Response rate: % of assigned cases where contact logged within 24h
        const withAssign = myCases.filter(c => c.assigned_at);
        let responseRate = null;
        let avgDaysToContact = null;

        if (withAssign.length > 0) {
          let respondedIn24 = 0;
          const contactTimes = [];

          withAssign.forEach(c => {
            const logs = contactLogs.filter(lg => lg.case_id === c.id && lg.lawyer_id === l.id);
            if (logs.length > 0) {
              const earliest = Math.min(...logs.map(lg => new Date(lg.logged_at || lg.created_date).getTime()));
              const hrs = (earliest - new Date(c.assigned_at).getTime()) / 3600000;
              contactTimes.push(hrs);
              if (hrs <= 24) respondedIn24++;
            }
          });

          responseRate = Math.round((respondedIn24 / withAssign.length) * 100);
          if (contactTimes.length > 0) {
            avgDaysToContact = Math.round((contactTimes.reduce((a, b) => a + b, 0) / contactTimes.length) / 24 * 10) / 10;
          }
        }

        return {
          id: l.id, name: l.full_name, firm: l.firm_name,
          active, resolved, total, responseRate, avgDaysToContact,
          flagged: !!l.flagged,
        };
      })
      .sort((a, b) => {
        // Worst performers first
        const aRate = a.responseRate ?? 101;
        const bRate = b.responseRate ?? 101;
        return aRate - bRate;
      });
  }, [lawyers, cases, contactLogs]);

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
      <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 600, color: 'var(--slate-900)', margin: '0 0 12px' }}>
        Lawyer Performance
      </h3>
      {rows.length === 0 ? (
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)', fontSize: '0.875rem' }}>No approved lawyers yet</p>
      ) : (
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr>
                <th style={th}>Lawyer</th>
                <th style={th}>Firm</th>
                <th style={{ ...th, textAlign: 'center' }}>Response Rate</th>
                <th style={{ ...th, textAlign: 'center' }}>Avg Days to Contact</th>
                <th style={{ ...th, textAlign: 'center' }}>Active</th>
                <th style={{ ...th, textAlign: 'center' }}>Resolved</th>
                <th style={{ ...th, textAlign: 'center' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                let rowBg = 'transparent';
                if (r.responseRate !== null && r.responseRate < 25) rowBg = '#FEE2E2';
                else if (r.responseRate !== null && r.responseRate < 50) rowBg = '#FEF3C7';

                return (
                  <tr key={r.id} style={{ backgroundColor: rowBg }}>
                    <td style={{ ...td, fontWeight: 600, color: 'var(--slate-900)' }}>
                      {r.name}
                      {r.flagged && <AlertTriangle size={12} style={{ color: '#B91C1C', marginLeft: 4, verticalAlign: 'middle' }} />}
                    </td>
                    <td style={td}>{r.firm}</td>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 600, color: r.responseRate !== null && r.responseRate < 50 ? '#B91C1C' : 'var(--slate-900)' }}>
                      {r.responseRate !== null ? r.responseRate + '%' : '—'}
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      {r.avgDaysToContact !== null ? r.avgDaysToContact + 'd' : '—'}
                    </td>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{r.active}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{r.resolved}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{r.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}