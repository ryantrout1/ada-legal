import React from 'react';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994acc34810e36068eddec2/64a69db3b_image.png';

export default function LogoBrand({ size = 32, glow = false, variant = 'dark', style = {}, className = '', ...props }) {
  const filterParts = [];

  // For light/header variant: tint the black logo to terracotta/gold
  if (variant === 'light') {
    filterParts.push('invert(1) brightness(1.8) sepia(1) hue-rotate(-10deg) saturate(3)');
  }

  // Glow effect: terracotta drop-shadow halo
  if (glow) {
    filterParts.push('drop-shadow(0 0 8px rgba(194,65,12,0.5)) drop-shadow(0 0 20px rgba(194,65,12,0.25))');
  }

  const filterStyle = filterParts.length > 0 ? { filter: filterParts.join(' ') } : {};

  return (
    <img
      src={LOGO_URL}
      alt="ADA Legal Link logo"
      width={size}
      height={size}
      style={{ objectFit: 'contain', ...filterStyle, ...style }}
      className={className}
      {...props}
    />
  );
}