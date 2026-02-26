import React, { useState } from 'react';
import { Link2, Facebook, Twitter, Linkedin, Mail, Check } from 'lucide-react';

export default function ShareBar() {
  const [copied, setCopied] = useState(false);

  const url = window.location.href;
  const title = document.title.replace(/ — ADA Legal Link$/, '');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openPopup = (shareUrl) => {
    window.open(shareUrl, '_blank', 'width=600,height=500,noopener,noreferrer');
  };

  const buttons = [
    {
      label: copied ? 'Copied!' : 'Copy Link',
      icon: copied ? Check : Link2,
      onClick: handleCopy,
      highlight: copied,
    },
    {
      label: 'Facebook',
      icon: Facebook,
      onClick: () => openPopup(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`),
    },
    {
      label: 'X / Twitter',
      icon: Twitter,
      onClick: () => openPopup(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`),
    },
    {
      label: 'LinkedIn',
      icon: Linkedin,
      onClick: () => openPopup(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`),
    },
    {
      label: 'Email',
      icon: Mail,
      onClick: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this ADA accessibility resource: ${url}`)}`;
      },
    },
  ];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
    }}>
      <span style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
        color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.06em',
        marginRight: '4px',
      }}>
        Share
      </span>
      {buttons.map(b => {
        const Icon = b.icon;
        return (
          <button
            key={b.label}
            onClick={b.onClick}
            aria-label={b.label}
            title={b.label}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '34px', height: '34px', borderRadius: '8px',
              border: '1px solid var(--slate-200)',
              background: b.highlight ? '#F0FDF4' : 'white',
              color: b.highlight ? '#16A34A' : 'var(--slate-500)',
              cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C2410C'; e.currentTarget.style.color = '#C2410C'; }}
            onMouseLeave={e => { if (!b.highlight) { e.currentTarget.style.borderColor = 'var(--slate-200)'; e.currentTarget.style.color = 'var(--slate-500)'; } }}
          >
            <Icon size={15} />
          </button>
        );
      })}
    </div>
  );
}