import React, { useMemo } from 'react';
import { Flag, Mail, Phone, CheckCircle, AlertTriangle, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import LawyerBadge, { accountColors, subColors } from './LawyerBadge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../../utils';

const LABEL = { fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 2px' };
const VAL = { margin: 0, fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#334155' };

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AttorneyExpandedPanel({ lawyer, cases, contactLogs, actionButtons }) {
  const { myCases, closed, inProgress, assigned, recentTimeline, compliance30, complianceAll, trend } = useMemo(() => {
    const mc = cases.filter(c => c.assigned_lawyer_id === lawyer.id);
    const cl = mc.filter(c => c.status === 'closed').length;
    const ip = mc.filter(c => c.status === 'in_progress').length;
    const as = mc.filter(c => c.status === 'assigned').length;

    // Recent 5 assignments timeline
    const withAssign = mc.filter(c => c.assigned_at).sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at)).slice(0, 5);
    const timeline = withAssign.map(c => {
      const logs = contactLogs.filter(l => l.case_id === c.id && l.lawyer_id === lawyer.id);
      const hasContact = logs.length > 0;
      let contactHrs = null;
      if (hasContact) {
        const earliest = Math.min(...logs.map(l => new Date(l.logged_at || l.created_date).getTime()));
        contactHrs = Math.round((earliest - new Date(c.assigned_at).getTime()) / 3600000);
      }
      const hoursSince = (Date.now() - new Date(c.assigned_at).getTime()) / 3600000;
      const overdue = !hasContact && hoursSince > 24;
      return { id: c.id, business: c.business_name, assignedAt: c.assigned_at, hasContact, contactHrs, overdue, status: c.status };
    });

    // Compliance calculations
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const recent = mc.filter(c => c.assigned_at && new Date(c.assigned_at) >= thirtyDaysAgo);
    const all = mc.filter(c => c.assigned_at);

    const calcCompliance = (list) => {
      if (list.length === 0) return null;
      const compliant = list.filter(c => {
        const deadline = new Date(new Date(c.assigned_at).getTime() + 86400000);
        return contactLogs.some(l => l.case_id === c.id && l.contact_type === 'initial_contact' && new Date(l.logged_at || l.created_date) <= deadline);
      }).length;
      return Math.round((compliant / list.length) * 100);
    };

    const c30 = calcCompliance(recent);
    const cAll = calcCompliance(all);
    let t = 'stable';
    if (c30 !== null && cAll !== null) {
      if (c30 > cAll + 5) t = 'improving';
      else if (c30 < cAll - 5) t = 'declining';
    }

    return { myCases: mc, closed: cl, inProgress: ip, assigned: as, recentTimeline: timeline, compliance30: c30, complianceAll: cAll, trend: t };
  }, [lawyer, cases, contactLogs]);

  const totalBar = closed + inProgress + assigned || 1;

  return (
    <div className="attorney-expanded-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      {/* LEFT: Profile */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ backgroundColor: 'var(--slate-50)', borderRadius: '10px', padding: '16px' }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 12px' }}>Profile & Contact</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div><p style={LABEL}>Full Name</p><p style={{ ...VAL, fontWeight: 700 }}>{lawyer.full_name}</p></div>
            <div><p style={LABEL}>Firm</p><p style={VAL}>{lawyer.firm_name}</p></div>
            <div>
              <p style={LABEL}>Email</p>
              <a href={`mailto:${lawyer.email}`} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--terra-600)' }}>{lawyer.email}</a>
            </div>
            <div>
              <p style={LABEL}>Phone</p>
              <p style={VAL}>{lawyer.phone || '—'}</p>
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <p style={LABEL}>States of Practice</p>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
              {(lawyer.states_of_practice || []).map(s => (
                <span key={s} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#7C2D12', backgroundColor: '#FEF1EC' }}>{s}</span>
              ))}
              {(lawyer.states_of_practice || []).length === 0 && <p style={VAL}>—</p>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
            <div><p style={LABEL}>Bar Numbers</p><p style={VAL}>{lawyer.bar_numbers || '—'}</p></div>
            <div><p style={LABEL}>Marketplace Rules</p><p style={{ ...VAL, color: lawyer.marketplace_rules_accepted ? '#15803D' : '#B91C1C', fontWeight: 600 }}>{lawyer.marketplace_rules_accepted ? '✓ Accepted' : '✗ Not Accepted'}</p></div>
            <div><p style={LABEL}>Account Created</p><p style={VAL}>{formatDate(lawyer.created_date)}</p></div>
            <div><p style={LABEL}>Approved</p><p style={VAL}>{formatDate(lawyer.approved_at)}</p></div>
          </div>

          {lawyer.flagged && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', padding: '8px 12px', backgroundColor: '#FEE2E2', borderRadius: '8px' }}>
              <Flag size={14} style={{ color: '#B91C1C' }} />
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#B91C1C' }}>
                Flagged: {lawyer.flag_reason || 'No reason given'}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ borderTop: '1px solid var(--slate-200)', paddingTop: '12px' }}>
          {actionButtons}
        </div>
      </div>

      {/* RIGHT: Performance */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Cases breakdown bar */}
        <div style={{ backgroundColor: 'var(--slate-50)', borderRadius: '10px', padding: '16px' }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 8px' }}>Cases Breakdown</p>
          <div style={{ display: 'flex', height: '24px', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--slate-200)' }}>
            {closed > 0 && <div style={{ width: `${(closed / totalBar) * 100}%`, backgroundColor: '#16A34A', transition: 'width 0.3s' }} title={`${closed} closed`} />}
            {inProgress > 0 && <div style={{ width: `${(inProgress / totalBar) * 100}%`, backgroundColor: '#2563EB', transition: 'width 0.3s' }} title={`${inProgress} in progress`} />}
            {assigned > 0 && <div style={{ width: `${(assigned / totalBar) * 100}%`, backgroundColor: '#D97706', transition: 'width 0.3s' }} title={`${assigned} assigned`} />}
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem' }}>
            <span style={{ color: '#15803D', fontWeight: 600 }}>● {closed} closed</span>
            <span style={{ color: '#1E3A8A', fontWeight: 600 }}>● {inProgress} active</span>
            <span style={{ color: '#92400E', fontWeight: 600 }}>● {assigned} assigned</span>
          </div>
        </div>

        {/* Response timeline */}
        <div style={{ backgroundColor: 'var(--slate-50)', borderRadius: '10px', padding: '16px' }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 8px' }}>Recent Assignments</p>
          {recentTimeline.length === 0 ? (
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)' }}>No assignments yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {recentTimeline.map(t => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px',
                  backgroundColor: t.overdue ? '#FEF2F2' : 'white', borderRadius: '6px',
                  border: '1px solid var(--slate-200)', flexWrap: 'wrap',
                }}>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-900)', flex: '1 1 120px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.business}
                  </span>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', color: 'var(--slate-500)' }}>
                    {formatDate(t.assignedAt)}
                  </span>
                  {t.hasContact ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 600, color: t.contactHrs <= 24 ? '#15803D' : '#92400E' }}>
                      <CheckCircle size={12} /> {t.contactHrs}h
                    </span>
                  ) : t.overdue ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: '#B91C1C' }}>
                      <AlertTriangle size={12} /> Overdue
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', color: '#92400E' }}>
                      <Clock size={12} /> Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compliance trend + subscription */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ backgroundColor: 'var(--slate-50)', borderRadius: '10px', padding: '16px' }}>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 8px' }}>Contact Compliance</p>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-700)' }}>
              <p style={{ margin: '0 0 4px' }}>Last 30 days: <strong>{compliance30 !== null ? compliance30 + '%' : '—'}</strong></p>
              <p style={{ margin: '0 0 4px' }}>All time: <strong>{complianceAll !== null ? complianceAll + '%' : '—'}</strong></p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                {trend === 'improving' && <><TrendingUp size={14} style={{ color: '#15803D' }} /><span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803D' }}>Improving</span></>}
                {trend === 'declining' && <><TrendingDown size={14} style={{ color: '#B91C1C' }} /><span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B91C1C' }}>Declining</span></>}
                {trend === 'stable' && <><Minus size={14} style={{ color: 'var(--slate-500)' }} /><span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)' }}>Stable</span></>}
              </div>
            </div>
          </div>
          <div style={{ backgroundColor: 'var(--slate-50)', borderRadius: '10px', padding: '16px' }}>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 8px' }}>Subscription</p>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-700)' }}>
              <p style={{ margin: '0 0 4px' }}>Status: <LawyerBadge label={lawyer.subscription_status} colorMap={subColors} /></p>
              <p style={{ margin: '4px 0 0' }}>Member since: {formatDate(lawyer.date_joined)}</p>
              {lawyer.subscription_status === 'past_due' && (
                <p style={{ margin: '4px 0 0', fontWeight: 700, color: '#B91C1C', fontSize: '0.75rem' }}>
                  ⚠️ Payment overdue
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .attorney-expanded-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}