import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { LogOut, BarChart3, Mail } from 'lucide-react';

export default function UserAvatarMenu({ user, onLogout, extraMenuItems = [] }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  const initial = (user?.full_name?.[0] || user?.email?.[0] || '?').toUpperCase();
  const displayEmail = user?.email || '';

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !btnRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !menuRef.current) return;
    const first = menuRef.current.querySelector('[role="menuitem"]');
    if (first) first.focus();
  }, [open]);

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        aria-label={`User menu for ${displayEmail}`}
        aria-expanded={open}
        aria-haspopup="menu"
        title={displayEmail}
        style={{
          width: '32px', height: '32px', borderRadius: '50%',
          backgroundColor: '#C2410C', color: 'white',
          border: 'none', cursor: 'pointer',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'filter 0.15s',
          minWidth: '32px', minHeight: '32px',
        }}
        onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.2)'}
        onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
      >
        {initial}
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="User menu"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            minWidth: '200px', backgroundColor: 'white',
            border: '1px solid #E2E8F0', borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            zIndex: 1000, overflow: 'hidden',
          }}
        >
          <div style={{
            padding: '10px 14px',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: '#64748B',
            borderBottom: '1px solid #E2E8F0',
            wordBreak: 'break-all',
          }}>
            {displayEmail}
          </div>
          {extraMenuItems.map((item, i) => (
            <Link
              key={i}
              role="menuitem"
              tabIndex={0}
              to={item.to}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                padding: '0 14px', minHeight: '44px',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600,
                color: '#334155', backgroundColor: 'transparent', border: 'none',
                cursor: 'pointer', textAlign: 'left', textDecoration: 'none',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {item.icon} {item.label}
            </Link>
          ))}
          {extraMenuItems.length > 0 && (
            <div style={{ borderTop: '1px solid #E2E8F0' }} />
          )}
          <button
            role="menuitem"
            tabIndex={0}
            onClick={() => { setOpen(false); onLogout(); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(false); onLogout(); } }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
              padding: '0 14px', minHeight: '44px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600,
              color: '#334155', backgroundColor: 'transparent', border: 'none',
              cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}