import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

function daysSince(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function hoursSince(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60));
}

export default function NeedsAttentionSection({ unclaimed, awaitingContact, lawyerMap }) {
  const [open, setOpen] = useState(true);
  const total = unclaimed.length + awaitingContact.length;

  if (total === 0) return null;

  return (
    <div role="alert" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', minHeight: '44px', border: 'none', backgroundColor: 'transparent',
          cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700,
          color: '#92400E', textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} /> {total} case{total !== 1 ? 's' : ''} need attention
        </span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          {/* Unclaimed too long */}
          {unclaimed.length > 0 && (
            <div style={{ marginBottom: awaitingContact.length > 0 ? '16px' : 0 }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', margin: '0 0 8px' }}>
                Unclaimed too long ({unclaimed.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {unclaimed.map(c => {
                  const days = daysSince(c.approved_at || c.created_date);
                  return (
                    <div key={c.id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                      padding: '8px 12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #FDE68A',
                      minHeight: '44px',
                    }}>
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-800)', flex: '1 1 140px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.business_name}
                      </span>
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        {c.violation_type === 'physical_space' ? '🏢' : '🌐'} {c.business_type}
                      </span>
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        {[c.city, c.state].filter(Boolean).join(', ')}
                      </span>
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: days >= 14 ? '#B91C1C' : '#D97706' }}>
                        Available for {days}d
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Awaiting lawyer contact */}
          {awaitingContact.length > 0 && (
            <div>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase', margin: '0 0 8px' }}>
                Awaiting lawyer contact ({awaitingContact.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {awaitingContact.map(c => {
                  const hrs = hoursSince(c.assigned_at);
                  const lawyer = c.assigned_lawyer_id ? lawyerMap[c.assigned_lawyer_id] : null;
                  return (
                    <div key={c.id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                      padding: '8px 12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #FDE68A',
                      minHeight: '44px',
                    }}>
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-800)', flex: '1 1 140px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.business_name}
                      </span>
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        {c.violation_type === 'physical_space' ? '🏢' : '🌐'} {c.business_type}
                      </span>
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-600)' }}>
                        Assigned to {lawyer ? lawyer.full_name : 'Unknown'}
                      </span>
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#B91C1C' }}>
                        ⚠️ Assigned {hrs}h ago — no contact
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}