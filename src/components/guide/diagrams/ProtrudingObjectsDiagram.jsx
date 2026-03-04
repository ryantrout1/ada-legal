import React, { useState, useRef, useEffect, useCallback } from 'react';

const PROT_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#307-protruding-objects';

const WALL_CALLOUTS = [
  {
    id: 1, label: 'Above 27 Inches \u2014 4-Inch Limit', section: '\u00a7307.2',
    color: '#C2410C', textColor: '#7C2D12', x: 170, y: 52,
    plain: 'Objects mounted on walls with their leading edges between 27 and 80 inches above the floor may protrude no more than 4 inches into the circulation path. This is the most commonly violated provision \u2014 fire extinguisher cabinets, AED boxes, display cases, and wall-mounted shelves frequently exceed the 4-inch limit. People who are blind cannot detect objects above 27 inches with a cane, so the 4-inch limit prevents them from walking into hazards.',
    legal: '\u201CObjects with leading edges more than 27 inches (685 mm) and not more than 80 inches (2030 mm) above the finish floor or ground shall protrude 4 inches (100 mm) maximum horizontally into the circulation path.\u201D',
    citation: '\u00a7307.2'
  },
  {
    id: 2, label: 'Below 27 Inches \u2014 No Limit', section: '\u00a7307.2',
    color: '#15803D', textColor: '#14532D', x: 540, y: 52,
    plain: 'Objects with leading edges at or below 27 inches above the floor have no protrusion limit. A person using a long cane sweeps the cane at floor level in an arc \u2014 any object at or below 27 inches will be detected by the cane before the person walks into it. Common examples include drinking fountains with the rim at 27 inches or lower, benches, planters, and guard rails.',
    legal: '\u201CObjects with leading edges at or below 27 inches above the finish floor may protrude any amount.\u201D These objects are within cane-detectable range.',
    citation: '\u00a7307.2'
  }
];

const HEAD_CALLOUTS = [
  {
    id: 1, label: 'Overhead Clearance', section: '\u00a7307.4',
    color: '#7C3AED', textColor: '#5B21B6', x: 260, y: 52,
    plain: 'Vertical clearance of 80 inches (6 feet 8 inches) minimum must be maintained in all circulation areas. This protects against head injuries for people who are tall or have low vision. Common areas include hallways, lobbies, under mezzanines, and near stairways.',
    legal: '\u201CVertical clearance shall be 80 inches (2030 mm) high minimum.\u201D',
    citation: '\u00a7307.4'
  },
  {
    id: 2, label: 'Under Stairs \u2014 Barrier Required', section: '\u00a7307.4',
    color: '#2563EB', textColor: '#1E3A8A', x: 540, y: 52,
    plain: 'Where overhead clearance drops below 80 inches \u2014 such as under stairs, escalators, or sloped ceilings \u2014 a guardrail or barrier must be placed where clearance is 27 inches or lower so a cane can detect it and warn the person to stop. Without this barrier, a person who is blind could walk into a dangerously low overhead area.',
    legal: '\u201CWhere vertical clearance is less than 80 inches high, a barrier shall be provided where the vertical clearance is less than 80 inches high. The leading edge of such barrier shall be located 27 inches maximum above the finish floor.\u201D',
    citation: '\u00a7307.4'
  }
];

function makeLink(text) {
  return (<a href={PROT_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${text} on ADA.gov`}>{text}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>);
}
function parseCitations(text) {
  return text.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p);
}

function CalloutPanel({ callout, onClose, panelRef }) {
  if (!callout) return null;
  return (
    <div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'protFade 0.25s ease-out' }}>
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
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard \u2014 {parseCitations(callout.citation)}</p>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCitations(callout.legal)}</p>
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

function CalloutDots({ callouts, active, toggle }) {
  return callouts.map(c => (
    <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
      {active === c.id && (<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>)}
      <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" />
      <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
      <circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="prot-focus-ring" />
    </g>
  ));
}


export default function ProtrudingObjectsDiagram() {
  const [wallActive, setWallActive] = useState(null);
  const [headActive, setHeadActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const wallRef = useRef(null);
  const headRef = useRef(null);

  const toggleWall = useCallback((id) => { setWallActive(prev => prev === id ? null : id); setHeadActive(null); }, []);
  const toggleHead = useCallback((id) => { setHeadActive(prev => prev === id ? null : id); setWallActive(null); }, []);

  useEffect(() => { if (wallActive && wallRef.current) wallRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [wallActive]);
  useEffect(() => { if (headActive && headRef.current) headRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [headActive]);
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') { setWallActive(null); setHeadActive(null); } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);

  const d = (inches, mm) => metric ? `${mm} mm` : `${inches}\u2033`;
  const wallCallout = WALL_CALLOUTS.find(c => c.id === wallActive);
  const headCallout = HEAD_CALLOUTS.find(c => c.id === headActive);

  const unitToggle = (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
      {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}
    </div>
  );

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>

      {/* DIAGRAM 1: Wall-Mounted Objects */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Wall-Mounted Objects</h3>
        {unitToggle}
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 400" role="img" aria-labelledby="wall-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="wall-title">Wall-Mounted Protruding Objects \u2014 The 27-inch Cane Detection Line</title>
          <rect width="720" height="400" fill="var(--page-bg-subtle)" />

          {/* LEFT: Above 27" — 4" max */}
          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Above 27{'\u2033'} {'\u2014'} max 4{'\u2033'} protrusion</text>

          {/* Wall */}
          <rect x="50" y="50" width="12" height="310" fill="#CBD5E1" rx="2" />
          <text x="45" y="48" textAnchor="end" fontFamily="Manrope, sans-serif" fontSize="10" fill="#94A3B8" fontWeight="600">wall</text>

          {/* Fire extinguisher cabinet (VIOLATION example) */}
          <rect x="62" y="130" width="50" height="60" rx="4" fill="#C2410C" opacity="0.08" stroke="#C2410C" strokeWidth="2" />
          <text x="87" y="155" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#C2410C" fontWeight="600">fire</text>
          <text x="87" y="167" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#C2410C" fontWeight="600">ext.</text>

          {/* 4" max protrusion dimension */}
          <line x1="62" y1="200" x2="112" y2="200" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="62" y1="194" x2="62" y2="206" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="112" y1="194" x2="112" y2="206" stroke="#C2410C" strokeWidth="1.5" />
          <rect x="68" y="206" width="64" height="20" rx="6" fill="#C2410C" />
          <text x="100" y="220" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('4', '100')} max</text>

          {/* 27" line (critical!) */}
          <line x1="30" y1="275" x2="330" y2="275" stroke="#B45309" strokeWidth="2.5" strokeDasharray="8 4" />
          <rect x="135" y="264" width="100" height="22" rx="6" fill="#B45309" />
          <text x="185" y="279" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill="white">{d('27', '685')} cane line</text>

          {/* 80" line (top) */}
          <line x1="30" y1="60" x2="330" y2="60" stroke="#64748B" strokeWidth="1" strokeDasharray="4 4" />
          <rect x="240" y="50" width="56" height="20" rx="6" fill="#64748B" />
          <text x="268" y="64" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('80', '2030')}</text>

          {/* Danger zone highlight (27-80") */}
          <rect x="62" y="60" width="60" height="215" fill="#C2410C" opacity="0.03" stroke="#C2410C" strokeWidth="1" strokeDasharray="4 3" rx="4" />
          <text x="92" y="100" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#C2410C" fontWeight="600" opacity="0.5">danger</text>
          <text x="92" y="112" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#C2410C" fontWeight="600" opacity="0.5">zone</text>

          {/* Person with cane */}
          <g transform="translate(195,140)">
            <circle cx="30" cy="0" r="12" fill="#E2E8F0" stroke="#475569" strokeWidth="1.8" />
            <line x1="30" y1="14" x2="30" y2="85" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="30" y1="85" x2="18" y2="150" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <line x1="30" y1="85" x2="42" y2="150" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <line x1="30" y1="40" x2="12" y2="65" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="30" y1="40" x2="48" y2="65" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
            {/* Cane */}
            <line x1="14" y1="65" x2="-35" y2="150" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" />
            <text x="-20" y="168" fontFamily="Manrope, sans-serif" fontSize="9" fill="#B45309" fontWeight="600">cane</text>
          </g>

          {/* Floor */}
          <line x1="20" y1="360" x2="340" y2="360" stroke="#94A3B8" strokeWidth="2" />


          {/* DIVIDER */}
          <line x1="360" y1="20" x2="360" y2="380" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />


          {/* RIGHT: Below 27" — cane detects it */}
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Below 27{'\u2033'} {'\u2014'} cane detects it</text>

          {/* Wall */}
          <rect x="420" y="50" width="12" height="310" fill="#CBD5E1" rx="2" />

          {/* Drinking fountain (OK, below 27") */}
          <rect x="432" y="265" width="55" height="35" rx="4" fill="#15803D" opacity="0.08" stroke="#15803D" strokeWidth="2" />
          <text x="460" y="314" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#15803D" fontWeight="600">fountain (OK)</text>

          {/* 27" line */}
          <line x1="400" y1="275" x2="700" y2="275" stroke="#B45309" strokeWidth="2.5" strokeDasharray="8 4" />

          {/* Safe zone highlight (below 27") */}
          <rect x="432" y="275" width="65" height="85" fill="#15803D" opacity="0.03" stroke="#15803D" strokeWidth="1" strokeDasharray="4 3" rx="4" />
          <text x="464" y="340" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#15803D" fontWeight="600" opacity="0.5">safe zone</text>

          {/* Person with cane detecting the fountain */}
          <g transform="translate(555,140)">
            <circle cx="30" cy="0" r="12" fill="#E2E8F0" stroke="#475569" strokeWidth="1.8" />
            <line x1="30" y1="14" x2="30" y2="85" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="30" y1="85" x2="18" y2="150" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <line x1="30" y1="85" x2="42" y2="150" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <line x1="30" y1="40" x2="12" y2="65" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="30" y1="40" x2="48" y2="65" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
            {/* Cane hitting the fountain */}
            <line x1="14" y1="65" x2="-60" y2="148" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="-60" cy="150" r="4" fill="#15803D" opacity="0.4" />
            <text x="-48" y="168" fontFamily="Manrope, sans-serif" fontSize="9" fill="#15803D" fontWeight="600">detected!</text>
          </g>

          {/* Floor */}
          <line x1="390" y1="360" x2="710" y2="360" stroke="#94A3B8" strokeWidth="2" />

          <CalloutDots callouts={WALL_CALLOUTS} active={wallActive} toggle={toggleWall} />
          <text x="20" y="390" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{wallCallout ? `Showing: ${wallCallout.label}` : ''}</div>
      <CalloutPanel callout={wallCallout} onClose={() => setWallActive(null)} panelRef={wallRef} />

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Wall-Mounted Objects</p>
        <KeyFact color="#B45309" number={d('27', '685')}>The cane detection line {'\u2014'} objects above this are invisible to a cane</KeyFact>
        <KeyFact color="#C2410C" number={`\u2264 ${d('4', '100')}`}>Maximum protrusion for objects between 27{'\u2033'} and 80{'\u2033'} above the floor</KeyFact>
        <KeyFact color="#15803D" number="No limit">Objects at or below 27{'\u2033'} can protrude any amount (cane detects them)</KeyFact>
      </div>


      {/* DIAGRAM 2: Overhead Clearance */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Overhead Clearance</h3>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 380" role="img" aria-labelledby="head-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="head-title">Overhead Clearance {'\u2014'} 80-Inch Minimum and Stair Barrier</title>
          <rect width="720" height="380" fill="var(--page-bg-subtle)" />

          {/* LEFT: Normal clearance */}
          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">80{'\u2033'} minimum overhead</text>

          {/* Ceiling */}
          <rect x="40" y="68" width="260" height="8" rx="2" fill="#94A3B8" />
          <text x="170" y="60" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B" fontWeight="600">ceiling</text>

          {/* 80" dimension */}
          <line x1="30" y1="76" x2="30" y2="340" stroke="#7C3AED" strokeWidth="1.5" />
          <line x1="22" y1="76" x2="38" y2="76" stroke="#7C3AED" strokeWidth="1.5" />
          <line x1="22" y1="340" x2="38" y2="340" stroke="#7C3AED" strokeWidth="1.5" />
          <rect x="6" y="200" width="50" height="22" rx="6" fill="#7C3AED" />
          <text x="31" y="215" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill="white">{d('80', '2030')}</text>
          <text x="31" y="236" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C3AED" fontWeight="600">min clear</text>

          {/* Person walking */}
          <g transform="translate(160,100)">
            <circle cx="20" cy="0" r="12" fill="#E2E8F0" stroke="#475569" strokeWidth="1.8" />
            <line x1="20" y1="14" x2="20" y2="85" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="20" y1="85" x2="8" y2="150" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="85" x2="32" y2="150" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="40" x2="4" y2="65" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="20" y1="40" x2="36" y2="65" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Floor */}
          <line x1="20" y1="340" x2="330" y2="340" stroke="#94A3B8" strokeWidth="2" />


          {/* DIVIDER */}
          <line x1="360" y1="20" x2="360" y2="360" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />


          {/* RIGHT: Under stairs — barrier needed */}
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Under stairs {'\u2014'} barrier required</text>

          {/* Stair underside (diagonal) */}
          <line x1="380" y1="270" x2="700" y2="70" stroke="#94A3B8" strokeWidth="3" />
          <text x="620" y="100" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B" fontWeight="600">stairway above</text>

          {/* 80" point on diagonal */}
          <line x1="480" y1="200" x2="480" y2="340" stroke="#7C3AED" strokeWidth="1.2" strokeDasharray="4 3" />
          <rect x="455" y="192" width="50" height="18" rx="5" fill="#7C3AED" opacity="0.8" />
          <text x="480" y="205" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fontWeight="700" fill="white">{d('80', '2030')}</text>

          {/* Barrier/guardrail at cane detection line */}
          <rect x="476" y="285" width="10" height="55" rx="2" fill="#2563EB" stroke="#2563EB" strokeWidth="1.5" />
          <text x="500" y="300" fontFamily="Manrope, sans-serif" fontSize="10" fill="#2563EB" fontWeight="600">barrier</text>
          <text x="500" y="314" fontFamily="Manrope, sans-serif" fontSize="9" fill="#2563EB">(at {d('27', '685')}</text>
          <text x="500" y="326" fontFamily="Manrope, sans-serif" fontSize="9" fill="#2563EB">or lower)</text>

          {/* Danger zone (low headroom area) */}
          <path d="M 380 270 L 380 340 L 480 340 L 480 200 Z" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1" strokeDasharray="4 3" />
          <text x="430" y="310" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#C2410C" fontWeight="600" opacity="0.6">low</text>
          <text x="430" y="322" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#C2410C" fontWeight="600" opacity="0.6">headroom</text>

          {/* Person approaching barrier (cane detects it) */}
          <g transform="translate(555,100)">
            <circle cx="20" cy="0" r="12" fill="#E2E8F0" stroke="#475569" strokeWidth="1.8" />
            <line x1="20" y1="14" x2="20" y2="85" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="20" y1="85" x2="8" y2="150" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="85" x2="32" y2="150" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="40" x2="4" y2="65" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
            {/* Cane detecting barrier */}
            <line x1="4" y1="65" x2="-70" y2="185" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="-70" cy="187" r="4" fill="#2563EB" opacity="0.4" />
          </g>

          {/* Floor */}
          <line x1="370" y1="340" x2="710" y2="340" stroke="#94A3B8" strokeWidth="2" />

          <CalloutDots callouts={HEAD_CALLOUTS} active={headActive} toggle={toggleHead} />
          <text x="20" y="372" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{headCallout ? `Showing: ${headCallout.label}` : ''}</div>
      <CalloutPanel callout={headCallout} onClose={() => setHeadActive(null)} panelRef={headRef} />

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Overhead Clearance</p>
        <KeyFact color="#7C3AED" number={d('80', '2030')}>Minimum overhead clearance in all walking areas (6 feet 8 inches)</KeyFact>
        <KeyFact color="#2563EB" number="Barrier">{`Where headroom drops below 80\u2033, a cane-detectable barrier at 27\u2033 or lower must warn people`}</KeyFact>
      </div>


      <style>{`
        @keyframes protFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .prot-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
