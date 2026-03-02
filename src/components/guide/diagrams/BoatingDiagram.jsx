import React, { useState, useRef, useEffect, useCallback } from 'react';

const STD_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#1003-recreational-boating-facilities';
const CALLOUTS = [
  { id: 1, label: 'Accessible Boat Slips', section: '§1003.3.1', color: '#C2410C', textColor: '#8B2E08', x: 120, y: 100, plain: 'Accessible boat slips must have a clear pier space at least 60 inches wide along the full length of the slip. Cleats, chocks, and other boat-mooring devices cannot protrude into this 60-inch clearance.', legal: '"Accessible boat slips shall provide clear pier space 60 inches wide minimum and at least as long as the accessible boat slips." Cleats and other devices: "shall not reduce the clear pier space."', citation: '§1003.3.1' },
  { id: 2, label: 'Boarding Piers', section: '§1003.3.2', color: '#15803D', textColor: '#14532D', x: 350, y: 100, plain: 'At least 5% (but not fewer than 1) of boarding piers at each boat launch facility must be accessible. Each accessible pier must have a clear space 60 inches wide minimum. Edge protection 4 inches high is required if provided on other piers.', legal: '"At least 5 percent, but not fewer than 1, of boarding piers at each boat launch ramp shall be accessible." Clear space: 60" wide min. Edge protection per §1003.3.2.', citation: '§1003.3.2, §235.3' },
  { id: 3, label: 'Gangways', section: '§1003.2.1', color: '#2563EB', textColor: '#1E3A8A', x: 580, y: 100, plain: 'Gangways connecting land to floating piers have a maximum slope of 1:12. However, if meeting 1:12 would require a gangway longer than 80 feet, a steeper slope up to 1:8 is permitted. Gangways are not required to have landings at the bottom due to tidal and water level changes. Maximum rise per run is 30 inches.', legal: '"Gangways shall comply with Chapter 4 except as modified." Slope: 1:12 max. Exception: "Where gangway length would exceed 80 feet, slope 1:8 max." Max rise: 30 inches per run.', citation: '§1003.2.1' },
  { id: 4, label: 'Transition Plates', section: '§1003.2.2', color: '#7C3AED', textColor: '#5B21B6', x: 120, y: 340, plain: 'Where a gangway meets the floating pier, a transition plate at least 36 inches wide must bridge the gap. The slope of the transition plate may be as steep as 1:8 due to water level fluctuations. The plate must have a slip-resistant surface.', legal: '"Transition plates shall be 36 inches wide minimum." Slope: "as steep as 1:8 permitted" (exception for water level changes).', citation: '§1003.2.2' },
  { id: 5, label: 'Scoping', section: '§235.2', color: '#92400E', textColor: '#78350F', x: 350, y: 340, plain: 'At least one accessible boarding pier must be provided for each type of boat use at the facility (power boats, sailboats, rowboats, canoes, etc.). The number of accessible slips follows the scoping table in §235.2 based on total slips provided.', legal: '§235.2: "Boat slips required to be accessible shall be chosen to provide a variety of types and classes of boats." Per Table 235.2 scoping.', citation: '§235.2' }
];

function makeLink(t) { return (<a href={STD_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}>{t}<span aria-hidden="true" style={{ fontSize: '.65em', marginLeft: 1, verticalAlign: 'super' }}>↗</span></a>); }
function parseCite(t) { return t.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

export default function BoatingDiagram() {
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const panelRef = useRef(null);
  const toggle = useCallback(id => setActive(p => p === id ? null : id), []);
  useEffect(() => { if (active && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [active]);
  useEffect(() => { const h = e => { if (e.key === 'Escape') setActive(null); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const d = (imp, met) => metric ? `${met} mm` : `${imp}"`;
  const ac = CALLOUTS.find(c => c.id === active);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>§1003 Recreational Boating Facilities</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: 44 }}>{u}</button>); })}
        </div>
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <svg viewBox="0 0 900 520" role="img" aria-labelledby="bt-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="bt-title">ADA §1003 Recreational Boating Facilities — Plan View</title>
          <rect width="900" height="520" fill="var(--page-bg-subtle)" />
          <text x="450" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing=".08em">ACCESSIBLE BOAT SLIP & BOARDING PIER</text>

          {/* Water */}
          <rect x="0" y="280" width="900" height="240" fill="#2563EB" opacity="0.03" />
          <text x="450" y="480" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fill="#1E3A8A" opacity="0.2" fontWeight="700">WATER</text>

          {/* Land */}
          <rect x="0" y="40" width="900" height="100" fill="#94A3B8" opacity="0.04" />
          <text x="100" y="90" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563" fontWeight="500">SHORE / PARKING</text>

          {/* Gangway */}
          <rect x="180" y="140" width="60" height="140" rx="2" fill="#2563EB" opacity="0.06" stroke="#2563EB" strokeWidth="1.5" />
          <text x="210" y="215" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#1E3A8A" fontWeight="600" transform="rotate(-90,210,215)">GANGWAY</text>
          <text x="250" y="200" fontFamily="Manrope, sans-serif" fontSize="6" fill="#1E3A8A">1:12 max</text>
          <text x="250" y="212" fontFamily="Manrope, sans-serif" fontSize="6" fill="#1E3A8A">(1:8 if &gt;80ft)</text>

          {/* Transition plate */}
          <rect x="180" y="275" width="60" height="16" rx="2" fill="#7C3AED" opacity="0.1" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="210" y="286" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5.5" fill="#5B21B6" fontWeight="600">TRANSITION</text>
          <text x="280" y="286" fontFamily="Manrope, sans-serif" fontSize="6" fill="#5B21B6">{d('36', '915')} wide min</text>

          {/* Main pier (floating) */}
          <rect x="60" y="294" width="780" height="50" fill="#B45309" opacity="0.04" stroke="#94A3B8" strokeWidth="2" rx="4" />
          <text x="450" y="325" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563" fontWeight="600">FLOATING PIER</text>

          {/* Boat slip 1 (accessible) */}
          <rect x="80" y="350" width="200" height="140" fill="#C2410C" opacity="0.03" stroke="#C2410C" strokeWidth="1.5" rx="4" />
          <text x="180" y="375" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#8B2E08" fontWeight="600">ACCESSIBLE SLIP</text>
          {/* Clear pier space */}
          <rect x="80" y="344" width="200" height="10" rx="2" fill="#C2410C" opacity="0.08" />
          <text x="180" y="352" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5" fill="#8B2E08" fontWeight="600">{d('60', '1525')} wide clear space — full length</text>
          {/* Boat outline */}
          <rect x="110" y="395" width="140" height="80" rx="20" fill="#94A3B8" opacity="0.04" stroke="#94A3B8" strokeWidth="1" />
          <text x="180" y="440" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#4B5563">BOAT</text>

          {/* Boat slip 2 */}
          <rect x="320" y="350" width="200" height="140" fill="#94A3B8" opacity="0.02" stroke="#94A3B8" strokeWidth="1" rx="4" />
          <rect x="350" y="395" width="140" height="80" rx="20" fill="#94A3B8" opacity="0.04" stroke="#94A3B8" strokeWidth="1" />
          <text x="420" y="440" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#4B5563">BOAT</text>

          {/* Boarding pier */}
          <rect x="560" y="350" width="260" height="20" fill="#15803D" opacity="0.06" stroke="#15803D" strokeWidth="1.5" rx="2" />
          <text x="690" y="364" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#14532D" fontWeight="600">BOARDING PIER — {d('60', '1525')} wide min</text>
          {/* Launch ramp */}
          <rect x="600" y="375" width="180" height="110" rx="4" fill="#15803D" opacity="0.03" stroke="#15803D" strokeWidth="1" strokeDasharray="4 2" />
          <text x="690" y="435" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#14532D">LAUNCH AREA</text>

          {/* Accessible route from shore */}
          <defs><marker id="btArr" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="#7C3AED" /></marker></defs>
          <line x1="210" y1="130" x2="210" y2="142" stroke="#7C3AED" strokeWidth="1.5" markerEnd="url(#btArr)" />
          <text x="210" y="125" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#5B21B6" fontWeight="600">Accessible Route</text>

          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity=".3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from=".4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="510" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      {ac && (
        <div ref={panelRef} style={{ marginTop: 12, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', animation: 'btFade .25s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: ac.color, color: 'var(--page-bg)', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{ac.id}</span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{ac.label}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: ac.color, background: `${ac.color}15`, padding: '2px 8px', borderRadius: 4 }}>{ac.section}</span>
            </div>
            <button onClick={() => setActive(null)} aria-label="Close" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: 44 }}>Close <span aria-hidden="true">✕</span></button>
          </div>
          <div className="guide-two-col" style={{ padding: 20, gap: 24, margin: 0 }}>
            <div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{ac.plain}</p></div>
            <aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard — {parseCite(ac.citation)}</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(ac.legal)}</p>
            </div></aside>
          </div>
        </div>
      )}
      <style>{`@keyframes btFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}        @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}