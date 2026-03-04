import React, { useState, useRef, useEffect, useCallback } from 'react';

const ELEV_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#407-elevators';

const CAB_CALLOUTS = [
  { id: 1, label: 'Cab Size & Door Width', section: '\u00a7407.4.1',
    color: '#C2410C', textColor: '#7C2D12', x: 170, y: 52,
    plain: 'Standard elevator cabs must be at least 51 inches deep and 68 inches wide (for center-opening doors) or 51 inches deep and 54 inches wide (for side-opening doors). The door width must be at least 36 inches for center-opening and 32 inches for side-opening. These dimensions ensure a wheelchair user can enter, turn around, and reach the controls.',
    legal: '\u201CInside dimensions of elevator cars shall comply with Table 407.4.1.\u201D Minimum cab: 51\u00d768 inches (center door) or 51\u00d754 inches (side door). Door width: 36 inches (center) or 32 inches (side).',
    citation: '\u00a7407.4.1, \u00a7407.4.3' },
  { id: 2, label: 'Controls & Floor Markings', section: '\u00a7407.4.7',
    color: '#15803D', textColor: '#14532D', x: 540, y: 52,
    plain: 'Car controls must be between 15 and 48 inches above the floor and located on a side wall. Every button must have raised characters and Braille. Floor designations must appear on both door jambs in raised characters and Braille. An emergency two-way communication system is required \u2014 usable without voice (for deaf users) and without vision (for blind users).',
    legal: '\u201CFloor designations shall be provided in the car on both jambs of the elevator car door opening. Characters shall be both raised and Braille.\u201D Controls: \u201CWithin reach ranges per \u00a7308.\u201D Emergency: \u201CTwo-way communication system complying with \u00a7407.4.9.\u201D',
    citation: '\u00a7407.4.7, \u00a7407.4.9' }
];

const SIGNAL_CALLOUTS = [
  { id: 1, label: 'Hall Calls & Signals', section: '\u00a7407.2',
    color: '#7C3AED', textColor: '#5B21B6', x: 170, y: 52,
    plain: 'Call buttons outside the elevator must be no higher than 42 inches above the floor and must have a visible indicator showing the call has been registered. Hall signals must provide both audible and visible cues indicating which car is arriving and which direction it\u2019s going. One chime for up, two for down (or a verbal announcement).',
    legal: '\u201CCall buttons shall be located 42 inches maximum above the finish floor.\u201D \u201CHall signals shall comply with \u00a7407.2.2.\u201D Audible: \u201COne stroke for up, two strokes for down, or annunciators.\u201D',
    citation: '\u00a7407.2.1, \u00a7407.2.2' },
  { id: 2, label: 'Door Timing & Reopening', section: '\u00a7407.3',
    color: '#2563EB', textColor: '#1E3A8A', x: 540, y: 52,
    plain: 'Elevator doors must remain open long enough for a wheelchair user to enter. The minimum is calculated based on a 1.5 feet per second travel speed from the call button to the car. Doors must have reopening devices that prevent closing if they detect an obstruction \u2014 they cannot nudge or force a person through.',
    legal: '\u201CDoor dwell time shall be calculated based on a speed of 1.5 feet per second starting from the hall call button.\u201D \u201CReopening devices shall remain effective for 20 seconds minimum.\u201D',
    citation: '\u00a7407.3.4, \u00a7407.3.3' }
];

function makeLink(t) { return (<a href={ELEV_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }
function CalloutPanel({ callout, onClose, panelRef }) {
  if (!callout) return null;
  return (<div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'elevFade 0.25s ease-out' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: callout.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{callout.id}</span>
        <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{callout.label}</span>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: callout.color, background: `${callout.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{callout.section}</span>
      </div>
      <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px' }}>Close {'\u2715'}</button>
    </div>
    <div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}>
      <div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{callout.plain}</p></div>
      <aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard {'\u2014'} {parseCite(callout.citation)}</p>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(callout.legal)}</p>
      </div></aside>
    </div>
  </div>);
}
function KeyFact({ color, number, children }) { return (<div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '6px 0' }}><span style={{ background: color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 700, minWidth: '60px', textAlign: 'center', padding: '3px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>{number}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>{children}</span></div>); }
function Dots({ callouts, active, toggle }) { return callouts.map(c => (<g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>{active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}<circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" /><text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text></g>)); }

export default function ElevatorDiagram() {
  const [cabActive, setCabActive] = useState(null);
  const [sigActive, setSigActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const cabRef = useRef(null); const sigRef = useRef(null);
  const toggleCab = useCallback(id => { setCabActive(p => p === id ? null : id); setSigActive(null); }, []);
  const toggleSig = useCallback(id => { setSigActive(p => p === id ? null : id); setCabActive(null); }, []);
  useEffect(() => { if (cabActive && cabRef.current) cabRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [cabActive]);
  useEffect(() => { if (sigActive && sigRef.current) sigRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [sigActive]);
  useEffect(() => { const h = e => { if (e.key === 'Escape') { setCabActive(null); setSigActive(null); } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const d = (i, m) => metric ? `${m} mm` : `${i}\u2033`;
  const cabC = CAB_CALLOUTS.find(c => c.id === cabActive);
  const sigC = SIGNAL_CALLOUTS.find(c => c.id === sigActive);
  const unitToggle = (<div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>{['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}</div>);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Inside the Cab</h3>
        {unitToggle}
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 380" role="img" aria-labelledby="elev-cab-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="elev-cab-title">Elevator Cab Dimensions and Control Requirements</title>
          <rect width="720" height="380" fill="var(--page-bg-subtle)" />
          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">How big the cab must be</text>
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">What must be inside</text>

          {/* LEFT: Cab plan view */}
          <rect x="60" y="80" width="230" height="200" rx="4" fill="#C2410C" opacity="0.03" stroke="#475569" strokeWidth="2" />
          {/* Door opening at bottom */}
          <rect x="120" y="274" width="110" height="8" rx="1" fill="var(--page-bg-subtle)" />
          <line x1="120" y1="278" x2="120" y2="286" stroke="#C2410C" strokeWidth="2" />
          <line x1="230" y1="278" x2="230" y2="286" stroke="#C2410C" strokeWidth="2" />

          {/* Door width */}
          <line x1="120" y1="296" x2="230" y2="296" stroke="#C2410C" strokeWidth="1.5" />
          <rect x="136" y="298" width="80" height="18" rx="5" fill="#C2410C" />
          <text x="176" y="311" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('36', '915')} door min</text>

          {/* Width dimension */}
          <line x1="60" y1="330" x2="290" y2="330" stroke="#475569" strokeWidth="1.2" />
          <line x1="60" y1="325" x2="60" y2="335" stroke="#475569" strokeWidth="1.2" />
          <line x1="290" y1="325" x2="290" y2="335" stroke="#475569" strokeWidth="1.2" />
          <rect x="130" y="332" width="80" height="18" rx="5" fill="#475569" />
          <text x="170" y="345" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('68', '1730')} wide</text>

          {/* Depth dimension */}
          <line x1="310" y1="80" x2="310" y2="280" stroke="#475569" strokeWidth="1.2" />
          <line x1="305" y1="80" x2="315" y2="80" stroke="#475569" strokeWidth="1.2" />
          <line x1="305" y1="280" x2="315" y2="280" stroke="#475569" strokeWidth="1.2" />
          <rect x="316" y="168" width="50" height="18" rx="5" fill="#475569" />
          <text x="341" y="181" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('51', '1295')}</text>
          <text x="341" y="198" fontFamily="Manrope, sans-serif" fontSize="10" fill="#475569" fontWeight="600">deep</text>

          {/* Control panel on side wall */}
          <rect x="62" y="120" width="10" height="80" rx="2" fill="#15803D" opacity="0.2" stroke="#15803D" strokeWidth="1.5" />
          <text x="90" y="165" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="600">controls</text>

          {/* Wheelchair */}
          <g transform="translate(130,140) scale(0.65)" opacity="0.4">
            <rect x="0" y="0" width="50" height="40" rx="4" fill="none" stroke="#475569" strokeWidth="2.5" />
            <circle cx="25" cy="20" r="8" fill="#E2E8F0" stroke="#475569" strokeWidth="2" />
            <circle cx="5" cy="48" r="13" fill="none" stroke="#475569" strokeWidth="2" />
            <circle cx="45" cy="48" r="13" fill="none" stroke="#475569" strokeWidth="2" />
          </g>

          {/* DIVIDER */}
          <line x1="380" y1="40" x2="380" y2="340" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* RIGHT: Controls & markings */}
          <rect x="410" y="70" width="280" height="60" rx="10" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="1.5" />
          <text x="550" y="95" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">Buttons: {d('15', '380')}{'\u2013'}{d('48', '1220')} high</text>
          <text x="550" y="115" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D">raised characters + Braille on every button</text>

          <rect x="410" y="148" width="280" height="60" rx="10" fill="#7C3AED" opacity="0.04" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="550" y="173" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#5B21B6" fontWeight="600">Floor numbers on both door jambs</text>
          <text x="550" y="193" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6">raised characters + Braille, both sides</text>

          <rect x="410" y="226" width="280" height="60" rx="10" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1.5" />
          <text x="550" y="251" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#1E3A8A" fontWeight="600">Emergency two-way communication</text>
          <text x="550" y="271" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">works without voice AND without vision</text>

          <Dots callouts={CAB_CALLOUTS} active={cabActive} toggle={toggleCab} />
          <text x="20" y="372" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{cabC ? `Showing: ${cabC.label}` : ''}</div>
      <CalloutPanel callout={cabC} onClose={() => setCabActive(null)} panelRef={cabRef} />
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Inside the Cab</p>
        <KeyFact color="#C2410C" number={`${d('51', '1295')}\u00d7${d('68', '1730')}`}>Minimum cab size (center-opening door)</KeyFact>
        <KeyFact color="#C2410C" number={d('36', '915')}>Minimum door width (center-opening)</KeyFact>
        <KeyFact color="#15803D" number={`${d('15', '380')}\u2013${d('48', '1220')}`}>Control button height range</KeyFact>
      </div>

      {/* DIAGRAM 2: Buttons & Signals */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Buttons & Signals Outside</h3>
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 320" role="img" aria-labelledby="elev-sig-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="elev-sig-title">Elevator Hall Call Buttons and Signal Requirements</title>
          <rect width="720" height="320" fill="var(--page-bg-subtle)" />
          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Calling the elevator</text>
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">When the elevator arrives</text>

          {/* LEFT: Call buttons */}
          {/* Wall */}
          <rect x="140" y="60" width="12" height="220" rx="1" fill="#CBD5E1" />
          {/* Button panel */}
          <rect x="155" y="140" width="30" height="50" rx="4" fill="white" stroke="#7C3AED" strokeWidth="1.5" />
          <circle cx="170" cy="155" r="6" fill="#7C3AED" opacity="0.2" stroke="#7C3AED" strokeWidth="1" />
          <circle cx="170" cy="175" r="6" fill="#7C3AED" opacity="0.2" stroke="#7C3AED" strokeWidth="1" />
          <text x="170" y="157" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6" fontWeight="700">{'\u25b2'}</text>
          <text x="170" y="178" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6" fontWeight="700">{'\u25bc'}</text>

          {/* 42" max height */}
          <line x1="200" y1="140" x2="200" y2="280" stroke="#7C3AED" strokeWidth="1.2" strokeDasharray="3 3" />
          <rect x="206" y="150" width="70" height="22" rx="6" fill="#7C3AED" />
          <text x="241" y="165" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('42', '1065')} max</text>

          {/* Floor line */}
          <line x1="100" y1="280" x2="290" y2="280" stroke="#94A3B8" strokeWidth="2" />

          {/* Visible indicator note */}
          <rect x="50" y="80" width="230" height="35" rx="8" fill="#B45309" opacity="0.04" stroke="#B45309" strokeWidth="1.5" />
          <text x="165" y="100" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#78350F" fontWeight="600">must show visible confirmation of call</text>

          {/* DIVIDER */}
          <line x1="360" y1="40" x2="360" y2="300" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* RIGHT: Arrival signals */}
          <rect x="400" y="70" width="280" height="55" rx="10" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="1.5" />
          <text x="540" y="93" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">Visible: light or arrow shows direction</text>
          <text x="540" y="112" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D">{d('2\u00bd', '64')} min character height</text>

          <rect x="400" y="142" width="280" height="55" rx="10" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1.5" />
          <text x="540" y="165" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#1E3A8A" fontWeight="600">Audible: chimes announce direction</text>
          <text x="540" y="184" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">1 chime = up, 2 chimes = down</text>

          <rect x="400" y="214" width="280" height="55" rx="10" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1.5" />
          <text x="540" y="237" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#7C2D12" fontWeight="600">Door stays open long enough to enter</text>
          <text x="540" y="256" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12">based on 1.5 ft/sec from call button to car</text>

          <Dots callouts={SIGNAL_CALLOUTS} active={sigActive} toggle={toggleSig} />
          <text x="20" y="308" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{sigC ? `Showing: ${sigC.label}` : ''}</div>
      <CalloutPanel callout={sigC} onClose={() => setSigActive(null)} panelRef={sigRef} />
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Buttons & Signals</p>
        <KeyFact color="#7C3AED" number={d('42', '1065')}>Maximum height for hall call buttons</KeyFact>
        <KeyFact color="#15803D" number="See + Hear">Arrival signals must be both visible and audible</KeyFact>
        <KeyFact color="#2563EB" number="1 / 2">One chime for up, two chimes for down</KeyFact>
      </div>

      <style>{`
        @keyframes elevFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
