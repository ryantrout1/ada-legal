import React from 'react';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994acc34810e36068eddec2/96059e9a4_ADALL-logo-transparent.png';

export default function LogoBrand({ size = 32, style = {}, className = '', ...props }) {
  return (
    <img
      src={LOGO_URL}
      alt="ADA Legal Link logo"
      width={size}
      height={size}
      style={{ objectFit: 'contain', ...style }}
      className={className}
      {...props}
    />
  );
}