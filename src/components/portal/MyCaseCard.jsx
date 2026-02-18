import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Building2, Globe, MapPin, Calendar } from 'lucide-react';
import CaseStatusBadge from './CaseStatusBadge';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MyCaseCard({ caseData }) {
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';

  return (
    <Link
      to={createPageUrl('CaseDetail') + `?id=${c.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--slate-200)',
          borderRadius: '12px',
          padding: 'var(--space-lg)',
          transition: 'box-shadow 0.15s, border-color 0.15s',
          cursor: 'pointer'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
          e.currentTarget.style.borderColor = 'var(--slate-300)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'var(--slate-200)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', flexShrink: 0,
              backgroundColor: isPhysical ? '#DBEAFE' : '#F3E8FF'
            }}>
              {isPhysical
                ? <Building2 size={18} aria-hidden="true" style={{ color: '#1D4ED8' }} />
                : <Globe size={18} aria-hidden="true" style={{ color: '#7C3AED' }} />
              }
            </span>
            <div style={{ minWidth: 0 }}>
              <h3 style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700,
                color: 'var(--slate-900)', margin: 0, overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {c.business_name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)'
                }}>
                  <MapPin size={13} /> {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)'
                }}>
                  <Calendar size={13} /> {formatDate(c.submitted_at || c.created_date)}
                </span>
              </div>
            </div>
          </div>
          <CaseStatusBadge status={c.status} />
        </div>
      </div>
    </Link>
  );
}