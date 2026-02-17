import React from 'react';
import { Timer } from 'lucide-react';
import { createPageUrl } from '../../utils';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function hoursAgo(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60));
}

export default function UnclaimedCasesBanner({ cases }) {
  if (!cases || cases.length === 0) return null;

  return (
    <div style={{
      backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--space-md)' }}>
        <Timer size={18} style={{ color: '#92400E' }} />
        <h3 style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700,
          color: '#92400E', margin: 0
        }}>
          Unclaimed 72hrs+ ({cases.length})
        </h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {cases.slice(0, 5).map(c => (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: '#FEF3C7', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem'
          }}>
            <div>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: '#1E293B'
              }}>{c.business_name}</span>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#64748B', marginLeft: '0.5rem'
              }}>
                {[c.city, c.state].filter(Boolean).join(', ')}
              </span>
            </div>
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
              color: '#92400E', whiteSpace: 'nowrap'
            }}>
              {hoursAgo(c.approved_at)}h unclaimed
            </span>
          </div>
        ))}
        {cases.length > 5 && (
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
            color: '#92400E', margin: '0.25rem 0 0 0', fontStyle: 'italic'
          }}>
            …and {cases.length - 5} more
          </p>
        )}
      </div>
    </div>
  );
}