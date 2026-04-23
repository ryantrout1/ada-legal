import React, { useState, useRef, useEffect, useCallback } from 'react';
const SIG_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#703-signs';
const CALLOUTS = [
  { id: 1, label: 'Tactile Signs (Room IDs)', section: '\u00a7703.2', color: '#C2410C', textColor: '#7C2D12', x: 100, y: 52, plain: 'Room identification signs (restrooms, room numbers, exits) require raised characters at least 1/32 inch high, Grade 2 Braille below the text, sans serif uppercase letters with high contrast. They must be mounted on the latch side of the door at 48\u201360 inches above the floor to the baseline of the lowest character. This placement lets a person who is blind find the sign by sweeping the wall beside the door.', legal: 'Raised characters: \u201C1/32 inch minimum above their background.\u201D Braille: \u201Cshall be Grade 2.\u201D Mounting: \u201C48 inches minimum to the baseline of the lowest tactile character and 60 inches maximum to the baseline of the highest.\u201D', citation: '\u00a7703.2, \u00a7703.3, \u00a7703.4' },
  { id: 2, label: 'Visual Signs (Directional)', section: '\u00a7703.5', color: '#15803D', textColor: '#14532D', x: 470, y: 52, plain: 'Directional and informational signs (like \u201CRestrooms \u2192\u201D or \u201CExit\u201D overhead) need large, high-contrast characters sized by viewing distance \u2014 minimum 5/8 inch for under 6 feet, scaling up for longer distances. Non-glare finish required. These do NOT need Braille or raised characters because they\u2019re read visually from a distance, not by touch. The International Symbol of Accessibility must appear on signs for accessible facilities.', legal: '\u00a7703.5: Characters based on viewing distance. \u201CNon-glare finish. Characters shall contrast with their background.\u201D Pictograms: \u201CAccessible elements shall be identified by the International Symbol of Accessibility.\u201D', citation: '\u00a7703.5, \u00a7703.7' }
];
function makeLink(t) { return (<a href={SIG_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${t} on ADA.gov`}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }
function CalloutPanel({ callout, onClose, panelRef }) { if (!callout) return null; return (<div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'sigFade 0.25s ease-out' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: callout.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{callout.id}</span><span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{callout.label}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: callout.color, background: `${callout.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{callout.section}</span></div><button onClick={onClose} aria-label="Close panel" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px' }}>Close <span aria-hidden="true">{'\u2715'}</span></button></div><div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}><div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{callout.plain}</p></div><aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard {'\u2014'} {parseCite(callout.citation)}</p><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(callout.legal)}</p></div></aside></div></div>); }
function KeyFact({ color, number, children }) { return (<div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '6px 0' }}><span style={{ background: color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 700, minWidth: '60px', textAlign: 'center', padding: '3px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>{number}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>{children}</span></div>); }
function Dots({ callouts, active, toggle }) { return callouts.map(c => (<g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>{active === c.id && (<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>)}<circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" /><text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text><circle cx={c.x} cy={c.y} r="22" fill="none" stroke="transparent" strokeWidth="2" className="sig-focus-ring" /></g>)); }

export default function SignageDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Two Types of Signs</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>{['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}</div>
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 380" role="img" aria-labelledby="sig-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="sig-title">Signage Types {'\u2014'} Tactile Room Signs vs Visual Directional Signs</title>
          <rect width="720" height="380" fill="var(--page-bg-subtle)" />
          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Tactile (touch to read)</text>
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Visual (read from a distance)</text>

          {/* LEFT: Tactile room sign */}
          {/* Wall with door */}
          <rect x="60" y="70" width="12" height="260" fill="#CBD5E1" rx="2" />
          <rect x="72" y="100" width="60" height="200" fill="#94A3B8" opacity="0.08" stroke="#94A3B8" strokeWidth="1" rx="2" />
          <text x="102" y="200" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#94A3B8">door</text>

          {/* Sign on latch side */}
          <rect x="140" y="150" width="80" height="60" rx="6" fill="#C2410C" opacity="0.08" stroke="#C2410C" strokeWidth="2" />
          <text x="180" y="172" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="14" fill="#7C2D12" fontWeight="700">205</text>
          <text x="180" y="192" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12">raised + Braille</text>

          {/* Mounting height */}
          <line x1="240" y1="170" x2="240" y2="330" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="234" y1="170" x2="246" y2="170" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="234" y1="330" x2="246" y2="330" stroke="#C2410C" strokeWidth="1.2" />
          <rect x="248" y="230" width="86" height="20" rx="6" fill="#C2410C" />
          <text x="291" y="244" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('48', '1220')}{'\u2013'}{d('60', '1525')}</text>
          <text x="291" y="264" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="500">mounting height</text>

          {/* Latch side note */}
          <text x="180" y="130" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="600">latch side of door</text>

          {/* Requirements */}
          <text x="180" y="280" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B">raised letters + Grade 2 Braille</text>
          <text x="180" y="296" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B">sans serif, uppercase, high contrast</text>

          {/* Floor */}
          <line x1="40" y1="330" x2="340" y2="330" stroke="#94A3B8" strokeWidth="2" />

          {/* DIVIDER */}
          <line x1="370" y1="20" x2="370" y2="360" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* RIGHT: Visual directional sign */}
          {/* Overhead sign */}
          <rect x="430" y="80" width="220" height="50" rx="8" fill="#15803D" opacity="0.08" stroke="#15803D" strokeWidth="2" />
          <text x="540" y="105" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="16" fill="#14532D" fontWeight="700">Restrooms {'\u2192'}</text>
          <text x="540" y="122" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D">large text, high contrast, non-glare</text>

          {/* No Braille needed */}
          <rect x="430" y="150" width="220" height="32" rx="8" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="1" />
          <text x="540" y="170" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">No Braille needed on directional signs</text>

          {/* Size by distance */}
          <rect x="430" y="200" width="220" height="48" rx="8" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1" />
          <text x="540" y="220" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#1E3A8A" fontWeight="600">Text size based on viewing distance</text>
          <text x="540" y="238" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">{'\u2265'} 5/8{'\u2033'} for under 6 feet, larger for farther</text>

          {/* Accessibility symbol */}
          <rect x="430" y="266" width="220" height="48" rx="8" fill="#7C3AED" opacity="0.04" stroke="#7C3AED" strokeWidth="1" />
          <text x="540" y="286" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#5B21B6" fontWeight="600">Accessibility symbol required</text>
          <text x="540" y="304" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6">on signs for accessible facilities</text>

          <Dots callouts={CALLOUTS} active={active} toggle={toggle} />
          <text x="20" y="370" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing: ${ac.label}` : ''}</div>
      <CalloutPanel callout={ac} onClose={() => setActive(null)} panelRef={panelRef} />
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Signs</p>
        <KeyFact color="#C2410C" number={`${d('48', '1220')}\u2013${d('60', '1525')}`}>Mounting height for tactile room signs (baseline to floor)</KeyFact>
        <KeyFact color="#C2410C" number="Braille">Grade 2 Braille required on all room identification signs</KeyFact>
        <KeyFact color="#15803D" number="No Braille">Directional/informational signs need large text, not Braille</KeyFact>
        <KeyFact color="#2563EB" number="Latch side">Tactile signs go next to the door, on the latch (handle) side</KeyFact>
      </div>
      <style>{`
        @keyframes sigFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .sig-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
