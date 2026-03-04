import React, { useState, useRef, useEffect, useCallback } from 'react';

const DF_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#602-drinking-fountains';

const CALLOUTS = [
  {
    id: 1, label: 'Heights & Approach', section: '\u00a7602.4',
    color: '#C2410C', textColor: '#7C2D12', x: 170, y: 52,
    plain: 'Two heights are required: a wheelchair-accessible fountain with spout no higher than 36 inches, and a standing-height fountain with spout between 38 and 43 inches. The wheelchair fountain needs knee and toe clearance underneath for a forward approach (30\u00d748 inches). The standing fountain needs a parallel approach (30\u00d748 inches alongside). A single hi-lo unit satisfies both. Water flow must be at least 4 inches high for cup/bottle filling.',
    legal: '\u201CSpout outlets for wheelchair users shall be 36 inches maximum above the floor.\u201D Standing: \u201C38 inches minimum and 43 inches maximum.\u201D Flow: \u201C4 inches high minimum.\u201D',
    citation: '\u00a7602.4, \u00a7602.5, \u00a7602.6'
  },
  {
    id: 2, label: 'Controls & Scoping', section: '\u00a7602.6',
    color: '#15803D', textColor: '#14532D', x: 540, y: 52,
    plain: 'Controls must be front-mounted or on the front half of the unit, operable with one hand, no more than 5 pounds of force. Push-button and lever controls comply; twist knobs do not. Where fountains are provided on a floor, at least one wheelchair-height and one standing-height must be offered. A single hi-lo unit satisfies both requirements. Bottle fillers alone do not substitute for fountains.',
    legal: 'Controls: \u201COperable with one hand, no tight grasping, pinching, or twisting.\u201D Scoping: \u201CWhere drinking fountains are provided on an exterior site, on a floor, or within a secured area, two levels shall be provided.\u201D',
    citation: '\u00a7602.6, \u00a7211'
  }
];

function makeLink(t) { return (<a href={DF_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${t} on ADA.gov`}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }
function CalloutPanel({ callout, onClose, panelRef }) { if (!callout) return null; return (<div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'dfFade 0.25s ease-out' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: callout.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{callout.id}</span><span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{callout.label}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: callout.color, background: `${callout.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{callout.section}</span></div><button onClick={onClose} aria-label="Close panel" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px' }}>Close <span aria-hidden="true">{'\u2715'}</span></button></div><div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}><div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{callout.plain}</p></div><aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard {'\u2014'} {parseCite(callout.citation)}</p><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(callout.legal)}</p></div></aside></div></div>); }
function KeyFact({ color, number, children }) { return (<div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '6px 0' }}><span style={{ background: color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 700, minWidth: '60px', textAlign: 'center', padding: '3px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>{number}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>{children}</span></div>); }
function Dots({ callouts, active, toggle }) { return callouts.map(c => (<g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>{active === c.id && (<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>)}<circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" /><text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text><circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="df-focus-ring" /></g>)); }

export default function DrinkingFountainDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Two Heights Required</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 380" role="img" aria-labelledby="df-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="df-title">Drinking Fountain Heights {'\u2014'} Wheelchair and Standing</title>
          <rect width="720" height="380" fill="var(--page-bg-subtle)" />

          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Wheelchair height</text>
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Standing height</text>

          {/* LEFT: Wheelchair fountain */}
          {/* Wall */}
          <rect x="150" y="70" width="10" height="260" fill="#CBD5E1" rx="2" />

          {/* Fountain unit */}
          <rect x="160" y="160" width="60" height="20" rx="3" fill="#C2410C" opacity="0.1" stroke="#C2410C" strokeWidth="1.5" />
          <rect x="160" y="170" width="60" height="8" rx="1" fill="#C2410C" opacity="0.05" />

          {/* 36" max height */}
          <line x1="240" y1="160" x2="240" y2="330" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="234" y1="160" x2="246" y2="160" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="234" y1="330" x2="246" y2="330" stroke="#C2410C" strokeWidth="1.2" />
          <rect x="248" y="235" width="70" height="20" rx="6" fill="#C2410C" />
          <text x="283" y="249" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('36', '915')} max</text>

          {/* Wheelchair approaching */}
          <g transform="translate(60,200)" opacity="0.5">
            <circle cx="20" cy="0" r="9" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
            <line x1="20" y1="10" x2="20" y2="40" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="22" x2="35" y2="32" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="52" r="8" fill="none" stroke="#475569" strokeWidth="1.2" />
            <circle cx="32" cy="52" r="8" fill="none" stroke="#475569" strokeWidth="1.2" />
          </g>
          <text x="80" y="272" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B">forward approach</text>

          {/* Knee clearance note */}
          <text x="190" y="210" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="500">knee space</text>
          <text x="190" y="224" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="500">underneath</text>

          {/* Floor */}
          <line x1="30" y1="330" x2="330" y2="330" stroke="#94A3B8" strokeWidth="2" />


          {/* DIVIDER */}
          <line x1="360" y1="20" x2="360" y2="360" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />


          {/* RIGHT: Standing fountain */}
          <rect x="500" y="70" width="10" height="260" fill="#CBD5E1" rx="2" />

          {/* Fountain unit (higher) */}
          <rect x="510" y="130" width="60" height="20" rx="3" fill="#15803D" opacity="0.1" stroke="#15803D" strokeWidth="1.5" />

          {/* 38-43" height */}
          <line x1="590" y1="130" x2="590" y2="330" stroke="#15803D" strokeWidth="1.2" />
          <line x1="584" y1="130" x2="596" y2="130" stroke="#15803D" strokeWidth="1.2" />
          <line x1="584" y1="330" x2="596" y2="330" stroke="#15803D" strokeWidth="1.2" />
          <rect x="598" y="220" width="80" height="20" rx="6" fill="#15803D" />
          <text x="638" y="234" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('38', '965')}{'\u2013'}{d('43', '1090')}</text>

          {/* Person standing */}
          <g transform="translate(420,100)" opacity="0.5">
            <circle cx="30" cy="0" r="10" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
            <line x1="30" y1="12" x2="30" y2="80" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <line x1="30" y1="80" x2="18" y2="140" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="30" y1="80" x2="42" y2="140" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="30" y1="35" x2="50" y2="55" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
          </g>
          <text x="450" y="260" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B">parallel approach</text>

          {/* Floor */}
          <line x1="390" y1="330" x2="700" y2="330" stroke="#94A3B8" strokeWidth="2" />

          {/* Water flow note */}
          <rect x="160" y="300" width="150" height="24" rx="6" fill="#B45309" opacity="0.06" stroke="#B45309" strokeWidth="1" />
          <text x="235" y="316" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#78350F" fontWeight="600">water flow: {d('4', '100')} min high</text>

          <Dots callouts={CALLOUTS} active={active} toggle={toggle} />
          <text x="20" y="368" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{ac ? `Showing: ${ac.label}` : ''}</div>
      <CalloutPanel callout={ac} onClose={() => setActive(null)} panelRef={panelRef} />

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Drinking Fountains</p>
        <KeyFact color="#C2410C" number={`\u2264 ${d('36', '915')}`}>Wheelchair fountain spout height</KeyFact>
        <KeyFact color="#15803D" number={`${d('38', '965')}\u2013${d('43', '1090')}`}>Standing fountain spout height</KeyFact>
        <KeyFact color="#B45309" number={d('4', '100')}>Minimum water flow height (for cup/bottle filling)</KeyFact>
        <KeyFact color="#2563EB" number="2 types">Every floor needs both wheelchair and standing heights</KeyFact>
      </div>

      <style>{`
        @keyframes dfFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .df-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
