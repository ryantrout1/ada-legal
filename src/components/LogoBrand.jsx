import React from 'react';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994acc34810e36068eddec2/96059e9a4_ADALL-logo-transparent.png';

export default function LogoBrand({ size = 32, glow = false, variant = 'auto', style = {}, className = '', ...props }) {
  const glowStyle = glow
    ? { filter: 'drop-shadow(0 0 8px rgba(194,65,12,0.5)) drop-shadow(0 0 20px rgba(194,65,12,0.25))' }
    : {};

  const lightBgStyle = variant === 'light-bg'
    ? { filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.18)) drop-shadow(0 0 6px rgba(0,0,0,0.10))' }
    : {};

  return (
    <img
      src={LOGO_URL}
      alt="ADA Legal Link logo"
      width={size}
      height={size}
      style={{ objectFit: 'contain', ...glowStyle, ...lightBgStyle, ...style }}
      className={className}
      {...props}
    />
  );
}