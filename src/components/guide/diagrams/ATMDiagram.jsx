import React, { useState, useRef, useEffect, useCallback } from 'react';
const ATM_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#707-automatic-teller-machines-and-fare-machines';
const CALLOUTS = [
  { id: 1, label: 'Physical Access', section: '\u00a7707.3', color: '#C2410C', textColor: '#7C2D12', x: 100, y: 52, plain: 'A clear floor space of 30\u00d748 inches for forward approach must be provided. All operable parts \u2014 card slot, keypad, receipt slot, cash dispenser \u2014 must be within 48 inches of the floor. The display screen must be visible from a point 40 inches above the floor center, readable without requiring the user to stand. Privacy shields must not block wheelchair approach.', legal: '\u201CClear floor or ground space complying with \u00a7305 shall be provided.\u201D \u201COperable parts shall comply with \u00a7309.\u201D Display: \u201CVisible from a point determined by a horizontal line 40 inches above the center of the clear floor space.\u201D', citation: '\u00a7707.3, \u00a7707.4' },
  { id: 2, label: 'Speech, Braille & Input', section: '\u00a7707.5', color: '#15803D', textColor: '#14532D', x: 470, y: 52, plain: 'The machine must speak \u2014 reading aloud all on-screen text, instructions, and transaction prompts through a standard headphone jack (3.5mm) so blind users can operate it privately. Braille operating instructions must be provided. The keypad must have a raised tactile dot on the \u201C5\u201D key (like a phone). Speech volume must be adjustable. The system must allow all transactions available to sighted users.', legal: '\u201CMachines shall be speech enabled.\u201D \u201COperating instructions shall be provided in Braille.\u201D \u201CSpeech output shall be delivered through a mechanism readily available to all users, including an industry standard connector.\u201D Input: \u201CTactilely discernible without activation.\u201D', citation: '\u00a7707.5, \u00a7707.6' }
];
function makeLink(t) { return (<a href={ATM_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${t} on ADA.gov`}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }
function CalloutPanel({ callout, onClose, panelRef }) { if (!callout) return null; return (<div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'atmFade 0.25s ease-out' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: callout.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{callout.id}</span><span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{callout.label}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: callout.color, background: `${callout.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{callout.section}</span></div><button onClick={onClose} aria-label="Close panel" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px' }}>Close <span aria-hidden="true">{'\u2715'}</span></button></div><div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}><div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{callout.plain}</p></div><aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard {'\u2014'} {parseCite(callout.citation)}</p><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(callout.legal)}</p></div></aside></div></div>); }
function KeyFact({ color, number, children }) { return (<div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '6px 0' }}><span style={{ background: color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 700, minWidth: '60px', textAlign: 'center', padding: '3px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>{number}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>{children}</span></div>); }
function Dots({ callouts, active, toggle }) { return callouts.map(c => (<g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>{active === c.id && (<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>)}<circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" /><text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text><circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="atm-focus-ring" /></g>)); }

export default function ATMDiagram() {
  const [active, setActive] = useState(null);
  const panelRef = useRef(null);
  const toggle = useCallback((id) => setActive(prev => prev === id ? null : id), []);
  useEffect(() => { if (active && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [active]);
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') setActive(null); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const ac = CALLOUTS.find(c => c.id === active);
  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ marginBottom: '8px' }}><h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>ATMs & Fare Machines</h3></div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 340" role="img" aria-labelledby="atm-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="atm-title">ATM and Fare Machine Accessibility Requirements</title>
          <rect width="720" height="340" fill="var(--page-bg-subtle)" />
          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Physical access</text>
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Blind/low vision access</text>

          {/* LEFT: Physical */}
          {/* ATM machine */}
          <rect x="120" y="80" width="100" height="170" rx="6" fill="#94A3B8" opacity="0.08" stroke="#94A3B8" strokeWidth="1.5" />
          <rect x="135" y="95" width="70" height="40" rx="3" fill="#C2410C" opacity="0.06" stroke="#C2410C" strokeWidth="1" />
          <text x="170" y="118" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C">screen</text>
          <rect x="140" y="150" width="60" height="30" rx="2" fill="#475569" opacity="0.06" stroke="#475569" strokeWidth="1" />
          <text x="170" y="169" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#475569">keypad</text>
          <rect x="155" y="195" width="30" height="10" rx="2" fill="#475569" opacity="0.1" />
          <text x="170" y="220" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#475569">cash slot</text>

          {/* 48" max */}
          <line x1="240" y1="95" x2="240" y2="260" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="234" y1="95" x2="246" y2="95" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="234" y1="260" x2="246" y2="260" stroke="#C2410C" strokeWidth="1.2" />
          <rect x="248" y="168" width="70" height="20" rx="6" fill="#C2410C" />
          <text x="283" y="182" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{'\u2264'} 48{'\u2033'}</text>
          <text x="283" y="200" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="500">all controls</text>

          {/* Wheelchair */}
          <g transform="translate(40,140)" opacity="0.5">
            <circle cx="20" cy="0" r="8" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
            <line x1="20" y1="9" x2="20" y2="35" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="20" x2="35" y2="30" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="10" cy="46" r="7" fill="none" stroke="#475569" strokeWidth="1.2" />
            <circle cx="30" cy="46" r="7" fill="none" stroke="#475569" strokeWidth="1.2" />
          </g>

          {/* Floor */}
          <line x1="20" y1="260" x2="330" y2="260" stroke="#94A3B8" strokeWidth="2" />
          <text x="170" y="282" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B">30{'\u2033'}{'\u00d7'}48{'\u2033'} clear floor</text>

          {/* DIVIDER */}
          <line x1="370" y1="20" x2="370" y2="320" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* RIGHT: Vision access */}
          <rect x="400" y="70" width="280" height="50" rx="10" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="1.5" />
          <text x="540" y="92" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">Must speak all on-screen text</text>
          <text x="540" y="108" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D">through headphone jack (3.5mm) for privacy</text>

          <rect x="400" y="135" width="280" height="50" rx="10" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1.5" />
          <text x="540" y="157" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#7C2D12" fontWeight="600">Braille instructions required</text>
          <text x="540" y="173" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12">operating instructions on the machine</text>

          <rect x="400" y="200" width="280" height="50" rx="10" fill="#7C3AED" opacity="0.04" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="540" y="222" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#5B21B6" fontWeight="600">Raised dot on the {'\u201c'}5{'\u201d'} key</text>
          <text x="540" y="238" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6">tactile keypad orientation (like a phone)</text>

          <rect x="400" y="265" width="280" height="40" rx="10" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1.5" />
          <text x="540" y="289" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#1E3A8A" fontWeight="600">All transactions available by speech</text>

          <Dots callouts={CALLOUTS} active={active} toggle={toggle} />
          <text x="20" y="330" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing: ${ac.label}` : ''}</div>
      <CalloutPanel callout={ac} onClose={() => setActive(null)} panelRef={panelRef} />
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} ATMs & Fare Machines</p>
        <KeyFact color="#C2410C" number={`\u2264 48\u2033`}>All controls within reach range</KeyFact>
        <KeyFact color="#15803D" number="Speech">Must read all screen content aloud via headphone jack</KeyFact>
        <KeyFact color="#7C3AED" number="Braille">Operating instructions in Braille on the machine</KeyFact>
        <KeyFact color="#2563EB" number="Tactile">{`Raised dot on "5" key for orientation`}</KeyFact>
      </div>
      <style>{`
        @keyframes atmFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .atm-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
