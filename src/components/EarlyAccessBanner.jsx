import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useComingSoon } from './useComingSoonModal';

const DISMISSED_KEY = 'early_access_banner_dismissed';

export default function EarlyAccessBanner() {
  const { openModal } = useComingSoon();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISSED_KEY) === '1');

  if (dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  return (
    <div
      role="banner"
      aria-label="Early access announcement"
      style={{
        background: '#C2410C',
        color: 'white',
        fontFamily: 'Manrope, sans-serif',
        fontSize: '0.875rem',
        fontWeight: 500,
        textAlign: 'center',
        padding: '10px 48px 10px 16px',
        position: 'relative',
        lineHeight: 1.5,
      }}
    >
      🚀 Early Access — Explore the ADA Standards Guide while we prepare to launch full reporting.{' '}
      <button
        onClick={() => openModal('report_violation')}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          textDecoration: 'underline',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          fontWeight: 700,
          cursor: 'pointer',
          padding: 0,
        }}
      >
        Share your feedback!
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.85)',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '28px',
          minHeight: '28px',
          borderRadius: '4px',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        <X size={16} />
      </button>
    </div>
  );
}