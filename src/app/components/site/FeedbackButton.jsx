import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import FeedbackModal from './FeedbackModal.jsx';

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 900,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--heading)',
          // Text tracks --page-bg, which is always the opposite lightness of
          // --heading (a heading must contrast its page). Pinning to literal
          // 'white' failed in dark/contrast/low-vision, where --heading flips
          // light — white-on-near-white, 1.0-1.4:1. page-bg pairing is AAA in
          // all 5 themes (12.75-19.8:1). No visible change in default/warm
          // where page-bg is white/cream.
          color: 'var(--page-bg)',
          border: 'none',
          borderRadius: '100px',
          padding: '10px 18px',
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.8125rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          transition: 'transform 0.15s, box-shadow 0.15s',
          minHeight: '44px',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)'; }}
      >
        <MessageSquare size={15} />
        Feedback
      </button>
      <FeedbackModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}