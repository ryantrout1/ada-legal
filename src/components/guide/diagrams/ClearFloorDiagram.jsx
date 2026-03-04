import React, { useState, useRef, useEffect, useCallback } from 'react';

const CLEAR_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#305-clear-floor-or-ground-space';

const CALLOUTS = [
  {
    id: 1, label: 'Forward Approach', section: '\u00a7305.5',
    color: '#15803D', textColor: '#14532D', x: 170, y: 52,
    plain: 'In a forward approach, the 48-inch dimension extends toward the element being accessed. The wheelchair faces the element head-on. This is the standard approach for lavatories, drinking fountains, counters, and any element that requires knee and toe clearance underneath.',
    legal: '\u201COne full unobstructed side of the clear floor or ground space shall adjoin an accessible route or adjoin another clear floor or ground space.\u201D Forward approach: 48 inches toward element.',
    citation: '\u00a7305.5'
  },
  {
    id: 2, label: 'Parallel Approach', section: '\u00a7305.5',
    color: '#2563EB', textColor: '#1E3A8A', x: 540, y: 52,
    plain: 'In a parallel approach, the 48-inch dimension runs alongside the element. The wheelchair parks parallel to whatever is being accessed. This is common for wall-mounted controls (light switches, thermostats), some ATMs, vending machines, and fire alarm pull stations.',
    legal: '\u201CWhere a clear floor or ground space is positioned for a parallel approach, the 48-inch dimension shall be parallel to the element.\u201D Side reach per \u00a7308.3 applies.',
    citation: '\u00a7305.5'
  }
];

function makeLink(text) {
  return (<a href={CLEAR_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${text} on ADA.gov`}>{text}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>);
}
function parseCitations(text) {
  return text.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p);
}

function CalloutPanel({ callout, onClose, panelRef }) {
  if (!callout) return null;
  return (
    <div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'clearFade 0.25s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: callout.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{callout.id}</span>
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{callout.label}</span>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: callout.color, background: `${callout.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{callout.section}</span>
        </div>
        <button onClick={onClose} aria-label="Close panel" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px' }}>Close <span aria-hidden="true">{'\u2715'}</span></button>
      </div>
      <div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}>
        <div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{callout.plain}</p></div>
        <aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard \u2014 {parseCitations(callout.citation)}</p>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCitations(callout.legal)}</p>
        </div></aside>
      </div>
    </div>
  );
}

function KeyFact({ color, number, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '6px 0' }}>
      <span style={{ background: color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 700, minWidth: '60px', textAlign: 'center', padding: '3px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>{number}</span>
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

export default function ClearFloorDiagram() {
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const panelRef = useRef(null);
  const toggle = useCallback((id) => setActive(prev => prev === id ? null : id), []);
  useEffect(() => { if (active && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [active]);
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') setActive(null); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const d = (inches, mm) => metric ? `${mm} mm` : `${inches}\u2033`;
  const ac = CALLOUTS.find(c => c.id === active);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>{'\u00a7'}305 Clear Floor Space</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 380" role="img" aria-labelledby="clear-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="clear-title">Clear Floor Space \u2014 Forward and Parallel Approaches</title>
          <rect width="720" height="380" fill="var(--page-bg-subtle)" />

          {/* LEFT: FORWARD APPROACH */}
          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Facing it head-on</text>

          {/* Element (counter/sink) */}
          <rect x="110" y="68" width="120" height="12" rx="2" fill="#94A3B8" stroke="#64748B" strokeWidth="1.5" />
          <text x="170" y="62" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B" fontWeight="600">counter, sink, etc.</text>

          {/* Clear floor rect */}
          <rect x="95" y="82" width="150" height="210" rx="4" fill="#15803D" opacity="0.05" stroke="#15803D" strokeWidth="2" />

          {/* Wheelchair (top-down plan view) */}
          <g transform="translate(130,160) scale(1.2)">
            <rect x="0" y="0" width="60" height="45" rx="4" fill="none" stroke="#475569" strokeWidth="1.8" />
            <circle cx="30" cy="22" r="10" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
            <circle cx="5" cy="55" r="16" fill="none" stroke="#475569" strokeWidth="1.5" />
            <circle cx="55" cy="55" r="16" fill="none" stroke="#475569" strokeWidth="1.5" />
            <circle cx="18" cy="-6" r="5" fill="none" stroke="#475569" strokeWidth="1" />
            <circle cx="42" cy="-6" r="5" fill="none" stroke="#475569" strokeWidth="1" />
          </g>

          {/* Arrow toward element */}
          <line x1="170" y1="155" x2="170" y2="95" stroke="#15803D" strokeWidth="2" markerEnd="url(#clearArr)" />
          <defs><marker id="clearArr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#15803D" /></marker></defs>

          {/* Width: 30" */}
          <line x1="95" y1="305" x2="245" y2="305" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="95" y1="298" x2="95" y2="312" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="245" y1="298" x2="245" y2="312" stroke="#C2410C" strokeWidth="1.5" />
          <rect x="130" y="310" width="80" height="20" rx="6" fill="#C2410C" />
          <text x="170" y="324" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('30', '760')} min wide</text>

          {/* Depth: 48" */}
          <line x1="72" y1="82" x2="72" y2="292" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="65" y1="82" x2="79" y2="82" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="65" y1="292" x2="79" y2="292" stroke="#C2410C" strokeWidth="1.5" />
          <rect x="30" y="178" width="40" height="20" rx="6" fill="#C2410C" />
          <text x="50" y="192" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('48', '1220')}</text>


          {/* DIVIDER */}
          <line x1="345" y1="20" x2="345" y2="360" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />


          {/* RIGHT: PARALLEL APPROACH */}
          <text x="530" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Pulling up alongside</text>

          {/* Element (switch on wall) */}
          <rect x="385" y="120" width="12" height="110" rx="2" fill="#94A3B8" stroke="#64748B" strokeWidth="1.5" />
          <text x="380" y="178" textAnchor="end" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B" fontWeight="600" transform="rotate(-90 380 178)">switch, control, etc.</text>

          {/* Clear floor rect */}
          <rect x="400" y="86" width="260" height="190" rx="4" fill="#2563EB" opacity="0.05" stroke="#2563EB" strokeWidth="2" />

          {/* Wheelchair (top-down, oriented sideways) */}
          <g transform="translate(480,130) scale(1.2)">
            <rect x="0" y="0" width="60" height="45" rx="4" fill="none" stroke="#475569" strokeWidth="1.8" />
            <circle cx="30" cy="22" r="10" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
            <circle cx="5" cy="55" r="16" fill="none" stroke="#475569" strokeWidth="1.5" />
            <circle cx="55" cy="55" r="16" fill="none" stroke="#475569" strokeWidth="1.5" />
            <circle cx="18" cy="-6" r="5" fill="none" stroke="#475569" strokeWidth="1" />
            <circle cx="42" cy="-6" r="5" fill="none" stroke="#475569" strokeWidth="1" />
          </g>

          {/* Arrow toward element */}
          <line x1="480" y1="185" x2="410" y2="185" stroke="#2563EB" strokeWidth="2" markerEnd="url(#clearArrB)" />
          <defs><marker id="clearArrB" markerWidth="8" markerHeight="6" refX="0" refY="3" orient="auto-start-reverse"><polygon points="0 0, 8 3, 0 6" fill="#2563EB" /></marker></defs>

          {/* Width: 48" (parallel) */}
          <line x1="400" y1="290" x2="660" y2="290" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="400" y1="283" x2="400" y2="297" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="660" y1="283" x2="660" y2="297" stroke="#C2410C" strokeWidth="1.5" />
          <rect x="490" y="296" width="80" height="20" rx="6" fill="#C2410C" />
          <text x="530" y="310" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('48', '1220')} min long</text>

          {/* Depth: 30" */}
          <line x1="672" y1="86" x2="672" y2="276" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="665" y1="86" x2="679" y2="86" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="665" y1="276" x2="679" y2="276" stroke="#C2410C" strokeWidth="1.5" />
          <rect x="680" y="172" width="36" height="20" rx="6" fill="#C2410C" />
          <text x="698" y="186" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('30', '760')}</text>


          {/* CALLOUT DOTS */}
          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && (<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>)}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
              <circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="clear-focus-ring" />
            </g>
          ))}
          <text x="20" y="365" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      <CalloutPanel callout={ac} onClose={() => setActive(null)} panelRef={panelRef} />

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Clear Floor Space</p>
        <KeyFact color="#C2410C" number={`${d('30', '760')} \u00d7 ${d('48', '1220')}`}>Minimum clear floor space at every accessible element (about 2.5 ft {'\u00d7'} 4 ft)</KeyFact>
        <KeyFact color="#15803D" number="Forward">Wheelchair faces the element {'\u2014'} 48{'\u2033'} toward it, 30{'\u2033'} wide</KeyFact>
        <KeyFact color="#2563EB" number="Parallel">Wheelchair pulls up alongside {'\u2014'} 48{'\u2033'} long, 30{'\u2033'} deep</KeyFact>
      </div>

      <style>{`
        @keyframes clearFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .clear-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
