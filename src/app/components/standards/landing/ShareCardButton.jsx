/**
 * ShareCardButton — ported from Base44 (src/components/standards/ShareCardButton.jsx
 * @ 6b1e9ac) for M2 Phase 3. Design authority is B44; the changes here
 * are confined to the port seams:
 *   - Base44 flat routing (createPageUrl) → b44PageToRoute
 *   - Base44 SDK / analytics imports removed (M5)
 * Visual output is unchanged; tokens resolve through the alias layer in
 * app.css at the AAA-corrected values.
 */

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
      className="sg-share-btn"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '44px', height: '44px', borderRadius: '7px',
        border: '1px solid var(--border)',
        background: copied ? 'var(--card-bg-tinted)' : 'var(--card-bg)',
        color: copied ? 'var(--accent-success)' : 'var(--body-secondary)',
        cursor: 'pointer', transition: 'all 0.15s',
        position: 'relative', zIndex: 2, flexShrink: 0,
        padding: 0
      }}
      onMouseEnter={e => { if (!copied) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; } }}
      onMouseLeave={e => { if (!copied) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--body-secondary)'; } }}
    >
      {copied ? <Check size={14} /> : <Share2 size={14} />}
    </button>
  );
}
