import React from 'react';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994acc34810e36068eddec2/64a69db3b_image.png';

export default function LogoBrand({ size = 32, variant = 'dark', style = {}, className = '', ...props }) {
  const filterStyle = variant === 'light'
    ? { filter: 'invert(1) brightness(1.8) sepia(1) hue-rotate(-10deg) saturate(3)' }
    : {};

  return (
    <img
      src={LOGO_URL}
      alt="ADA Legal Link logo"
      width={size}
      height={size}
      style={{ ...filterStyle, ...style, objectFit: 'contain' }}
      className={className}
      {...props}
    />
  );
}