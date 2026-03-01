import React, { useState } from 'react';
import { Link2, Facebook, Twitter, Linkedin, Mail, Check } from 'lucide-react';
import { getDisplayMode } from '../landing/BrandIcons';

const MODE_STYLES = {
  default: {
    bg: '#1E293B',
    border: '1px solid #1E293B',
    color: '#FFFFFF',
    hoverBg: '#334155',
    accentColor: '#F97316',
    labelColor: '#4B5563',
  },
  dark: {
    bg: '#000000',
    border: '1px solid #475569',
    color: '#FFFFFF',
    hoverBg: '#1E293B',
    accentColor: '#FFB347',
    labelColor: '#B0BEC5',
  },
  warm: {
    bg: '#3D3128',
    border: '1px solid #3D3128',
    color: '#F5EDE0',
    hoverBg: '#4A3C30',
    accentColor: '#F97316',
    labelColor: '#5C4F42',
  },
  contrast: {
    bg: '#000000',
    border: '2px solid #FFFFFF',
    color: '#FFFFFF',
    hoverBg: '#1A1A1A',
    accentColor: '#FFB347',
    labelColor: '#FFFFFF',
  },
};

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

  const mode = getDisplayMode();
  const styles = MODE_STYLES[mode] || MODE_STYLES.default;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
    }}>
      <span style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
        color: styles.labelColor, textTransform: 'uppercase', letterSpacing: '0.06em',
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
            className="brand-icon share-btn"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '44px', height: '44px', borderRadius: '8px',
              border: styles.border,
              background: b.highlight ? '#064E3B' : styles.bg,
              color: b.highlight ? '#34D399' : styles.color,
              cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
              padding: 0, minHeight: '44px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = styles.hoverBg;
              e.currentTarget.style.color = styles.accentColor;
              e.currentTarget.style.borderColor = styles.accentColor;
            }}
            onMouseLeave={e => {
              if (!b.highlight) {
                e.currentTarget.style.background = styles.bg;
                e.currentTarget.style.color = styles.color;
                e.currentTarget.style.borderColor = styles.border.split(' ').pop();
              }
            }}
          >
            <Icon size={15} />
          </button>
        );
      })}
    </div>
  );
}
