import React from 'react';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994acc34810e36068eddec2/2b7a73622_image11.png';

export default function LogoBrand({ size = 32, glow = false, style = {}, className = '', ...props }) {
  const glowStyle = glow
    ? { filter: 'drop-shadow(0 0 8px rgba(194,65,12,0.5)) drop-shadow(0 0 20px rgba(194,65,12,0.25))' }
    : {};

  return (
    <img
      src={LOGO_URL}
      alt="ADA Legal Link logo"
      width={size}
      height={size}
      style={{ objectFit: 'contain', mixBlendMode: 'lighten', ...glowStyle, ...style }}
      className={className}
      {...props}
    />
  );
}