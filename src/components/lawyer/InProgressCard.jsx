import React from 'react';
import { Building2, Globe, Phone, Mail, Users, MoreHorizontal } from 'lucide-react';
import ClaimantContactCard from './ClaimantContactCard';
import CaseSummaryGrid from './CaseSummaryGrid';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const METHOD_LABELS = { phone: 'Phone', email: 'Email', in_person: 'In Person', other: 'Other' };
const TYPE_LABELS = { initial_contact: 'Initial Contact', follow_up: 'Follow-Up', case_update: 'Case Update' };
const METHOD_ICONS = { phone: Phone, email: Mail, in_person: Users, other: MoreHorizontal };

export default function InProgressCard({ caseData, contactLogs, onLogContact, onResolve }) {
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';
  const sorted = [...contactLogs].sort((a, b) => new Date(b.logged_at || b.created_date) - new Date(a.logged_at || a.created_date));
  const lastLog = sorted[0];

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
      borderLeft: '4px solid #15803D', borderRadius: '12px', overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#DCFCE7', padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 600, color: 'var(--slate-900)' }}>
            {c.business_name}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '2px 10px', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 700,
            backgroundColor: isPhysical ? 'var(--terra-100, #FEF1EC)' : '#DBEAFE',
            color: isPhysical ? 'var(--terra-600, #C2410C)' : '#1D4ED8'
          }}>
            {isPhysical ? <Building2 size={11} /> : <Globe size={11} />}
            {isPhysical ? 'Physical' : 'Digital'}
          </span>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-600)' }}>
            {[c.city, c.state].filter(Boolean).join(', ')}
          </span>
        </div>
        {lastLog && (
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#15803D' }}>
            Last contact: {formatDate(lastLog.logged_at || lastLog.created_date)} via {METHOD_LABELS[lastLog.contact_method] || lastLog.contact_method}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <ClaimantContactCard caseData={c} urgent={false} />

        <CaseSummaryGrid caseData={c} />

        {/* Narrative */}
        <div style={{
          borderLeft: '3px solid var(--terra-600, #C2410C)',
          backgroundColor: '#FFF8F5', borderRadius: '0 10px 10px 0', padding: '16px'
        }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-900)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
            {c.narrative || '—'}
          </p>
        </div>

        {/* Contact History Timeline */}
        {sorted.length > 0 && (
          <div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 8px' }}>
              Contact History
            </p>
            <div style={{ position: 'relative', paddingLeft: '20px' }}>
              {/* Vertical line */}
              <div style={{ position: 'absolute', left: '7px', top: '4px', bottom: '4px', width: '2px', backgroundColor: 'var(--slate-200)' }} />
              {sorted.map((log, i) => {
                const Icon = METHOD_ICONS[log.contact_method] || MoreHorizontal;
                return (
                  <div key={log.id} style={{ position: 'relative', marginBottom: i < sorted.length - 1 ? '8px' : 0, display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{
                      position: 'absolute', left: '-16px', top: '4px',
                      width: '12px', height: '12px', borderRadius: '50%',
                      backgroundColor: 'var(--surface)', border: '2px solid #15803D',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#15803D' }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                        {TYPE_LABELS[log.contact_type] || log.contact_type}
                      </span>
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        via {METHOD_LABELS[log.contact_method] || log.contact_method}
                      </span>
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-400)', marginLeft: 'auto' }}>
                        {formatDateTime(log.logged_at || log.created_date)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => onLogContact(c)} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '0 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
            fontWeight: 700, color: 'white', backgroundColor: 'var(--terra-600)',
            border: 'none', borderRadius: '10px', cursor: 'pointer', minHeight: '44px',
            transition: 'background-color 0.15s'
          }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--terra-700)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--terra-600)'; }}
          >Log Follow-Up</button>
          <button type="button" onClick={() => onResolve(c)} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '0 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
            fontWeight: 700, color: 'var(--slate-600)', backgroundColor: 'transparent',
            border: '1px solid var(--slate-300)', borderRadius: '10px', cursor: 'pointer', minHeight: '44px'
          }}>Resolve Case</button>
        </div>
      </div>
    </div>
  );
}