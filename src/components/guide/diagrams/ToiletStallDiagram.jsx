import React, { useState, useRef, useEffect, useCallback } from 'react';
const TS_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#604-water-closets-and-toilet-compartments';
const LAYOUT_CALLOUTS = [
  { id: 1, label: 'Stall Size & Toilet Position', section: '\u00a7604.8', color: '#C2410C', textColor: '#7C2D12', x: 100, y: 52,
    plain: 'Standard accessible stalls must be at least 60 inches wide and 56 inches deep (wall-mounted toilet) or 59 inches deep (floor-mounted). The toilet centerline must be 16\u201318 inches from the side wall. Seat height: 17\u201319 inches. The door must be self-closing with pulls on both sides, and cannot swing into the required clearance. The clear floor space allows a side transfer from a wheelchair.', legal: '\u201CStandard compartment: 60 inches wide minimum.\u201D Depth: \u201C56 inches minimum (wall-mounted) or 59 inches (floor-mounted).\u201D Centerline: \u201C16 inches minimum to 18 inches maximum from the side wall.\u201D Seat: \u201C17 inches minimum and 19 inches maximum.\u201D', citation: '\u00a7604.8.1, \u00a7604.2, \u00a7604.4' },
  { id: 2, label: 'Grab Bars & Accessories', section: '\u00a7604.5', color: '#15803D', textColor: '#14532D', x: 640, y: 46,
    plain: 'Side grab bar: at least 42 inches long, mounted 12 inches from the rear wall, extending 54 inches from the rear wall. Rear grab bar: at least 36 inches long, centered behind the toilet. Both mounted 33\u201336 inches above the floor. Flush controls must be on the open (transfer) side. Toilet paper dispenser: 7\u201319 inches in front of the toilet, 15\u201348 inches above floor, must not obstruct the grab bar.', legal: 'Side bar: \u201C42 inches long minimum, 12 inches maximum from rear wall.\u201D Rear bar: \u201C36 inches long minimum.\u201D Height: \u201C33 inches minimum and 36 inches maximum.\u201D TP dispenser: \u201C7 inches minimum and 9 inches maximum in front of the water closet.\u201D', citation: '\u00a7604.5, \u00a7604.6, \u00a7604.7' }
];
function makeLink(t) { return (<a href={TS_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${t} on ADA.gov`}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }
function CalloutPanel({ callout, onClose, panelRef }) { if (!callout) return null; return (<div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'tsFade 0.25s ease-out' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: callout.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{callout.id}</span><span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{callout.label}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: callout.color, background: `${callout.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{callout.section}</span></div><button onClick={onClose} aria-label="Close panel" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px' }}>Close <span aria-hidden="true">{'\u2715'}</span></button></div><div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}><div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{callout.plain}</p></div><aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard {'\u2014'} {parseCite(callout.citation)}</p><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(callout.legal)}</p></div></aside></div></div>); }
function KeyFact({ color, number, children }) { return (<div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '6px 0' }}><span style={{ background: color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 700, minWidth: '60px', textAlign: 'center', padding: '3px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>{number}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>{children}</span></div>); }
function Dots({ callouts, active, toggle }) { return callouts.map(c => (<g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>{active === c.id && (<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>)}<circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" /><text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text><circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="ts-focus-ring" /></g>)); }

export default function ToiletStallDiagram() {
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const panelRef = useRef(null);
  const toggle = useCallback((id) => setActive(prev => prev === id ? null : id), []);
  useEffect(() => { if (active && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [active]);
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') setActive(null); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const d = (inches, mm) => metric ? `${mm} mm` : `${inches}\u2033`;
  const ac = LAYOUT_CALLOUTS.find(c => c.id === active);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Accessible Toilet Stall</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 400" role="img" aria-labelledby="ts-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="ts-title">Accessible Toilet Stall {'\u2014'} Plan View with Grab Bars</title>
          <rect width="720" height="400" fill="var(--page-bg-subtle)" />

          <text x="190" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Plan view (top down)</text>
          <text x="560" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">What to check</text>

          {/* LEFT: Stall plan view */}
          {/* Walls */}
          <rect x="50" y="70" width="250" height="260" fill="none" stroke="#94A3B8" strokeWidth="2" />
          {/* Side wall */}
          <line x1="50" y1="70" x2="50" y2="330" stroke="#94A3B8" strokeWidth="3" />
          {/* Rear wall */}
          <line x1="50" y1="330" x2="300" y2="330" stroke="#94A3B8" strokeWidth="3" />

          {/* Door opening */}
          <line x1="300" y1="70" x2="300" y2="170" stroke="#94A3B8" strokeWidth="2" />
          <line x1="300" y1="250" x2="300" y2="330" stroke="#94A3B8" strokeWidth="2" />
          <text x="305" y="215" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B" fontWeight="500">door</text>

          {/* Toilet */}
          <ellipse cx="120" cy="280" rx="22" ry="28" fill="#C2410C" opacity="0.06" stroke="#C2410C" strokeWidth="1.5" />
          <text x="120" y="284" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="600">toilet</text>

          {/* Side grab bar */}
          <line x1="55" y1="250" x2="55" y2="320" stroke="#15803D" strokeWidth="4" strokeLinecap="round" />
          <text x="40" y="288" textAnchor="end" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="600" transform="rotate(-90 40 288)">side bar</text>

          {/* Rear grab bar */}
          <line x1="70" y1="325" x2="180" y2="325" stroke="#15803D" strokeWidth="4" strokeLinecap="round" />
          <text x="125" y="345" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="600">rear bar</text>

          {/* Width dimension */}
          <line x1="50" y1="365" x2="300" y2="365" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="50" y1="360" x2="50" y2="370" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="300" y1="360" x2="300" y2="370" stroke="#C2410C" strokeWidth="1.2" />
          <rect x="135" y="370" width="80" height="18" rx="5" fill="#C2410C" />
          <text x="175" y="383" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('60', '1525')} min wide</text>

          {/* Centerline dimension */}
          <line x1="50" y1="280" x2="120" y2="280" stroke="#7C3AED" strokeWidth="1" strokeDasharray="3 2" />
          <rect x="60" y="256" width="80" height="18" rx="5" fill="#7C3AED" />
          <text x="100" y="269" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('16', '405')}{'\u2013'}{d('18', '455')}</text>
          <text x="100" y="248" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6" fontWeight="500">centerline</text>

          {/* Transfer space note */}
          <rect x="145" y="130" width="100" height="100" rx="4" fill="#2563EB" opacity="0.03" stroke="#2563EB" strokeWidth="1" strokeDasharray="4 3" />
          <text x="195" y="175" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">transfer</text>
          <text x="195" y="189" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">space</text>


          {/* DIVIDER */}
          <line x1="370" y1="40" x2="370" y2="380" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />


          {/* RIGHT: Checklist */}
          <rect x="400" y="65" width="280" height="48" rx="10" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1.5" />
          <text x="540" y="86" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#7C2D12" fontWeight="600">Stall: {d('60', '1525')} wide, {d('56', '1420')}{'\u2013'}{d('59', '1500')} deep</text>
          <text x="540" y="103" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12">depends on wall-mounted vs floor-mounted toilet</text>

          <rect x="400" y="125" width="280" height="48" rx="10" fill="#7C3AED" opacity="0.04" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="540" y="146" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#5B21B6" fontWeight="600">Toilet: {d('16', '405')}{'\u2013'}{d('18', '455')} from wall, seat {d('17', '430')}{'\u2013'}{d('19', '485')}</text>
          <text x="540" y="163" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6">centerline to side wall; seat height above floor</text>

          <rect x="400" y="185" width="280" height="48" rx="10" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="1.5" />
          <text x="540" y="206" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">Side bar: {d('42', '1065')} long, rear bar: {d('36', '915')} long</text>
          <text x="540" y="223" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D">mounted {d('33', '840')}{'\u2013'}{d('36', '915')} above floor</text>

          <rect x="400" y="245" width="280" height="48" rx="10" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1.5" />
          <text x="540" y="266" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#1E3A8A" fontWeight="600">Flush on open side, TP within reach</text>
          <text x="540" y="283" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">dispenser must not block the grab bar</text>

          <rect x="400" y="305" width="280" height="40" rx="10" fill="#B45309" opacity="0.04" stroke="#B45309" strokeWidth="1.5" />
          <text x="540" y="326" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#78350F" fontWeight="600">Door: self-closing, pulls both sides, swings out</text>

          <Dots callouts={LAYOUT_CALLOUTS} active={active} toggle={toggle} />
          <text x="20" y="395" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{ac ? `Showing: ${ac.label}` : ''}</div>
      <CalloutPanel callout={ac} onClose={() => setActive(null)} panelRef={panelRef} />

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Toilet Stall</p>
        <KeyFact color="#C2410C" number={d('60', '1525')}>Minimum stall width</KeyFact>
        <KeyFact color="#7C3AED" number={`${d('16', '405')}\u2013${d('18', '455')}`}>Toilet centerline from side wall</KeyFact>
        <KeyFact color="#15803D" number={d('42', '1065')}>Side grab bar length (12{'\u2033'} from rear wall)</KeyFact>
        <KeyFact color="#15803D" number={d('36', '915')}>Rear grab bar length (centered)</KeyFact>
      </div>

      <style>{`
        @keyframes tsFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .ts-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
