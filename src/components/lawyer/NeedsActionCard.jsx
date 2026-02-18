import React from 'react';
import { Building2, Globe, Clock, AlertTriangle } from 'lucide-react';
import ClaimantContactCard from './ClaimantContactCard';
import CaseSummaryGrid from './CaseSummaryGrid';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function NeedsActionCard({ caseData, onLogContact, onResolve, highlighted }) {
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';
  const hoursSinceAssign = c.assigned_at ? Math.round((Date.now() - new Date(c.assigned_at).getTime()) / (1000 * 60 * 60)) : 0;
  const overdue = hoursSinceAssign > 24;
  const daysOverdue = Math.floor((hoursSinceAssign - 24) / 24);

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: highlighted ? '2px solid #16A34A' : '1px solid var(--slate-200)',
      borderLeft: '4px solid #B91C1C', borderRadius: '12px', padding: '0', overflow: 'hidden',
      boxShadow: highlighted ? '0 0 0 3px rgba(22,163,74,0.2)' : 'none'
    }}>
      {/* Header bar */}
      <div style={{
        backgroundColor: '#FEE2E2', padding: '12px 20px',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {overdue ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: '#B91C1C'
            }}>
              <AlertTriangle size={14} />
              OVERDUE — {hoursSinceAssign > 72 ? `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} past deadline` : `${hoursSinceAssign - 24}h past deadline`}
            </span>
          ) : (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#B45309'
            }}>
              <Clock size={14} />
              {24 - hoursSinceAssign} hours remaining
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <ClaimantContactCard caseData={c} urgent />

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
          >Log Contact</button>
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