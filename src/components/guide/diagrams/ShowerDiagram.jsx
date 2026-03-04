import React, { useState, useRef, useEffect, useCallback } from 'react';
const SH_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#608-shower-compartments';
const CALLOUTS = [
  { id: 1, label: 'Transfer vs Roll-In', section: '\u00a7608.2', color: '#C2410C', textColor: '#7C2D12', x: 100, y: 52, plain: 'Transfer showers are 36\u00d736 inches \u2014 the user transfers from a wheelchair onto a built-in seat. Roll-in showers are 60\u00d730 inches (standard) or 36\u00d760 inches (alternate) \u2014 a wheelchair can roll directly in. Roll-in showers have no curb (\u00bd inch max threshold). Transfer showers have a folding or fixed seat. Both types need 30\u00d748 inch clear floor space outside the shower.', legal: 'Transfer: \u201C36\u00d736 inches clear inside dimensions.\u201D Standard roll-in: \u201C30\u00d760 inches minimum.\u201D Alternate roll-in: \u201C36\u00d760 inches.\u201D Threshold: \u201C\u00bd inch maximum.\u201D', citation: '\u00a7608.2.1, \u00a7608.2.2, \u00a7608.7' },
  { id: 2, label: 'Grab Bars, Seat & Controls', section: '\u00a7608.3', color: '#15803D', textColor: '#14532D', x: 470, y: 52, plain: 'Transfer showers need grab bars across the back wall and side wall opposite the seat. Roll-in showers need bars on three walls. Seats: transfer type needs a folding seat 17\u201319 inches high. Controls must be between 38 and 48 inches above the shower floor, operable with one hand. A hand-held shower spray with 59-inch hose is required for all types. No shower enclosures that obstruct controls or transfer.', legal: 'Grab bars per \u00a7608.3. Seats per \u00a7608.4. Controls: \u201C38 inches minimum and 48 inches maximum above the shower floor.\u201D Spray: \u201CA shower spray unit with a hose 59 inches long minimum.\u201D', citation: '\u00a7608.3, \u00a7608.4, \u00a7608.5, \u00a7608.6' }
];
function makeLink(t) { return (<a href={SH_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${t} on ADA.gov`}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }
function CalloutPanel({ callout, onClose, panelRef }) { if (!callout) return null; return (<div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'shFade 0.25s ease-out' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: callout.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{callout.id}</span><span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{callout.label}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: callout.color, background: `${callout.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{callout.section}</span></div><button onClick={onClose} aria-label="Close panel" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px' }}>Close <span aria-hidden="true">{'\u2715'}</span></button></div><div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}><div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{callout.plain}</p></div><aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard {'\u2014'} {parseCite(callout.citation)}</p><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(callout.legal)}</p></div></aside></div></div>); }
function KeyFact({ color, number, children }) { return (<div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '6px 0' }}><span style={{ background: color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 700, minWidth: '60px', textAlign: 'center', padding: '3px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>{number}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>{children}</span></div>); }
function Dots({ callouts, active, toggle }) { return callouts.map(c => (<g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>{active === c.id && (<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>)}<circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" /><text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text><circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="sh-focus-ring" /></g>)); }

export default function ShowerDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Accessible Showers</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>{['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}</div>
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 380" role="img" aria-labelledby="sh-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="sh-title">Shower Types {'\u2014'} Transfer and Roll-In</title>
          <rect width="720" height="380" fill="var(--page-bg-subtle)" />
          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Transfer shower (sit and transfer)</text>
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Roll-in shower (wheelchair enters)</text>

          {/* LEFT: Transfer shower */}
          <rect x="60" y="80" width="130" height="130" rx="4" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="2" />
          <text x="125" y="140" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#C2410C" fontWeight="600">36{'\u2033'}{'\u00d7'}36{'\u2033'}</text>
          {/* Seat */}
          <rect x="60" y="80" width="130" height="30" rx="2" fill="#7C3AED" opacity="0.06" stroke="#7C3AED" strokeWidth="1" />
          <text x="125" y="100" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6" fontWeight="600">seat (folding)</text>
          {/* Grab bars */}
          <line x1="57" y1="85" x2="57" y2="205" stroke="#15803D" strokeWidth="3" strokeLinecap="round" />
          <line x1="65" y1="207" x2="185" y2="207" stroke="#15803D" strokeWidth="3" strokeLinecap="round" />
          <text x="30" y="150" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="600" transform="rotate(-90 30 150)">grab bars</text>
          {/* Clear floor space */}
          <rect x="60" y="220" width="130" height="80" rx="2" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1" strokeDasharray="4 3" />
          <text x="125" y="260" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">clear floor</text>
          <text x="125" y="274" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">30{'\u2033'}{'\u00d7'}48{'\u2033'}</text>
          {/* Controls */}
          <rect x="178" y="145" width="12" height="12" rx="2" fill="#B45309" opacity="0.2" stroke="#B45309" strokeWidth="1" />
          <text x="204" y="150" fontFamily="Manrope, sans-serif" fontSize="10" fill="#B45309" fontWeight="500">controls</text>
          <text x="204" y="164" fontFamily="Manrope, sans-serif" fontSize="10" fill="#B45309">{d('38', '965')}{'\u2013'}{d('48', '1220')}</text>
          {/* Threshold */}
          <text x="125" y="320" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B">{'\u00bd'}{'\u2033'} max threshold</text>

          {/* DIVIDER */}
          <line x1="360" y1="20" x2="360" y2="360" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* RIGHT: Roll-in shower */}
          <rect x="400" y="80" width="260" height="110" rx="4" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="2" />
          <text x="530" y="130" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#15803D" fontWeight="600">60{'\u2033'}{'\u00d7'}30{'\u2033'}</text>
          <text x="530" y="148" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D">no curb {'\u2014'} wheelchair rolls in</text>
          {/* Grab bars on 3 walls */}
          <line x1="397" y1="85" x2="397" y2="185" stroke="#15803D" strokeWidth="3" strokeLinecap="round" />
          <line x1="403" y1="187" x2="657" y2="187" stroke="#15803D" strokeWidth="3" strokeLinecap="round" />
          <line x1="663" y1="85" x2="663" y2="185" stroke="#15803D" strokeWidth="3" strokeLinecap="round" />
          <text x="530" y="178" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D">grab bars on 3 walls</text>
          {/* Entry (open side) */}
          <text x="530" y="98" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B">{'\u2191'} open entry (long side)</text>
          {/* Clear floor */}
          <rect x="400" y="200" width="260" height="60" rx="2" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1" strokeDasharray="4 3" />
          <text x="530" y="230" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">clear floor: 30{'\u2033'}{'\u00d7'}60{'\u2033'}</text>
          <text x="530" y="248" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">wheelchair rolls straight in</text>
          {/* Shower spray note */}
          <rect x="400" y="275" width="260" height="40" rx="8" fill="#B45309" opacity="0.05" stroke="#B45309" strokeWidth="1.5" />
          <text x="530" y="293" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#78350F" fontWeight="600">Hand-held spray: 59{'\u2033'} hose min</text>
          <text x="530" y="308" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#78350F">required for all shower types</text>
          {/* Seat */}
          <text x="530" y="338" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6" fontWeight="500">seat: 17{'\u2033'}{'\u2013'}19{'\u2033'} high, holds 250 lbs</text>

          <Dots callouts={CALLOUTS} active={active} toggle={toggle} />
          <text x="20" y="370" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing: ${ac.label}` : ''}</div>
      <CalloutPanel callout={ac} onClose={() => setActive(null)} panelRef={panelRef} />
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Showers</p>
        <KeyFact color="#C2410C" number={`36\u2033\u00d736\u2033`}>Transfer shower size (with seat)</KeyFact>
        <KeyFact color="#15803D" number={`60\u2033\u00d730\u2033`}>Standard roll-in shower (no curb)</KeyFact>
        <KeyFact color="#B45309" number={`${d('38', '965')}\u2013${d('48', '1220')}`}>Control height above shower floor</KeyFact>
        <KeyFact color="#7C3AED" number={d('59', '1500')}>Minimum shower hose length</KeyFact>
      </div>
      <style>{`
        @keyframes shFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .sh-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
