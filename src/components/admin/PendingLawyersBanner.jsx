import React from 'react';
import { UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PendingLawyersBanner({ lawyers }) {
  if (!lawyers || lawyers.length === 0) return null;

  return (
    <div style={{
      backgroundColor: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--space-md)' }}>
        <UserPlus size={18} style={{ color: '#7C3AED' }} />
        <h3 style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700,
          color: '#7C3AED', margin: 0
        }}>
          New Lawyer Applications ({lawyers.length})
        </h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {lawyers.slice(0, 5).map(l => (
          <div key={l.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: '#F3E8FF', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem'
          }}>
            <div>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--heading)'
              }}>{l.full_name}</span>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body-secondary)', marginLeft: '0.5rem'
              }}>
                {l.firm_name}
              </span>
            </div>
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
              color: '#7C3AED', whiteSpace: 'nowrap'
            }}>
              Applied {formatDate(l.created_date)}
            </span>
          </div>
        ))}
        {lawyers.length > 5 && (
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
            color: '#7C3AED', margin: '0.25rem 0 0 0', fontStyle: 'italic'
          }}>
            …and {lawyers.length - 5} more
          </p>
        )}
      </div>
    </div>
  );
}