import React, { useState, useRef, useEffect, useCallback } from 'react';
const LAV_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#606-lavatories-and-sinks';
const CALLOUTS = [
  { id: 1, label: 'Height & Knee Clearance', section: '\u00a7606.3', color: '#C2410C', textColor: '#7C2D12', x: 100, y: 52, plain: 'The rim or counter surface must be no higher than 34 inches above the floor. Knee clearance underneath must be at least 27 inches high at the front edge, tapering to 8 inches deep at 27 inches and 11 inches deep at 9 inches. Toe clearance extends from 9 inches down to the floor, at least 17 inches deep. The clear floor space is 30\u00d748 inches for a forward approach.', legal: '\u201CLavatories shall be installed with the front of the higher of the rim or counter surface 34 inches maximum above the finish floor.\u201D Knee clearance per \u00a7306.', citation: '\u00a7606.3, \u00a7306' },
  { id: 2, label: 'Faucets & Pipe Protection', section: '\u00a7606.4', color: '#15803D', textColor: '#14532D', x: 470, y: 52, plain: 'Faucets must be operable with one hand, no tight grasping or twisting. Lever, push, or sensor-operated faucets comply; twist knobs do not. Hot water and drain pipes under the lavatory must be insulated or covered to prevent burns \u2014 a wheelchair user\u2019s legs are directly underneath and may not have sensation to detect heat. Pipe covers must be smooth with no sharp edges.', legal: '\u201CFaucets shall comply with \u00a7309.\u201D \u201CWater supply and drain pipes under lavatories and sinks shall be insulated or otherwise configured to protect against contact.\u201D', citation: '\u00a7606.4, \u00a7606.5' }
];
function makeLink(t) { return (<a href={LAV_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${t} on ADA.gov`}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }
function CalloutPanel({ callout, onClose, panelRef }) { if (!callout) return null; return (<div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'lavFade 0.25s ease-out' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: callout.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{callout.id}</span><span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{callout.label}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: callout.color, background: `${callout.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{callout.section}</span></div><button onClick={onClose} aria-label="Close panel" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px' }}>Close <span aria-hidden="true">{'\u2715'}</span></button></div><div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}><div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{callout.plain}</p></div><aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard {'\u2014'} {parseCite(callout.citation)}</p><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(callout.legal)}</p></div></aside></div></div>); }
function KeyFact({ color, number, children }) { return (<div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '6px 0' }}><span style={{ background: color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 700, minWidth: '60px', textAlign: 'center', padding: '3px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>{number}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>{children}</span></div>); }
function Dots({ callouts, active, toggle }) { return callouts.map(c => (<g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>{active === c.id && (<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>)}<circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" /><text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text><circle cx={c.x} cy={c.y} r="22" fill="none" stroke="transparent" strokeWidth="2" className="lav-focus-ring" /></g>)); }

export default function LavatoryDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Accessible Sink</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>{['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}</div>
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 360" role="img" aria-labelledby="lav-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="lav-title">Lavatory {'\u2014'} Side Cross-Section</title>
          <rect width="720" height="360" fill="var(--page-bg-subtle)" />
          <text x="190" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Side view</text>
          <text x="560" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">What to check</text>

          {/* LEFT: Side cross-section */}
          {/* Wall */}
          <rect x="160" y="60" width="10" height="240" fill="#CBD5E1" rx="2" />
          {/* Counter/rim */}
          <rect x="170" y="130" width="100" height="8" rx="2" fill="#94A3B8" />
          <text x="220" y="122" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B" fontWeight="600">sink rim</text>
          {/* Sink bowl */}
          <path d="M 185 138 Q 220 190 255 138" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1" />
          {/* Pipes */}
          <line x1="220" y1="185" x2="220" y2="260" stroke="#94A3B8" strokeWidth="2" />
          <rect x="210" y="195" width="20" height="60" rx="4" fill="#B45309" opacity="0.08" stroke="#B45309" strokeWidth="1.5" />
          <text x="250" y="228" fontFamily="Manrope, sans-serif" fontSize="10" fill="#B45309" fontWeight="600">insulated</text>
          <text x="250" y="242" fontFamily="Manrope, sans-serif" fontSize="10" fill="#B45309">pipes</text>
          {/* 34" max height */}
          <line x1="290" y1="130" x2="290" y2="300" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="284" y1="130" x2="296" y2="130" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="284" y1="300" x2="296" y2="300" stroke="#C2410C" strokeWidth="1.2" />
          <rect x="298" y="206" width="60" height="20" rx="6" fill="#C2410C" />
          <text x="328" y="220" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('34', '865')} max</text>
          <text x="328" y="238" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="500">rim height</text>
          {/* Faucet */}
          <rect x="200" y="118" width="16" height="12" rx="2" fill="#15803D" opacity="0.15" stroke="#15803D" strokeWidth="1" />
          <text x="232" y="115" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="600">lever faucet</text>
          {/* Knee space */}
          <rect x="170" y="170" width="90" height="80" rx="2" fill="#7C3AED" opacity="0.03" stroke="#7C3AED" strokeWidth="1" strokeDasharray="4 3" />
          <text x="215" y="210" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6">knee space</text>
          {/* Wheelchair approaching */}
          <g transform="translate(60,160)" opacity="0.5">
            <circle cx="20" cy="0" r="8" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
            <line x1="20" y1="9" x2="20" y2="35" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="20" x2="35" y2="30" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="10" cy="46" r="7" fill="none" stroke="#475569" strokeWidth="1.2" />
            <circle cx="30" cy="46" r="7" fill="none" stroke="#475569" strokeWidth="1.2" />
          </g>
          {/* Floor */}
          <line x1="30" y1="300" x2="340" y2="300" stroke="#94A3B8" strokeWidth="2" />

          {/* DIVIDER */}
          <line x1="380" y1="40" x2="380" y2="340" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* RIGHT: Checklist */}
          <rect x="410" y="65" width="280" height="50" rx="10" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1.5" />
          <text x="550" y="86" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#7C2D12" fontWeight="600">Rim/counter: {d('34', '865')} max above floor</text>
          <text x="550" y="103" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12">with knee and toe clearance underneath</text>
          <rect x="410" y="128" width="280" height="50" rx="10" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="1.5" />
          <text x="550" y="149" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">Lever, push, or sensor faucet</text>
          <text x="550" y="166" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D">no twist knobs {'\u2014'} one hand, {'\u2264'} 5 lbs</text>
          <rect x="410" y="191" width="280" height="50" rx="10" fill="#B45309" opacity="0.04" stroke="#B45309" strokeWidth="1.5" />
          <text x="550" y="212" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#78350F" fontWeight="600">Hot pipes must be insulated</text>
          <text x="550" y="229" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#78350F">prevents burns {'\u2014'} legs are directly underneath</text>
          <rect x="410" y="254" width="280" height="40" rx="10" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1.5" />
          <text x="550" y="278" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#1E3A8A" fontWeight="600">30{'\u2033'}{'\u00d7'}48{'\u2033'} clear floor, forward approach</text>

          <Dots callouts={CALLOUTS} active={active} toggle={toggle} />
          <text x="20" y="348" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing: ${ac.label}` : ''}</div>
      <CalloutPanel callout={ac} onClose={() => setActive(null)} panelRef={panelRef} />
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Lavatories</p>
        <KeyFact color="#C2410C" number={`\u2264 ${d('34', '865')}`}>Maximum rim/counter height</KeyFact>
        <KeyFact color="#15803D" number="Lever">Faucet must work with one hand, no twisting</KeyFact>
        <KeyFact color="#B45309" number="Insulate">Hot water pipes must be covered to prevent burns</KeyFact>
      </div>
      <style>{`
        @keyframes lavFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .lav-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
