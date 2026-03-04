import React, { useState, useRef, useEffect, useCallback } from 'react';

const STD_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#410-platform-lifts';

const LIFT_CALLOUTS = [
  {
    id: 1, label: 'Platform Size & Controls', section: '\u00a7410.2',
    color: '#C2410C', textColor: '#7C2D12', x: 100, y: 52,
    plain: 'The platform must provide a clear floor space at least 36 inches wide by 48 inches deep. If entered from the narrow end, it must be 36 \u00d7 60 inches to allow a wheelchair user to turn and exit forward. Controls must be operable with one hand, no grasping or twisting, 5 pounds max force, and located between 15 and 48 inches above the floor. The lift must NOT require an attendant \u2014 the user must be able to call and operate it independently.',
    legal: '\u201CPlatform lifts shall provide a clear floor space complying with \u00a7305.\u201D Controls: \u201COperable parts shall comply with \u00a7309.\u201D \u201CPlatform lifts shall not be attendant-operated.\u201D',
    citation: '\u00a7410.2, \u00a7410.1'
  },
  {
    id: 2, label: 'Doors, Surface & Safety', section: '\u00a7410.3',
    color: '#15803D', textColor: '#14532D', x: 470, y: 52,
    plain: 'Doors and gates must provide at least 32 inches clear width and not require tight grasping to operate. The platform floor must be firm, stable, and slip-resistant. The gap between the platform edge and the landing must not exceed \u00be inch. All lifts must comply with ASME A18.1 safety standards, including enclosure walls, grab bars, emergency stop controls, non-skid surfaces, and a maximum speed of 12 inches per second.',
    legal: '\u201CPlatform lifts shall comply with ASME A18.1.\u201D Floor surfaces: \u201Cshall comply with \u00a7302.\u201D Gap: per ASME A18.1, maximum \u00be inch between platform and landing.',
    citation: '\u00a7410.1, \u00a7410.3'
  }
];

const USE_CALLOUTS = [
  {
    id: 1, label: 'Where Lifts Are Allowed', section: '\u00a7206.7',
    color: '#7C3AED', textColor: '#5B21B6', x: 100, y: 52,
    plain: 'Platform lifts can replace ramps or elevators only in specific situations: performance stages and speaker platforms, wheelchair spaces in assembly areas, small rooms with 5 or fewer occupants, courtrooms, existing buildings where a ramp or elevator is impractical, and certain recreation facilities. They are NOT a substitute for elevators in new multi-story construction unless one of these exceptions applies.',
    legal: '\u00a7206.7: \u201CPlatform lifts shall be permitted as a component of an accessible route\u201D in performance areas (\u00a7206.7.1), assembly wheelchair spaces (\u00a7206.7.2), incidental spaces (\u00a7206.7.3), judicial spaces (\u00a7206.7.4), existing buildings (\u00a7206.7.5), and recreation (\u00a7206.7.8-10).',
    citation: '\u00a7206.7'
  },
  {
    id: 2, label: 'Common Problems', section: '\u00a7410',
    color: '#C2410C', textColor: '#7C2D12', x: 470, y: 52,
    plain: 'The most frequent violations include: lifts that require a key or attendant to operate, controls mounted too high or requiring tight grasping, platforms too small for a wheelchair to turn, gaps between platform and landing exceeding \u00be inch, broken or out-of-service lifts with no alternative accessible route, and lifts used in new construction where an elevator is required.',
    legal: 'Advisory \u00a7410: Platform lifts must be maintained in operable working condition per \u00a7105.2.2. A broken lift with no alternative route is a denial of access.',
    citation: '\u00a7410'
  }
];

function makeLink(t) { return (<a href={STD_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${t} on ADA.gov`}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

function CalloutPanel({ callout, onClose, panelRef }) {
  if (!callout) return null;
  return (
    <div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'plFade 0.25s ease-out' }}>
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
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard {'\u2014'} {parseCite(callout.citation)}</p>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(callout.legal)}</p>
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

function Dots({ callouts, active, toggle }) {
  return callouts.map(c => (
    <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
      {active === c.id && (<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>)}
      <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" />
      <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
      <circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="pl-focus-ring" />
    </g>
  ));
}


export default function PlatformLiftDiagram() {
  const [liftActive, setLiftActive] = useState(null);
  const [useActive, setUseActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const liftRef = useRef(null);
  const useRef2 = useRef(null);

  const toggleLift = useCallback((id) => { setLiftActive(prev => prev === id ? null : id); setUseActive(null); }, []);
  const toggleUse = useCallback((id) => { setUseActive(prev => prev === id ? null : id); setLiftActive(null); }, []);

  useEffect(() => { if (liftActive && liftRef.current) liftRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [liftActive]);
  useEffect(() => { if (useActive && useRef2.current) useRef2.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [useActive]);
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') { setLiftActive(null); setUseActive(null); } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);

  const d = (inches, mm) => metric ? `${mm} mm` : `${inches}\u2033`;
  const liftCallout = LIFT_CALLOUTS.find(c => c.id === liftActive);
  const useCallout = USE_CALLOUTS.find(c => c.id === useActive);

  const unitToggle = (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
      {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}
    </div>
  );

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>

      {/* DIAGRAM 1: How It Works */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>How a Platform Lift Works</h3>
        {unitToggle}
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 380" role="img" aria-labelledby="lift-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="lift-title">Platform Lift {'\u2014'} Side View and Plan View</title>
          <rect width="720" height="380" fill="var(--page-bg-subtle)" />

          {/* LEFT: Side elevation */}
          <text x="180" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Side view</text>

          {/* Upper floor */}
          <rect x="40" y="100" width="140" height="10" fill="#94A3B8" opacity="0.3" rx="2" />
          <text x="110" y="92" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B" fontWeight="600">upper level</text>

          {/* Lower floor */}
          <rect x="40" y="310" width="140" height="10" fill="#94A3B8" opacity="0.3" rx="2" />
          <rect x="220" y="310" width="110" height="10" fill="#94A3B8" opacity="0.3" rx="2" />
          <text x="275" y="302" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B" fontWeight="600">lower level</text>

          {/* Lift shaft */}
          <rect x="180" y="100" width="80" height="220" fill="#7C3AED" opacity="0.03" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="6 3" />
          <line x1="180" y1="100" x2="180" y2="320" stroke="#94A3B8" strokeWidth="2" />
          <line x1="260" y1="140" x2="260" y2="310" stroke="#94A3B8" strokeWidth="2" />

          {/* Platform (mid-travel) */}
          <rect x="184" y="210" width="72" height="8" rx="2" fill="#C2410C" opacity="0.25" stroke="#C2410C" strokeWidth="1.5" />

          {/* Wheelchair silhouette on platform */}
          <g transform="translate(200,165)" opacity="0.6">
            <circle cx="20" cy="0" r="8" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
            <line x1="20" y1="10" x2="20" y2="30" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="40" r="6" fill="none" stroke="#475569" strokeWidth="1.2" />
            <circle cx="28" cy="40" r="6" fill="none" stroke="#475569" strokeWidth="1.2" />
          </g>

          {/* Travel arrows */}
          <line x1="280" y1="130" x2="280" y2="290" stroke="#7C3AED" strokeWidth="1.5" strokeDasharray="4 3" />
          <polygon points="280,125 276,135 284,135" fill="#7C3AED" opacity="0.6" />
          <polygon points="280,295 276,285 284,285" fill="#7C3AED" opacity="0.6" />
          <text x="300" y="215" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6" fontWeight="600">travel</text>

          {/* Door labels */}
          <line x1="180" y1="100" x2="180" y2="138" stroke="#2563EB" strokeWidth="2.5" />
          <text x="168" y="125" textAnchor="end" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A" fontWeight="600">door</text>

          <line x1="260" y1="270" x2="260" y2="310" stroke="#2563EB" strokeWidth="2.5" />
          <text x="272" y="295" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A" fontWeight="600">door</text>

          {/* Control panel */}
          <rect x="185" y="190" width="10" height="16" rx="2" fill="#C2410C" opacity="0.2" stroke="#C2410C" strokeWidth="1" />
          <text x="175" y="203" textAnchor="end" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="600">controls</text>


          {/* DIVIDER */}
          <line x1="360" y1="20" x2="360" y2="360" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />


          {/* RIGHT: Plan view (top down) */}
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Top-down view</text>

          {/* Platform rectangle */}
          <rect x="430" y="80" width="140" height="200" rx="4" fill="#7C3AED" opacity="0.04" stroke="#94A3B8" strokeWidth="2" />

          {/* Clear floor space inside */}
          <rect x="445" y="105" width="110" height="150" rx="2" fill="#15803D" opacity="0.05" stroke="#15803D" strokeWidth="1.5" strokeDasharray="4 3" />

          {/* Width dimension */}
          <line x1="445" y1="270" x2="555" y2="270" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="445" y1="264" x2="445" y2="276" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="555" y1="264" x2="555" y2="276" stroke="#C2410C" strokeWidth="1.5" />
          <rect x="470" y="278" width="64" height="20" rx="6" fill="#C2410C" />
          <text x="502" y="292" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('36', '915')} min</text>

          {/* Depth dimension */}
          <line x1="575" y1="105" x2="575" y2="255" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="569" y1="105" x2="581" y2="105" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="569" y1="255" x2="581" y2="255" stroke="#C2410C" strokeWidth="1.5" />
          <rect x="586" y="168" width="64" height="20" rx="6" fill="#C2410C" />
          <text x="618" y="182" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('48', '1220')} min</text>

          {/* Door opening */}
          <line x1="460" y1="80" x2="530" y2="80" stroke="#2563EB" strokeWidth="3" />
          <text x="495" y="72" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A" fontWeight="600">{d('32', '815')} door min</text>

          {/* Grab bar */}
          <line x1="435" y1="105" x2="435" y2="255" stroke="#15803D" strokeWidth="3" strokeLinecap="round" />
          <text x="422" y="185" textAnchor="end" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="600">grab bar</text>

          {/* Gap callout */}
          <text x="495" y="100" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B">{'\u00be'}{'\u2033'} max gap</text>

          {/* Wheelchair top-view */}
          <g transform="translate(478,150)" opacity="0.4">
            <rect x="0" y="0" width="40" height="50" rx="4" fill="none" stroke="#475569" strokeWidth="1.5" />
            <circle cx="8" cy="48" r="8" fill="none" stroke="#475569" strokeWidth="1" />
            <circle cx="32" cy="48" r="8" fill="none" stroke="#475569" strokeWidth="1" />
            <circle cx="20" cy="10" r="6" fill="#E2E8F0" stroke="#475569" strokeWidth="1" />
          </g>

          <text x="500" y="320" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="500">clear floor space</text>

          <Dots callouts={LIFT_CALLOUTS} active={liftActive} toggle={toggleLift} />
          <text x="20" y="368" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{liftCallout ? `Showing: ${liftCallout.label}` : ''}</div>
      <CalloutPanel callout={liftCallout} onClose={() => setLiftActive(null)} panelRef={liftRef} />

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Platform Lifts</p>
        <KeyFact color="#C2410C" number={`${d('36', '915')}\u00d7${d('48', '1220')}`}>Minimum clear floor space on the platform</KeyFact>
        <KeyFact color="#2563EB" number={`${d('32', '815')}`}>Minimum clear door width</KeyFact>
        <KeyFact color="#15803D" number={`\u00be${d('', '')}`}>Maximum gap between platform edge and landing ({'\u00be'} inch)</KeyFact>
        <KeyFact color="#7C3AED" number="Self-op">Must be operable by the user {'\u2014'} no attendant required</KeyFact>
      </div>


      {/* DIAGRAM 2: Where They're Allowed */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Where Lifts Are Allowed</h3>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 300" role="img" aria-labelledby="use-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="use-title">Platform Lift Permitted Locations</title>
          <rect width="720" height="300" fill="var(--page-bg-subtle)" />

          {/* LEFT: Permitted uses */}
          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="#15803D">Lifts OK here {'\u2714'}</text>

          {/* Use case boxes */}
          <rect x="40" y="65" width="130" height="44" rx="8" fill="#15803D" opacity="0.05" stroke="#15803D" strokeWidth="1.5" />
          <text x="105" y="85" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">Stages &</text>
          <text x="105" y="100" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">platforms</text>

          <rect x="185" y="65" width="130" height="44" rx="8" fill="#15803D" opacity="0.05" stroke="#15803D" strokeWidth="1.5" />
          <text x="250" y="85" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">Wheelchair</text>
          <text x="250" y="100" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">seating areas</text>

          <rect x="40" y="125" width="130" height="44" rx="8" fill="#15803D" opacity="0.05" stroke="#15803D" strokeWidth="1.5" />
          <text x="105" y="145" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">Existing</text>
          <text x="105" y="160" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">buildings</text>

          <rect x="185" y="125" width="130" height="44" rx="8" fill="#15803D" opacity="0.05" stroke="#15803D" strokeWidth="1.5" />
          <text x="250" y="145" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">Small rooms</text>
          <text x="250" y="160" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">({'\u2264'} 5 people)</text>

          <rect x="40" y="185" width="130" height="44" rx="8" fill="#15803D" opacity="0.05" stroke="#15803D" strokeWidth="1.5" />
          <text x="105" y="212" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">Courtrooms</text>

          <rect x="185" y="185" width="130" height="44" rx="8" fill="#15803D" opacity="0.05" stroke="#15803D" strokeWidth="1.5" />
          <text x="250" y="205" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">Recreation</text>
          <text x="250" y="220" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">facilities</text>


          {/* DIVIDER */}
          <line x1="360" y1="20" x2="360" y2="280" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />


          {/* RIGHT: NOT permitted */}
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="#C2410C">Lifts NOT OK here {'\u2718'}</text>

          <rect x="400" y="65" width="280" height="60" rx="10" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1.5" />
          <text x="540" y="90" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fill="#7C2D12" fontWeight="600">New multi-story buildings</text>
          <text x="540" y="108" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12">Must use elevator unless exception applies</text>

          <rect x="400" y="140" width="280" height="60" rx="10" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1.5" />
          <text x="540" y="165" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fill="#7C2D12" fontWeight="600">Primary accessible route</text>
          <text x="540" y="183" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12">Can{'\u0027'}t replace an elevator on a main route</text>

          <rect x="400" y="215" width="280" height="50" rx="10" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1.5" />
          <text x="540" y="240" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fill="#7C2D12" fontWeight="600">High-traffic public spaces</text>
          <text x="540" y="255" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12">Not appropriate for heavy daily use</text>

          <Dots callouts={USE_CALLOUTS} active={useActive} toggle={toggleUse} />
          <text x="20" y="290" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{useCallout ? `Showing: ${useCallout.label}` : ''}</div>
      <CalloutPanel callout={useCallout} onClose={() => setUseActive(null)} panelRef={useRef2} />

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Quick check {'\u2014'} Is this lift compliant?</p>
        <KeyFact color="#15803D" number="Pass">Can you call and operate it yourself, without a key or attendant?</KeyFact>
        <KeyFact color="#C2410C" number="Fail">Does it need a staff member to run, or is it always broken?</KeyFact>
      </div>


      <style>{`
        @keyframes plFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .pl-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
