import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../../utils';
import { X } from 'lucide-react';

export default function LawyerAlertsPopover({ overdueContacts, lawyerMap, onClose }) {
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
      aria-label="Lawyer alerts"
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '4px',
        width: '360px',
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
          Overdue Contact
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

      {overdueContacts.length === 0 ? (
        <div style={{ padding: '16px 12px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#15803D', margin: 0, fontWeight: 600 }}>
            ✓ All lawyers have made timely contact
          </p>
        </div>
      ) : (
        <div>
          {overdueContacts.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
                padding: '8px 12px',
                borderBottom: i < overdueContacts.length - 1 ? '1px solid var(--slate-100)' : 'none',
                backgroundColor: item.hoursOverdue >= 48 ? '#FFF5F5' : 'transparent',
              }}
            >
              <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
                  color: 'var(--slate-800)', margin: 0,
                }}>
                  {item.lawyerName} <span style={{ fontWeight: 400, color: 'var(--slate-500)' }}>→ {item.caseName}</span>
                </p>
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
                  color: '#B91C1C', margin: '1px 0 0',
                }}>
                  {item.hoursOverdue}h overdue
                </p>
              </div>
              <Link
                to={createPageUrl('AdminCases') + `?search=${encodeURIComponent(item.caseName)}`}
                aria-label={`View case for ${item.caseName}`}
                style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                  color: 'var(--terra-600)', textDecoration: 'none', flexShrink: 0,
                  minHeight: '44px', display: 'inline-flex', alignItems: 'center', padding: '0 4px',
                }}
              >
                View
              </Link>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 480px) {
          [role="dialog"][aria-label="Lawyer alerts"] {
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