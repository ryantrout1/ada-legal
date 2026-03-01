import React from 'react';

// ── Severity config ──
export const S = {
  high:   { bg: '#FEE2E2', fg: '#B91C1C', dot: '#DC2626' },
  medium: { bg: '#FEF3C7', fg: '#92400E', dot: '#F59E0B' },
  low:    { bg: '#DCFCE7', fg: '#15803D', dot: '#22C55E' },
};

// ── Helpers ──
export const pct = (n, d) => d > 0 ? Math.round(n / d * 100) : 0;
export const isDigital = (c) => (c || '').startsWith('digital_') || c === 'digital_website';
export const catName = (c) => {
  const map = {
    physical_entrance: 'Entrance', physical_restroom: 'Restroom', physical_parking: 'Parking',
    physical_path: 'Path of Travel', physical_service_animal: 'Service Animal',
    digital_screen_reader: 'Screen Reader', digital_keyboard_nav: 'Keyboard Nav',
    digital_forms: 'Digital Forms', digital_video_captions: 'Video Captions',
    Parking: 'Parking', 'Entrance/Exit': 'Entrance', Entrance: 'Entrance',
    Restroom: 'Restroom', 'Path of Travel': 'Path of Travel', 'Service Animal Denial': 'Service Animal',
  };
  return map[c] || (c || '').replace(/^(physical_|digital_)/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};
export const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(typeof d === 'string' && !d.includes('T') ? d + 'T12:00:00' : d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
export const getCategory = (c) => c.ai_category || c.violation_subtype || c.violation_type || 'other';
export const getSeverity = (c) => c.ai_severity || 'low';
export const getDate = (c) => c.submitted_at || c.created_date || '';
export const getViews = (c) => c.marketplace_views || 0;

// ── Tiny components ──
export const Dot = ({ color, size = 6 }) => (
  <span style={{ display: 'inline-block', width: size, height: size, borderRadius: size, background: color, flexShrink: 0 }} />
);

export const Tag = ({ children, bg = '#F1F5F9', fg = '#64748B' }) => (
  <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '1px 5px', borderRadius: 99, background: bg, color: fg, whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>{children}</span>
);

export const Bar = ({ v, max, color = '#C2410C', h = 6, bg = '#F1F1F5' }) => {
  const w = max > 0 ? Math.max(v / max * 100, 1.5) : 0;
  return (
    <div style={{ width: '100%', height: h, background: bg, borderRadius: h / 2, overflow: 'hidden' }}>
      <div style={{ width: `${w}%`, height: '100%', background: color, borderRadius: h / 2 }} />
    </div>
  );
};

export const SevBadge = ({ severity }) => {
  const c = S[severity] || S.low;
  return (
    <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: c.bg, color: c.fg, textTransform: 'capitalize' }}>{severity}</span>
  );
};

export const CoveragePill = ({ lawyers, ratio }) => {
  const noCoverage = lawyers === 0;
  const strained = lawyers > 0 && ratio > 5;
  return (
    <span style={{
      fontSize: '0.58rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      background: noCoverage ? '#FEE2E2' : strained ? '#FEF3C7' : '#DCFCE7',
      color: noCoverage ? '#B91C1C' : strained ? '#92400E' : '#15803D',
    }}>
      {noCoverage ? 'No Coverage' : strained ? 'Strained' : 'Covered'}
    </span>
  );
};

// ── Panel wrapper ──
export const Panel = ({ children, style }) => (
  <div style={{ background: '#FFF', border: '1px solid #E8E8EC', borderRadius: 10, padding: '14px 16px', ...style }}>{children}</div>
);

export const PanelHead = ({ title, right }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
    <span style={{ fontFamily: 'Fraunces, serif', fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-900, #1A1A2E)' }}>{title}</span>
    {right && <span style={{ fontSize: '0.6rem', color: '#94A3B8' }}>{right}</span>}
  </div>
);
