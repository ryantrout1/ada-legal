import React, { useState } from 'react';
import { Building2, Globe, CheckCircle, AlertTriangle, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../../utils';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ActiveCasesSection({ lawyer, cases, contactLogs }) {
  const active = cases.filter(c =>
    c.assigned_lawyer_id === lawyer.id && (c.status === 'assigned' || c.status === 'in_progress')
  );
  const [open, setOpen] = useState(active.length > 0);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: open ? '8px' : 0
        }}
      >
        {open ? <ChevronDown size={14} style={{ color: '#475569' }} /> : <ChevronRight size={14} style={{ color: '#475569' }} />}
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
          Active Cases ({active.length})
        </p>
      </button>

      {open && (
        active.length === 0 ? (
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#475569', margin: '4px 0 0 20px' }}>
            No active cases.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {active.map(c => {
              const isPhysical = c.violation_type === 'physical_space';
              const hasContact = contactLogs.some(l => l.case_id === c.id);
              const hoursSinceAssign = c.assigned_at ? Math.round((Date.now() - new Date(c.assigned_at).getTime()) / (1000 * 60 * 60)) : 0;
              const overdue = !hasContact && hoursSinceAssign > 24;
              const remaining = !hasContact && hoursSinceAssign <= 24 ? 24 - hoursSinceAssign : 0;
              const daysSince = c.assigned_at ? Math.round((Date.now() - new Date(c.assigned_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;

              return (
                <Link
                  key={c.id}
                  to={createPageUrl('AdminCases') + `?search=${c.id?.slice(0, 8)}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                    padding: '8px 12px', textDecoration: 'none',
                    backgroundColor: 'white', border: '1px solid var(--slate-200)',
                    borderRadius: '8px', transition: 'background-color 0.15s',
                    minHeight: '44px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--slate-50)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                >
                  {isPhysical
                    ? <Building2 size={14} style={{ color: '#C2410C' }} />
                    : <Globe size={14} style={{ color: '#1E3A8A' }} />
                  }
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: '#334155', flex: 1, minWidth: '120px' }}>
                    {c.business_name}
                  </span>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#475569' }}>
                    {[c.city, c.state].filter(Boolean).join(', ')}
                  </span>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: '#475569' }}>
                    {daysSince}d ago
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {hasContact ? (
                      <>
                        <CheckCircle size={14} style={{ color: '#15803D' }} />
                        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#15803D' }}>Contacted</span>
                      </>
                    ) : overdue ? (
                      <>
                        <AlertTriangle size={14} style={{ color: '#B91C1C' }} />
                        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#B91C1C' }}>
                          {hoursSinceAssign - 24}h overdue
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock size={14} style={{ color: '#92400E' }} />
                        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#92400E' }}>
                          {remaining}h left
                        </span>
                      </>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}