import React from 'react';
import { Building2, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

function formatDuration(dateStr) {
  if (!dateStr) return '—';
  const hrs = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60));
  if (hrs < 72) return `${hrs}h unclaimed`;
  const days = Math.round(hrs / 24);
  return `${days} day${days !== 1 ? 's' : ''} unclaimed`;
}

export default function CompactUnclaimedSection({ cases }) {
  if (!cases || cases.length === 0) {
    return (
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#475569', margin: 0 }}>
        No unclaimed cases over 72 hours.
      </p>

    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden'
    }}>
      {cases.map((c, i) => {
        const isPhysical = c.violation_type === 'physical_space';
        return (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '8px 12px',
            borderBottom: i < cases.length - 1 ? '1px solid var(--slate-100)' : 'none',
            backgroundColor: 'transparent'
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '24px', height: '24px', borderRadius: '4px', flexShrink: 0,
              backgroundColor: isPhysical ? '#DBEAFE' : '#F3E8FF'
            }}>
              {isPhysical
                ? <Building2 size={12} style={{ color: '#1D4ED8' }} />
                : <Globe size={12} style={{ color: '#7C3AED' }} />
              }
            </span>
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
              color: 'var(--slate-800)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>{c.business_name}</span>
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: '#475569',
              whiteSpace: 'nowrap', flexShrink: 0
            }}>{[c.city, c.state].filter(Boolean).join(', ')}</span>
            <span style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: '9999px', flexShrink: 0,
              fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
              backgroundColor: isPhysical ? '#DBEAFE' : '#F3E8FF',
              color: isPhysical ? '#1D4ED8' : '#7C3AED'
            }}>
              {isPhysical ? 'Physical' : 'Digital'}
            </span>
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
              color: '#92400E', whiteSpace: 'nowrap', flexShrink: 0
            }}>{formatDuration(c.approved_at)}</span>
            <Link
              to={createPageUrl('AdminCases') + `?search=${encodeURIComponent(c.business_name)}`}
              style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                color: 'var(--terra-600)', textDecoration: 'none', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: '2px', flexShrink: 0
              }}
            >
              View <ArrowRight size={12} />
            </Link>
          </div>
        );
      })}
    </div>
  );
}