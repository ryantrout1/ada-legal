import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function AssignLawyerDropdown({ caseData, approvedLawyers, onAssign, saving }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Filter lawyers by state match and search
  const filtered = approvedLawyers.filter(l => {
    const matchesState = !caseData.state || (l.states_of_practice || []).includes(caseData.state);
    const matchesSearch = !search || l.full_name.toLowerCase().includes(search.toLowerCase()) || (l.firm_name || '').toLowerCase().includes(search.toLowerCase());
    return matchesState && matchesSearch;
  });

  const allLawyers = approvedLawyers.filter(l => {
    if (!search) return true;
    return l.full_name.toLowerCase().includes(search.toLowerCase()) || (l.firm_name || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        disabled={saving}
        aria-label={`Assign lawyer to ${caseData.business_name}`}
        aria-expanded={open}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '4px 10px', minHeight: '36px',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
          color: '#1E3A8A', backgroundColor: 'transparent',
          border: '1.5px solid #1D4ED8', borderRadius: '6px',
          cursor: saving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
          opacity: saving ? 0.5 : 1,
        }}
      >
        Assign → <ChevronDown size={12} />
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', top: '100%', right: 0, marginTop: '4px', zIndex: 50,
            backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)', width: '280px', maxHeight: '300px',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          <div style={{ padding: '8px' }}>
            <input
              type="text"
              placeholder="Search lawyers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              style={{
                width: '100%', padding: '6px 10px', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                border: '1px solid var(--card-border)', borderRadius: '6px', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '220px' }}>
            {filtered.length > 0 && (
              <>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.625rem', fontWeight: 700, color: 'var(--body-secondary)', textTransform: 'uppercase', padding: '4px 12px', margin: 0 }}>
                  Licensed in {caseData.state || 'state'}
                </p>
                {filtered.map(l => (
                  <button
                    key={l.id}
                    onClick={() => { onAssign(caseData, l); setOpen(false); }}
                    aria-label={`Assign ${l.full_name} to ${caseData.business_name}`}
                    style={{
                      width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      padding: '8px 12px', border: 'none', backgroundColor: 'transparent',
                      cursor: 'pointer', textAlign: 'left', minHeight: '36px',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--page-bg-subtle)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--body)' }}>{l.full_name}</span>
                    <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', color: 'var(--body-secondary)' }}>{l.firm_name}</span>
                  </button>
                ))}
              </>
            )}
            {/* Show other lawyers if different from filtered */}
            {allLawyers.filter(l => !filtered.includes(l)).length > 0 && (
              <>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.625rem', fontWeight: 700, color: 'var(--body-secondary)', textTransform: 'uppercase', padding: '8px 12px 4px', margin: 0, borderTop: '1px solid var(--card-bg-tinted)' }}>
                  Other lawyers
                </p>
                {allLawyers.filter(l => !filtered.includes(l)).map(l => (
                  <button
                    key={l.id}
                    onClick={() => { onAssign(caseData, l); setOpen(false); }}
                    aria-label={`Assign ${l.full_name} to ${caseData.business_name}`}
                    style={{
                      width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      padding: '8px 12px', border: 'none', backgroundColor: 'transparent',
                      cursor: 'pointer', textAlign: 'left', minHeight: '36px',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--page-bg-subtle)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--body)' }}>{l.full_name}</span>
                    <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', color: 'var(--body-secondary)' }}>{l.firm_name}</span>
                  </button>
                ))}
              </>
            )}
            {filtered.length === 0 && allLawyers.length === 0 && (
              <p style={{ padding: '12px', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body-secondary)', textAlign: 'center' }}>
                No approved lawyers found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}