import React, { useState, useRef, useEffect, useCallback } from 'react';
const ALS_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#706-assistive-listening-systems';
const CALLOUTS = [
  { id: 1, label: 'System Types & Receivers', section: '\u00a7706', color: '#C2410C', textColor: '#7C2D12', x: 100, y: 52, plain: 'Three main types: hearing loops (induction \u2014 works directly with hearing aids via T-coil), FM systems (radio frequency \u2014 requires a receiver), and infrared systems (light-based \u2014 requires a receiver, works well for privacy). At least 25% of receivers must be hearing-aid compatible (neckloop or T-coil coupling). The system must provide an adequate signal-to-noise ratio throughout the seating area.', legal: '\u201CReceivers required for use with an assistive listening system shall be hearing-aid compatible.\u201D At least 25% of receivers per \u00a7219.3. System must cover the assembly seating area.', citation: '\u00a7706.2, \u00a7219.3' },
  { id: 2, label: 'Where Required & Signage', section: '\u00a7219', color: '#15803D', textColor: '#14532D', x: 470, y: 52, plain: 'Required in assembly areas where audio communication is integral \u2014 theaters, courtrooms, meeting rooms, lecture halls, houses of worship (when they have amplification). The number of receivers depends on seating capacity: up to 50 seats = 2 receivers, 51\u2013200 = capacity \u00d7 4% + 2, etc. Signs with the International Symbol of Access for Hearing Loss must be posted at the entrance and box office/reception.', legal: '\u00a7219.2: \u201CAssembly areas where audible communication is integral to the use shall have an assistive listening system.\u201D Signage: \u201CAssistive listening systems shall be identified by the International Symbol of Access for Hearing Loss.\u201D', citation: '\u00a7219, \u00a7706.3' }
];
function makeLink(t) { return (<a href={ALS_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${t} on ADA.gov`}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }
function CalloutPanel({ callout, onClose, panelRef }) { if (!callout) return null; return (<div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'alsFade 0.25s ease-out' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: callout.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{callout.id}</span><span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{callout.label}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: callout.color, background: `${callout.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{callout.section}</span></div><button onClick={onClose} aria-label="Close panel" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px' }}>Close <span aria-hidden="true">{'\u2715'}</span></button></div><div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}><div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{callout.plain}</p></div><aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard {'\u2014'} {parseCite(callout.citation)}</p><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(callout.legal)}</p></div></aside></div></div>); }
function KeyFact({ color, number, children }) { return (<div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '6px 0' }}><span style={{ background: color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 700, minWidth: '60px', textAlign: 'center', padding: '3px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>{number}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>{children}</span></div>); }
function Dots({ callouts, active, toggle }) { return callouts.map(c => (<g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>{active === c.id && (<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>)}<circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" /><text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text><circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="als-focus-ring" /></g>)); }

export default function AssistiveListeningDiagram() {
  const [active, setActive] = useState(null);
  const panelRef = useRef(null);
  const toggle = useCallback((id) => setActive(prev => prev === id ? null : id), []);
  useEffect(() => { if (active && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [active]);
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') setActive(null); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const ac = CALLOUTS.find(c => c.id === active);
  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ marginBottom: '8px' }}><h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Assistive Listening Systems</h3></div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 320" role="img" aria-labelledby="als-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="als-title">Assistive Listening System Types and Requirements</title>
          <rect width="720" height="320" fill="var(--page-bg-subtle)" />
          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Three system types</text>
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Where required</text>

          {/* LEFT: System types */}
          <rect x="40" y="70" width="280" height="50" rx="10" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1.5" />
          <text x="180" y="92" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#7C2D12" fontWeight="600">Hearing loop (induction)</text>
          <text x="180" y="108" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12">works directly with hearing aid T-coil</text>

          <rect x="40" y="135" width="280" height="50" rx="10" fill="#7C3AED" opacity="0.04" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="180" y="157" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#5B21B6" fontWeight="600">FM system (radio frequency)</text>
          <text x="180" y="173" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6">requires handheld receiver</text>

          <rect x="40" y="200" width="280" height="50" rx="10" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1.5" />
          <text x="180" y="222" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#1E3A8A" fontWeight="600">Infrared (light-based)</text>
          <text x="180" y="238" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">good for privacy, requires receiver</text>

          <text x="180" y="278" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="600">25% of receivers must be hearing-aid compatible</text>

          {/* DIVIDER */}
          <line x1="370" y1="20" x2="370" y2="300" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* RIGHT: Where required */}
          <rect x="400" y="70" width="280" height="40" rx="10" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="1.5" />
          <text x="540" y="95" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">Theaters and cinemas</text>

          <rect x="400" y="122" width="280" height="40" rx="10" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="1.5" />
          <text x="540" y="147" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">Courtrooms and hearing rooms</text>

          <rect x="400" y="174" width="280" height="40" rx="10" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="1.5" />
          <text x="540" y="199" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">Meeting rooms and lecture halls</text>

          <rect x="400" y="226" width="280" height="40" rx="10" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="1.5" />
          <text x="540" y="251" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">Houses of worship (with amplification)</text>

          <text x="540" y="290" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C3AED" fontWeight="600">Sign with hearing loss symbol must be posted</text>

          <Dots callouts={CALLOUTS} active={active} toggle={toggle} />
          <text x="20" y="312" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing: ${ac.label}` : ''}</div>
      <CalloutPanel callout={ac} onClose={() => setActive(null)} panelRef={panelRef} />
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Assistive Listening</p>
        <KeyFact color="#C2410C" number="25%">Minimum receivers that must be hearing-aid compatible</KeyFact>
        <KeyFact color="#15803D" number="3 types">Hearing loop, FM, or infrared {'\u2014'} facility chooses</KeyFact>
        <KeyFact color="#7C3AED" number="Sign">International Symbol of Access for Hearing Loss must be posted</KeyFact>
      </div>
      <style>{`
        @keyframes alsFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .als-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
