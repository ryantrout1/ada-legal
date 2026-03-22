import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../../utils';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function LawyerActivityPanel({ cases, lawyers, contactLogs }) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const overdueContacts = useMemo(() => {
    const result = [];
    cases.filter(c => c.status === 'assigned' && c.assigned_at && c.assigned_at < twentyFourHoursAgo && c.assigned_lawyer_id).forEach(c => {
      const hasLog = contactLogs.some(l => l.case_id === c.id);
      if (hasLog) return;
      const lawyer = lawyers.find(l => l.id === c.assigned_lawyer_id);
      if (!lawyer) return;
      const hrs = Math.floor((Date.now() - new Date(c.assigned_at).getTime()) / 3600000);
      result.push({ caseId: c.id, caseName: c.business_name, lawyerName: lawyer.full_name, hoursOverdue: hrs });
    });
    return result;
  }, [cases, lawyers, contactLogs]);

  const activeLawyers = useMemo(() => {
    const approved = lawyers.filter(l => l.account_status === 'approved');
    return approved.map(l => {
      const assignedCases = cases.filter(c => c.assigned_lawyer_id === l.id && ['assigned', 'in_progress'].includes(c.status));
      const logsForLawyer = contactLogs.filter(cl => cl.lawyer_id === l.id);
      let avgContact = '—';
      if (logsForLawyer.length > 0) {
        const casesWithLogs = [];
        logsForLawyer.forEach(cl => {
          const c = cases.find(cs => cs.id === cl.case_id);
          if (c?.assigned_at) {
            const hrs = (new Date(cl.logged_at || cl.created_date) - new Date(c.assigned_at)) / 3600000;
            if (hrs >= 0) casesWithLogs.push(hrs);
          }
        });
        if (casesWithLogs.length > 0) {
          const avg = casesWithLogs.reduce((a, b) => a + b, 0) / casesWithLogs.length;
          avgContact = avg < 1 ? '<1h' : `${Math.round(avg)}h`;
        }
      }
      return { id: l.id, name: l.full_name, activeCases: assignedCases.length, avgContact };
    }).sort((a, b) => b.activeCases - a.activeCases);
  }, [lawyers, cases, contactLogs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Overdue Contact */}
      {overdueContacts.length > 0 ? (
        <div style={{
          backgroundColor: 'var(--err-bg)', border: '1px solid #FECACA',
          borderRadius: '8px', overflow: 'hidden',
        }}>
          <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #FECACA' }}>
            <AlertTriangle size={14} style={{ color: 'var(--err-fg)' }} aria-hidden="true" />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--err-fg)' }}>
              Overdue Contact ({overdueContacts.length})
            </span>
          </div>
          {overdueContacts.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap',
              padding: '6px 12px', borderBottom: i < overdueContacts.length - 1 ? '1px solid #FECACA' : 'none',
              backgroundColor: '#FFF5F5',
            }}>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--body)' }}>{item.lawyerName}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--body-secondary)' }}>→ {item.caseName}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--err-fg)', marginLeft: 'auto', flexShrink: 0 }}>
                {item.hoursOverdue}h overdue
              </span>
              <Link
                to={createPageUrl('AdminCases') + `?search=${encodeURIComponent(item.caseName)}`}
                aria-label={`View case for ${item.caseName}`}
                style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                  color: 'var(--terra-600)', textDecoration: 'none', flexShrink: 0,
                  minHeight: '44px', display: 'inline-flex', alignItems: 'center',
                }}
              >
                View
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '8px 12px',
          backgroundColor: 'var(--suc-bg)', borderRadius: '8px', border: '1px solid #BBF7D0',
        }}>
          <CheckCircle size={14} style={{ color: 'var(--suc-fg)' }} aria-hidden="true" />
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--suc-fg)', fontWeight: 600 }}>
            All lawyers have made timely contact
          </span>
        </div>
      )}

      {/* Active Lawyers */}
      {activeLawyers.length > 0 && (
        <div style={{
          backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: '8px', overflow: 'hidden',
        }}>
          <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--card-border)' }}>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--body)' }}>
              Active Lawyers ({activeLawyers.length})
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--page-bg-subtle)' }}>
                  <th style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--body-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 12px', textAlign: 'left' }}>Name</th>
                  <th style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--body-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 12px', textAlign: 'center' }}>Active Cases</th>
                  <th style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--body-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 12px', textAlign: 'center' }}>Avg Contact Time</th>
                </tr>
              </thead>
              <tbody>
                {activeLawyers.slice(0, 10).map(l => (
                  <tr key={l.id}>
                    <td style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--body)', padding: '6px 12px', borderBottom: '1px solid var(--card-bg-tinted)' }}>{l.name}</td>
                    <td style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body)', padding: '6px 12px', textAlign: 'center', borderBottom: '1px solid var(--card-bg-tinted)' }}>{l.activeCases}</td>
                    <td style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body)', padding: '6px 12px', textAlign: 'center', borderBottom: '1px solid var(--card-bg-tinted)' }}>{l.avgContact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}