import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export default function SearchableDropdown({ label, id, options, selected, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase()) ||
    o.value.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (val) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  };

  const removeItem = (val) => {
    onChange(selected.filter(v => v !== val));
  };

  const buttonLabel = selected.length === 0
    ? (placeholder || `All ${label}`)
    : `${selected.length} selected`;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <label style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--body-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
        {label}
      </label>
      <button
        type="button"
        id={id}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{
          width: '100%',
          minHeight: '44px',
          padding: '8px 12px',
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: selected.length > 0 ? 'var(--body)' : 'var(--body-secondary)',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          textAlign: 'left',
        }}
      >
        <span>{buttonLabel}</span>
        <ChevronDown size={16} style={{ color: 'var(--body-secondary)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {/* Selected pills */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
          {selected.map(val => {
            const opt = options.find(o => o.value === val);
            return (
              <span key={val} style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '2px 8px 2px 10px', borderRadius: '100px',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                backgroundColor: 'var(--card-bg-tinted)', color: 'var(--body)',
                border: '1px solid var(--card-border)',
              }}>
                {opt?.label || val}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeItem(val); }}
                  aria-label={`Remove ${opt?.label || val}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', color: 'var(--body-secondary)' }}
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          marginTop: selected.length > 0 ? '4px' : '4px',
          backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          maxHeight: '280px', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Search input */}
          <div style={{ padding: '8px', borderBottom: '1px solid var(--card-bg-tinted)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--body-secondary)' }} />
              <input
                ref={searchRef}
                type="text"
                aria-label={`Search ${label}`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}…`}
                style={{
                  width: '100%', padding: '8px 10px 8px 30px',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                  border: '1px solid var(--card-border)', borderRadius: '8px',
                  backgroundColor: 'var(--page-bg-subtle)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
          {/* Options list */}
          <div role="listbox" aria-label={label} style={{ overflowY: 'auto', padding: '4px' }}>
            {filtered.length === 0 && (
              <p style={{ padding: '12px', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body-secondary)', textAlign: 'center', margin: 0 }}>
                No matches
              </p>
            )}
            {filtered.map(o => {
              const checked = selected.includes(o.value);
              return (
                <button
                  key={o.value}
                  role="option"
                  aria-selected={checked}
                  onClick={() => toggle(o.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', padding: '8px 10px', minHeight: '40px',
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                    color: 'var(--body)', backgroundColor: checked ? 'var(--page-bg-subtle)' : 'transparent',
                    border: 'none', borderRadius: '6px', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{
                    width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                    border: checked ? '2px solid var(--body)' : '2px solid var(--card-border)',
                    backgroundColor: checked ? 'var(--body)' : 'var(--card-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--card-bg)', fontSize: '0.625rem', fontWeight: 800,
                  }}>
                    {checked && '✓'}
                  </span>
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}