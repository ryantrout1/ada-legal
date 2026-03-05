import React, { useState, useRef, useEffect, useCallback } from 'react';

const PARK_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#502-parking-spaces';

const SPACE_CALLOUTS = [
  {
    id: 1, label: 'Space Widths & Access Aisle', section: '\u00a7502.2',
    color: '#C2410C', textColor: '#7C2D12', x: 100, y: 52,
    plain: 'Standard accessible car spaces must be at least 96 inches (8 feet) wide. Van-accessible spaces must be at least 132 inches (11 feet) wide \u2014 or a standard 96-inch space with an extra-wide 96-inch access aisle. The access aisle (the striped area next to the space) must be at least 60 inches (5 feet) wide. Two spaces can share one aisle between them. The aisle must be clearly marked with diagonal hatching.',
    legal: '\u201CCar parking spaces shall be 96 inches wide minimum.\u201D Van spaces: \u201C132 inches wide minimum.\u201D Access aisles: \u201C60 inches wide minimum.\u201D \u201CTwo parking spaces shall be permitted to share a common access aisle.\u201D',
    citation: '\u00a7502.2, \u00a7502.3'
  },
  {
    id: 2, label: 'Surface, Slope & Level Changes', section: '\u00a7502.4',
    color: '#15803D', textColor: '#14532D', x: 470, y: 52,
    plain: 'Accessible spaces and their access aisles must be firm, stable, and slip-resistant. The aisle must be at the same level as the parking space \u2014 no curbs, steps, or level changes between them. Maximum slope in any direction is 1:48 (about 2%), essentially flat. Van spaces need 98 inches (8\u20192\u2033) of vertical clearance along the entire vehicle route from entrance to exit.',
    legal: '\u201CParking spaces and access aisles shall have surface slopes not steeper than 1:48.\u201D \u201CAccess aisles shall be at the same level as the parking spaces they serve. Changes in level are not permitted.\u201D Vertical clearance: \u201C98 inches minimum.\u201D',
    citation: '\u00a7502.4, \u00a7502.5'
  }
];

const SIGN_CALLOUTS = [
  {
    id: 1, label: 'Required Signs', section: '\u00a7502.6',
    color: '#7C3AED', textColor: '#5B21B6', x: 100, y: 52,
    plain: 'Every accessible parking space must have a sign showing the International Symbol of Accessibility (the blue wheelchair symbol). The bottom of the sign must be at least 60 inches (5 feet) above the ground so it\u2019s visible even when a vehicle is parked. Van spaces need an additional \u201CVan Accessible\u201D label. Exception: lots with 4 or fewer total spaces serving a single residential unit don\u2019t need signs.',
    legal: '\u201CAccessible parking spaces shall be identified by signs showing the International Symbol of Accessibility.\u201D \u201CSigns shall be 60 inches minimum above the finish ground surface measured to the bottom of the sign.\u201D Van spaces: \u201Cshall contain the designation \u2018van accessible.\u2019\u201D',
    citation: '\u00a7502.6'
  },
  {
    id: 2, label: 'How Many Spaces?', section: '\u00a7208.2',
    color: '#2563EB', textColor: '#1E3A8A', x: 680, y: 70,
    plain: 'The number of accessible spaces depends on total lot size: 1\u201325 total spaces = 1 accessible; 26\u201350 = 2; 51\u201375 = 3; 76\u2013100 = 4; and so on. For every 6 accessible spaces (or fraction), at least 1 must be van-accessible. Medical facilities treating mobility impairments need 20% accessible outpatient spaces. Spaces must be on the shortest accessible route to the entrance.',
    legal: '\u201CParking facilities shall provide accessible parking spaces in accordance with Table 208.2.\u201D \u201CFor every six or fraction of six accessible parking spaces, at least one shall be a van parking space.\u201D \u201CSpaces shall be located on the shortest accessible route from parking to an entrance.\u201D',
    citation: '\u00a7208.2, \u00a7208.3.1'
  }
];

function makeLink(t) { return (<a href={PARK_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${t} on ADA.gov`}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

function CalloutPanel({ callout, onClose, panelRef }) {
  if (!callout) return null;
  return (
    <div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'parkFade 0.25s ease-out' }}>
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
      <circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="park-focus-ring" />
    </g>
  ));
}


export default function ParkingDiagram() {
  const [spaceActive, setSpaceActive] = useState(null);
  const [signActive, setSignActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const spaceRef = useRef(null);
  const signRef = useRef(null);

  const toggleSpace = useCallback((id) => { setSpaceActive(prev => prev === id ? null : id); setSignActive(null); }, []);
  const toggleSign = useCallback((id) => { setSignActive(prev => prev === id ? null : id); setSpaceActive(null); }, []);

  useEffect(() => { if (spaceActive && spaceRef.current) spaceRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [spaceActive]);
  useEffect(() => { if (signActive && signRef.current) signRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [signActive]);
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') { setSpaceActive(null); setSignActive(null); } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);

  const d = (inches, mm) => metric ? `${mm} mm` : `${inches}\u2033`;
  const ft = (feet, m) => metric ? `${m} m` : `${feet} ft`;
  const spaceCallout = SPACE_CALLOUTS.find(c => c.id === spaceActive);
  const signCallout = SIGN_CALLOUTS.find(c => c.id === signActive);

  const unitToggle = (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
      {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}
    </div>
  );

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>

      {/* DIAGRAM 1: Space Layout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Space Sizes & Layout</h3>
        {unitToggle}
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 380" role="img" aria-labelledby="space-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="space-title">Accessible Parking Space Layout {'\u2014'} Van and Car Spaces</title>
          <rect width="720" height="380" fill="var(--page-bg-subtle)" />

          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Van-accessible space</text>
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Standard car space</text>

          {/* LEFT: Van space */}
          {/* Van space rect */}
          <rect x="40" y="80" width="170" height="200" rx="4" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="2" />
          <text x="125" y="175" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#C2410C" fontWeight="600">VAN</text>

          {/* Access aisle (shared) */}
          <rect x="210" y="80" width="80" height="200" rx="2" fill="#2563EB" opacity="0.06" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="8 4" />
          {/* Diagonal hatching lines */}
          <line x1="215" y1="120" x2="240" y2="80" stroke="#2563EB" strokeWidth="1" opacity="0.3" />
          <line x1="215" y1="160" x2="270" y2="80" stroke="#2563EB" strokeWidth="1" opacity="0.3" />
          <line x1="215" y1="200" x2="285" y2="120" stroke="#2563EB" strokeWidth="1" opacity="0.3" />
          <line x1="215" y1="240" x2="285" y2="160" stroke="#2563EB" strokeWidth="1" opacity="0.3" />
          <line x1="215" y1="280" x2="285" y2="200" stroke="#2563EB" strokeWidth="1" opacity="0.3" />
          <line x1="240" y1="280" x2="285" y2="240" stroke="#2563EB" strokeWidth="1" opacity="0.3" />
          <text x="250" y="170" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A" fontWeight="600">access</text>
          <text x="250" y="184" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A" fontWeight="600">aisle</text>

          {/* Van width dimension */}
          <line x1="40" y1="300" x2="210" y2="300" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="40" y1="294" x2="40" y2="306" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="210" y1="294" x2="210" y2="306" stroke="#C2410C" strokeWidth="1.5" />
          <rect x="80" y="306" width="90" height="20" rx="6" fill="#C2410C" />
          <text x="125" y="320" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('132', '3350')} min</text>
          <text x="125" y="340" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="500">(11 feet)</text>

          {/* Aisle width */}
          <line x1="210" y1="300" x2="290" y2="300" stroke="#2563EB" strokeWidth="1.5" />
          <line x1="290" y1="294" x2="290" y2="306" stroke="#2563EB" strokeWidth="1.5" />
          <rect x="218" y="306" width="64" height="20" rx="6" fill="#2563EB" />
          <text x="250" y="320" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('60', '1525')}</text>
          <text x="250" y="340" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#2563EB" fontWeight="500">(5 feet)</text>


          {/* DIVIDER */}
          <line x1="360" y1="40" x2="360" y2="360" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />


          {/* RIGHT: Standard car space */}
          <rect x="400" y="80" width="130" height="200" rx="4" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="2" />
          <text x="465" y="175" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#15803D" fontWeight="600">CAR</text>

          {/* Shared aisle */}
          <rect x="530" y="80" width="80" height="200" rx="2" fill="#2563EB" opacity="0.06" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="8 4" />
          <line x1="535" y1="120" x2="560" y2="80" stroke="#2563EB" strokeWidth="1" opacity="0.3" />
          <line x1="535" y1="160" x2="590" y2="80" stroke="#2563EB" strokeWidth="1" opacity="0.3" />
          <line x1="535" y1="200" x2="605" y2="120" stroke="#2563EB" strokeWidth="1" opacity="0.3" />
          <line x1="535" y1="240" x2="605" y2="160" stroke="#2563EB" strokeWidth="1" opacity="0.3" />
          <line x1="535" y1="280" x2="605" y2="200" stroke="#2563EB" strokeWidth="1" opacity="0.3" />
          <line x1="560" y1="280" x2="605" y2="240" stroke="#2563EB" strokeWidth="1" opacity="0.3" />
          <text x="570" y="170" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A" fontWeight="600">access</text>
          <text x="570" y="184" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A" fontWeight="600">aisle</text>

          {/* Car width dimension */}
          <line x1="400" y1="300" x2="530" y2="300" stroke="#15803D" strokeWidth="1.5" />
          <line x1="400" y1="294" x2="400" y2="306" stroke="#15803D" strokeWidth="1.5" />
          <line x1="530" y1="294" x2="530" y2="306" stroke="#15803D" strokeWidth="1.5" />
          <rect x="428" y="306" width="74" height="20" rx="6" fill="#15803D" />
          <text x="465" y="320" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('96', '2440')} min</text>
          <text x="465" y="340" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="500">(8 feet)</text>

          {/* Aisle width */}
          <line x1="530" y1="300" x2="610" y2="300" stroke="#2563EB" strokeWidth="1.5" />
          <line x1="610" y1="294" x2="610" y2="306" stroke="#2563EB" strokeWidth="1.5" />
          <rect x="538" y="306" width="64" height="20" rx="6" fill="#2563EB" />
          <text x="570" y="320" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('60', '1525')}</text>

          {/* Slope note */}
          <text x="465" y="98" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B">slope {'\u2264'} 1:48 everywhere</text>

          <Dots callouts={SPACE_CALLOUTS} active={spaceActive} toggle={toggleSpace} />
          <text x="20" y="370" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{spaceCallout ? `Showing: ${spaceCallout.label}` : ''}</div>
      <CalloutPanel callout={spaceCallout} onClose={() => setSpaceActive(null)} panelRef={spaceRef} />

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Space Layout</p>
        <KeyFact color="#C2410C" number={ft('11', '3.4')}>Van space width (132{'\u2033'})</KeyFact>
        <KeyFact color="#15803D" number={ft('8', '2.4')}>Standard car space width (96{'\u2033'})</KeyFact>
        <KeyFact color="#2563EB" number={ft('5', '1.5')}>Access aisle width minimum (60{'\u2033'})</KeyFact>
        <KeyFact color="#64748B" number="1:48">Maximum slope in any direction (essentially flat)</KeyFact>
      </div>


      {/* DIAGRAM 2: Signs & How Many */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Signs & How Many Spaces</h3>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 320" role="img" aria-labelledby="sign-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="sign-title">Parking Sign Requirements and Space Count</title>
          <rect width="720" height="320" fill="var(--page-bg-subtle)" />

          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">What the sign looks like</text>
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">How many spaces you need</text>

          {/* LEFT: Sign detail */}
          {/* Post */}
          <rect x="165" y="75" width="6" height="190" fill="#94A3B8" rx="1" />

          {/* Sign face */}
          <rect x="130" y="70" width="76" height="60" rx="6" fill="#2563EB" stroke="#1E3A8A" strokeWidth="1.5" />
          {/* Wheelchair icon (simplified) */}
          <circle cx="168" cy="92" r="8" fill="white" opacity="0.9" />
          <rect x="162" y="100" width="12" height="10" rx="2" fill="white" opacity="0.7" />
          <text x="168" y="122" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="white" fontWeight="700">VAN</text>

          {/* 60" min height */}
          <line x1="230" y1="130" x2="230" y2="265" stroke="#7C3AED" strokeWidth="1.5" />
          <line x1="224" y1="130" x2="236" y2="130" stroke="#7C3AED" strokeWidth="1.5" />
          <line x1="224" y1="265" x2="236" y2="265" stroke="#7C3AED" strokeWidth="1.5" />
          <rect x="240" y="186" width="70" height="22" rx="6" fill="#7C3AED" />
          <text x="275" y="201" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('60', '1525')} min</text>
          <text x="275" y="220" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6" fontWeight="500">to bottom of sign</text>

          {/* Ground line */}
          <line x1="100" y1="265" x2="320" y2="265" stroke="#94A3B8" strokeWidth="2" />
          <text x="210" y="282" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B">ground level</text>

          {/* Van note */}
          <text x="168" y="152" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12" fontWeight="600">{'\u201c'}Van Accessible{'\u201d'}</text>
          <text x="168" y="166" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12">required on van spaces</text>


          {/* DIVIDER */}
          <line x1="360" y1="20" x2="360" y2="300" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />


          {/* RIGHT: Scoping table (simplified) */}
          <rect x="400" y="55" width="280" height="42" rx="8" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1.5" />
          <text x="540" y="73" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#1E3A8A" fontWeight="600">1{'\u201325'} total spaces {'\u2192'} 1 accessible</text>
          <text x="540" y="88" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">minimum required</text>

          <rect x="400" y="107" width="280" height="32" rx="8" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1.5" />
          <text x="540" y="128" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#1E3A8A" fontWeight="600">26{'\u201350'} spaces {'\u2192'} 2 accessible</text>

          <rect x="400" y="149" width="280" height="32" rx="8" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1.5" />
          <text x="540" y="170" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#1E3A8A" fontWeight="600">51{'\u201375'} spaces {'\u2192'} 3 accessible</text>

          <rect x="400" y="191" width="280" height="32" rx="8" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1.5" />
          <text x="540" y="212" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#1E3A8A" fontWeight="600">76{'\u2013100'} spaces {'\u2192'} 4 accessible</text>

          {/* Van ratio */}
          <rect x="400" y="240" width="280" height="42" rx="8" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1.5" />
          <text x="540" y="258" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#7C2D12" fontWeight="600">1 in every 6 must be van-accessible</text>
          <text x="540" y="274" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12">or fraction of 6</text>

          <Dots callouts={SIGN_CALLOUTS} active={signActive} toggle={toggleSign} />
          <text x="20" y="310" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{signCallout ? `Showing: ${signCallout.label}` : ''}</div>
      <CalloutPanel callout={signCallout} onClose={() => setSignActive(null)} panelRef={signRef} />

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Signs & Scoping</p>
        <KeyFact color="#7C3AED" number={d('60', '1525')}>Minimum sign height (bottom of sign to ground)</KeyFact>
        <KeyFact color="#2563EB" number="1 in 6">At least 1 van-accessible space for every 6 accessible spaces</KeyFact>
        <KeyFact color="#C2410C" number={`98\u2033`}>Minimum vertical clearance for van routes (8{'\u2019'}2{'\u2033'})</KeyFact>
      </div>


      <style>{`
        @keyframes parkFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .park-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        g[role="button"]:focus .park-fr{stroke:var(--accent);stroke-width:2.5} @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
