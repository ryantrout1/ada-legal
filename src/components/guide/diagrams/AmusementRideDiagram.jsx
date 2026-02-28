import React, { useState, useRef, useEffect, useCallback } from 'react';

const STD_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#1002-amusement-rides';
const CALLOUTS = [
  { id: 1, label: 'Wheelchair Space on Ride', section: '§1002.4', color: '#C2410C', textColor: '#8B2E08', x: 120, y: 100, plain: 'The wheelchair space on the ride must be at least 36 inches wide by 48 inches deep. It must have an accessible lap bar or restraint system. The space must be level with the loading platform so a wheelchair user can roll directly on.', legal: '"Wheelchair spaces in amusement rides shall comply with §1002.4." Space: 36×48" min. Level with loading platform.', citation: '§1002.4' },
  { id: 2, label: 'Transfer Seat', section: '§1002.5', color: '#16A34A', textColor: '#14532D', x: 350, y: 100, plain: 'Transfer seats must be 14 to 17 inches high, at least 24 inches wide, and at least 21 inches deep. Transfer supports (armrests or grab bars) must be provided on both sides to help a person move from their wheelchair onto the ride seat.', legal: '"Transfer seats shall have a height of 14 inches minimum and 17 inches maximum. Width: 24 inches minimum. Depth: 21 inches minimum."', citation: '§1002.5' },
  { id: 3, label: 'Loading/Unloading Area', section: '§1002.3', color: '#2563EB', textColor: '#1E3A8A', x: 580, y: 100, plain: 'The loading and unloading area must have a firm, level surface at least 60 inches wide by 60 inches deep. It must be connected to the accessible route through the facility. The platform must be at the same level as the ride vehicle floor.', legal: '"Load and unload areas serving amusement rides shall comply with §1002.3." Level surface: 60×60" min. Connected to accessible route.', citation: '§1002.3' },
  { id: 4, label: 'Accessible Route to Ride', section: '§1002.2', color: '#7C3AED', textColor: '#5B21B6', x: 120, y: 340, plain: 'An accessible route complying with Chapter 4 must connect the entrance to the ride queue and the loading area. If the queue line has switchbacks or barriers, the accessible route must bypass them or an equivalent accessible queue must be provided.', legal: '"Accessible routes serving amusement rides shall comply with Chapter 4." Queue lines must also have accessible routes.', citation: '§1002.2' },
  { id: 5, label: 'Signage', section: '§1002.6', color: '#D97706', textColor: '#78350F', x: 350, y: 340, plain: 'Each ride must display signage indicating what type of accessible boarding is available: wheelchair space on the ride vehicle, transfer seat, or transfer device. This helps visitors plan which rides they can use.', legal: '"Amusement rides shall display signage indicating the type of access provided (wheelchair space, transfer seat, or transfer device)."', citation: '§1002.6' }
];

function makeLink(t) { return (<a href={STD_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}>{t}<span aria-hidden="true" style={{ fontSize: '.65em', marginLeft: 1, verticalAlign: 'super' }}>↗</span></a>); }
function parseCite(t) { return t.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

export default function AmusementRideDiagram() {
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const panelRef = useRef(null);
  const toggle = useCallback(id => setActive(p => p === id ? null : id), []);
  useEffect(() => { if (active && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [active]);
  useEffect(() => { const h = e => { if (e.key === 'Escape') setActive(null); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const d = (imp, met) => metric ? `${met} mm` : `${imp}"`;
  const ac = CALLOUTS.find(c => c.id === active);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>§1002 Amusement Rides</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--slate-500)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--slate-200)', background: isA ? '#1A1F2B' : 'white', color: isA ? 'white' : 'var(--slate-600)', cursor: 'pointer', minHeight: 44 }}>{u}</button>); })}
        </div>
      </div>
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden' }}>
        <svg viewBox="0 0 900 520" role="img" aria-labelledby="ar-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="ar-title">ADA §1002 Amusement Rides — Plan View</title>
          <rect width="900" height="520" fill="#FAFAF9" />
          <text x="450" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing=".08em">ACCESSIBLE LOADING AREA & RIDE VEHICLE</text>

          {/* Loading platform */}
          <rect x="60" y="160" width="380" height="280" fill="#2563EB" opacity="0.03" stroke="#2563EB" strokeWidth="1.5" rx="6" />
          <text x="250" y="185" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#1E3A8A" fontWeight="600">LOADING / UNLOADING PLATFORM</text>

          {/* Level surface */}
          <rect x="100" y="220" width="200" height="200" rx="4" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1" strokeDasharray="4 3" />
          <text x="200" y="325" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#1E3A8A">{d('60', '1525')} × {d('60', '1525')} min</text>
          <text x="200" y="340" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#1E3A8A">Level surface</text>

          {/* Queue line / accessible route */}
          <rect x="60" y="60" width="120" height="90" rx="4" fill="#7C3AED" opacity="0.04" stroke="#7C3AED" strokeWidth="1" strokeDasharray="4 3" />
          <text x="120" y="100" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#5B21B6" fontWeight="600">QUEUE</text>
          <text x="120" y="115" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#5B21B6">(accessible route)</text>
          <defs><marker id="arArr" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="#7C3AED" /></marker></defs>
          <line x1="120" y1="150" x2="120" y2="200" stroke="#7C3AED" strokeWidth="1.5" markerEnd="url(#arArr)" />

          {/* Signage */}
          <rect x="320" y="210" width="100" height="40" rx="6" fill="#D97706" opacity="0.05" stroke="#D97706" strokeWidth="1" />
          <text x="370" y="232" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#78350F" fontWeight="600">ACCESS TYPE</text>
          <text x="370" y="244" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#78350F">SIGNAGE</text>

          {/* Ride vehicle */}
          <rect x="500" y="160" width="360" height="280" fill="#C2410C" opacity="0.03" stroke="#94A3B8" strokeWidth="2" rx="12" />
          <text x="680" y="185" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563" fontWeight="600">RIDE VEHICLE</text>

          {/* Wheelchair space on ride */}
          <rect x="520" y="220" width="140" height="180" rx="6" fill="#C2410C" opacity="0.05" stroke="#C2410C" strokeWidth="2" strokeDasharray="6 3" />
          <text x="590" y="310" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#8B2E08" fontWeight="600">WHEELCHAIR</text>
          <text x="590" y="325" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#8B2E08" fontWeight="600">SPACE</text>
          <text x="590" y="345" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#8B2E08">{d('36', '915')} × {d('48', '1220')} min</text>

          {/* Transfer seat */}
          <rect x="700" y="260" width="120" height="100" rx="6" fill="#16A34A" opacity="0.05" stroke="#16A34A" strokeWidth="1.5" />
          <text x="760" y="305" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#14532D" fontWeight="600">TRANSFER SEAT</text>
          <text x="760" y="320" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#14532D">{d('24', '610')} w × {d('21', '535')} d</text>
          <text x="760" y="335" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#14532D">14–17" height</text>
          {/* Transfer supports */}
          <line x1="698" y1="275" x2="698" y2="345" stroke="#16A34A" strokeWidth="2.5" opacity="0.3" />
          <line x1="822" y1="275" x2="822" y2="345" stroke="#16A34A" strokeWidth="2.5" opacity="0.3" />
          <text x="760" y="355" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5" fill="#14532D">← supports →</text>

          {/* Level connection between platform and vehicle */}
          <line x1="440" y1="310" x2="500" y2="310" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 2" />
          <text x="470" y="300" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5.5" fill="#4B5563">LEVEL</text>

          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity=".3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from=".4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="510" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      {ac && (
        <div ref={panelRef} style={{ marginTop: 12, background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden', animation: 'arFade .25s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--slate-200)', background: '#FAFAF9', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: ac.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{ac.id}</span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)' }}>{ac.label}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: ac.color, background: `${ac.color}15`, padding: '2px 8px', borderRadius: 4 }}>{ac.section}</span>
            </div>
            <button onClick={() => setActive(null)} aria-label="Close" style={{ background: 'none', border: '1px solid var(--slate-200)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-600)', minHeight: 44 }}>Close <span aria-hidden="true">✕</span></button>
          </div>
          <div className="guide-two-col" style={{ padding: 20, gap: 24, margin: 0 }}>
            <div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-700)', lineHeight: 1.75, margin: 0 }}>{ac.plain}</p></div>
            <aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: '#FFFBF7', borderLeft: '3px solid #C2410C', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--slate-500)', margin: '0 0 8px' }}>Official Standard — {parseCite(ac.citation)}</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(ac.legal)}</p>
            </div></aside>
          </div>
        </div>
      )}
      <style>{`@keyframes arFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}        @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}