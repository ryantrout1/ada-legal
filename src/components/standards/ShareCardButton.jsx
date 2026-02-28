import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function ShareCardButton({ href }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const fullUrl = href && href.startsWith('/')
      ? window.location.origin + href
      : href || window.location.href;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Link copied' : 'Copy link to clipboard'}
      title={copied ? 'Link copied!' : 'Share'}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '30px', height: '30px', borderRadius: '7px',
        border: '1px solid var(--slate-200)',
        background: copied ? '#F0FDF4' : 'white',
        color: copied ? '#16A34A' : 'var(--slate-500)',
        cursor: 'pointer', transition: 'all 0.15s',
        position: 'relative', zIndex: 2, flexShrink: 0,
      }}
      onMouseEnter={e => { if (!copied) { e.currentTarget.style.borderColor = '#C2410C'; e.currentTarget.style.color = '#C2410C'; } }}
      onMouseLeave={e => { if (!copied) { e.currentTarget.style.borderColor = 'var(--slate-200)'; e.currentTarget.style.color = 'var(--slate-500)'; } }}
    >
      {copied ? <Check size={14} /> : <Share2 size={14} />}
    </button>
  );
}