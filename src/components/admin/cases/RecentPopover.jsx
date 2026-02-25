import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../../utils';
import { ArrowRight, X } from 'lucide-react';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RecentPopover({ submissions, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (panelRef.current) {
      const first = panelRef.current.querySelector('a, button');
      if (first) first.focus();
    }
  }, []);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Recent submissions"
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '4px',
        width: '340px',
        maxHeight: '320px',
        overflowY: 'auto',
        backgroundColor: 'white',
        border: '1px solid var(--slate-200)',
        borderRadius: '10px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        zIndex: 100,
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderBottom: '1px solid var(--slate-100)',
      }}>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-800)' }}>
          Recent Submissions
        </span>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
            color: 'var(--slate-400)', display: 'flex', minHeight: '44px', minWidth: '44px',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={14} />
        </button>
      </div>

      {submissions.length === 0 ? (
        <div style={{ padding: '16px 12px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#475569', margin: 0 }}>
            No pending submissions
          </p>
        </div>
      ) : (
        <div>
          {submissions.map((c, i) => (
            <div
              key={c.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', gap: '8px',
                borderBottom: i < submissions.length - 1 ? '1px solid var(--slate-100)' : 'none',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
                  color: 'var(--slate-800)', margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {c.business_name || '—'}
                </p>
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', color: 'var(--slate-500)',
                  margin: '1px 0 0',
                }}>
                  {[c.city, c.state].filter(Boolean).join(', ')} · {formatDate(c.submitted_at || c.created_date)}
                </p>
              </div>
              <Link
                to={createPageUrl('AdminReview') + `?id=${c.id}`}
                aria-label={`Review case for ${c.business_name || 'unknown business'}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                  color: 'var(--terra-600)', textDecoration: 'none', flexShrink: 0,
                  minHeight: '44px', padding: '0 4px',
                }}
              >
                Review <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 480px) {
          [role="dialog"][aria-label="Recent submissions"] {
            position: fixed !important;
            top: auto !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            border-radius: 12px 12px 0 0 !important;
            max-height: 60vh !important;
          }
        }
      `}</style>
    </div>
  );
}