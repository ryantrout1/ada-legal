import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange }) {
  const [local, setLocal] = useState(value || '');
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { setLocal(value || ''); }, [value]);

  const emit = (v) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), 300);
  };

  const handleChange = (e) => {
    setLocal(e.target.value);
    emit(e.target.value);
  };

  const handleClear = () => {
    setLocal('');
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      clearTimeout(timerRef.current);
      onChange(local);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <label htmlFor="qc-search" className="sr-only">Search cases</label>
      <Search size={18} style={{
        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
        color: '#94A3B8', pointerEvents: 'none',
      }} aria-hidden="true" />
      <input
        ref={inputRef}
        id="qc-search"
        type="search"
        aria-label="Search cases"
        placeholder="Search by business name, city, case ID, or keyword..."
        value={local}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%', minHeight: '44px', padding: '10px 42px 10px 42px',
          fontFamily: 'Manrope, sans-serif', fontSize: '1rem', color: 'var(--slate-800)',
          border: '1px solid var(--slate-300)', borderRadius: '10px',
          backgroundColor: 'white', boxSizing: 'border-box',
        }}
      />
      {local && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          style={{
            position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
            color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center',
            minWidth: '32px', minHeight: '32px', borderRadius: '6px',
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}