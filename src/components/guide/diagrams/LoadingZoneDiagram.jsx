import React, { useState, useRef, useEffect, useCallback } from 'react';

const LZ_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#503-passenger-loading-zones';
const CALLOUTS = [
  { id: 1, label: 'Pull-Up Space', section: '§503.2', color: '#C2410C', x: 100, y: 42, plain: 'The vehicle pull-up space must be 96 inches (8 feet) wide minimum and 20 feet long minimum. This width accommodates full-size vehicles including vans with side-mounted wheelchair lifts. The space must be level and firm with no grade changes that would impede lift deployment.', legal: '"Passenger loading zones shall provide a vehicular pull-up space 96 inches wide minimum and 20 feet long minimum."', citation: '§503.2' },
  { id: 2, label: 'Access Aisle', section: '§503.3', color: '#16A34A', x: 300, y: 42, plain: 'An access aisle 60 inches (5 feet) wide minimum and 20 feet long minimum must run alongside the pull-up space. The aisle must be at the same level as the vehicle floor — no curb between the aisle and the pull-up space. The aisle must connect directly to an accessible route leading to the building entrance.', legal: '"Access aisles serving passenger loading zones shall be 60 inches wide minimum and 20 feet long minimum, at the same level as the vehicle pull-up space."', citation: '§503.3' },
  { id: 3, label: 'Vertical Clearance', section: '§503.4', color: '#2563EB', x: 500, y: 42, plain: 'A minimum vertical clearance of 114 inches (9 feet 6 inches) must be maintained at the pull-up space and along the entire vehicle route to and from the loading zone. This height accommodates raised-roof vans and vehicles with roof-mounted wheelchair lifts. Covered entrances, porte-cochères, and parking garage entries must all meet this clearance.', legal: '"Vehicle pull-up spaces, access aisles, and vehicular routes serving them shall provide a vertical clearance of 114 inches minimum."', citation: '§503.4' },
  { id: 4, label: 'Floor Surface', section: '§503.4', color: '#7C3AED', x: 100, y: 260, plain: 'The access aisle and pull-up space must have firm, stable, slip-resistant surfaces. Maximum slope is 1:48 in any direction. No level changes are permitted between the aisle and pull-up space — the surface must be flush. This is critical for wheelchair ramp deployment from the vehicle.', legal: 'Surface per §302: "firm, stable, and slip-resistant." Slope: "not steeper than 1:48." No level changes between aisle and pull-up space.', citation: '§302' },
  { id: 5, label: 'Marking', section: 'Advisory §503', color: '#D97706', x: 300, y: 260, plain: 'While not a strict requirement, the advisory recommends the access aisle be clearly marked with paint, signage, or both to prevent other vehicles from parking in it. Diagonal striping (typically blue or white) is the most common method. "No Parking" or "Access Aisle" signage is also recommended.', legal: 'Advisory §503: Access aisle should be marked to discourage parking. No specific marking method required, but diagonal striping and signage recommended.', citation: '§503' },
  { id: 6, label: 'Scoping', section: '§209', color: '#DB2777', x: 500, y: 260, plain: 'At least one accessible passenger loading zone must be provided wherever passenger loading zones exist. Medical care facilities must have accessible loading at entrances that serve patients. Valet parking services must have an accessible loading zone. Mechanical access parking garages must have accessible loading.', legal: '§209.2 "At least one passenger loading zone complying with §503 shall be provided." Medical: §209.3. Valet: §209.4.', citation: '§209' },
  { id: 7, label: 'Mechanical Access', section: '§503.5', color: '#0EA5E9', x: 700, y: 150, plain: 'When a wheelchair lift or ramp deploys from the vehicle, it must not reduce the access aisle clear width below 60 inches. The deployed lift platform or ramp must land entirely within the pull-up space and aisle without encroaching on adjacent traffic lanes or walkways.', legal: '"Vehicle ramps or lifts shall not reduce the clear width of the access aisle below 60 inches when deployed."', citation: '§503.5' }
];

function makeLink(t) { return (<a href={LZ_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}>{t}<span aria-hidden="true" style={{ fontSize: '.65em', marginLeft: 1, verticalAlign: 'super' }}>↗</span></a>); }
function parseCite(t) { return t.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

export default function LoadingZoneDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>§503 Passenger Loading Zones</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--slate-500)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--slate-200)', background: isA ? '#1A1F2B' : 'white', color: isA ? 'white' : 'var(--slate-600)', cursor: 'pointer', minHeight: 28 }}>{u}</button>); })}
        </div>
      </div>
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden' }}>
        <svg viewBox="0 0 900 420" role="img" aria-labelledby="lz-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="lz-title">ADA §503 Passenger Loading Zone — Plan View</title>
          <rect width="900" height="420" fill="#FAFAF9" />
          <text x="450" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#94A3B8" letterSpacing=".08em">PLAN VIEW — PASSENGER LOADING ZONE</text>

          {/* Sidewalk/building */}
          <rect x="60" y="50" width="100" height="330" rx="4" fill="#E7E5E4" opacity="0.15" stroke="#94A3B8" strokeWidth="1" />
          <text x="110" y="220" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#94A3B8" fontWeight="500" transform="rotate(-90 110 220)">SIDEWALK → BUILDING</text>

          {/* Access aisle */}
          <rect x="170" y="50" width="120" height="330" rx="2" fill="#16A34A" opacity="0.05" stroke="#16A34A" strokeWidth="2" />
          {/* Diagonal striping */}
          {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => (
            <line key={`s${i}`} x1="170" y1={50 + i * 30} x2="290" y2={80 + i * 30} stroke="#16A34A" strokeWidth="1" opacity="0.15" />
          ))}
          <text x="230" y="200" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#16A34A" fontWeight="700" transform="rotate(-90 230 200)">ACCESS AISLE</text>

          {/* Pull-up space */}
          <rect x="300" y="50" width="200" height="330" rx="2" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="2" />
          <text x="400" y="200" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="700" transform="rotate(-90 400 200)">VEHICLE PULL-UP SPACE</text>

          {/* Vehicle silhouette */}
          <rect x="320" y="100" width="160" height="220" rx="20" fill="#94A3B8" opacity="0.08" stroke="#94A3B8" strokeWidth="1.5" />
          <rect x="335" y="115" width="130" height="60" rx="8" fill="#94A3B8" opacity="0.05" />
          <rect x="335" y="240" width="130" height="50" rx="8" fill="#94A3B8" opacity="0.05" />
          <text x="400" y="200" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#94A3B8">VEHICLE</text>

          {/* Road */}
          <rect x="510" y="50" width="350" height="330" rx="2" fill="#94A3B8" opacity="0.04" />
          <text x="685" y="220" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#94A3B8" fontWeight="500">ROADWAY</text>

          {/* Dims: access aisle 60" */}
          <line x1="170" y1="395" x2="290" y2="395" stroke="#16A34A" strokeWidth="1" />
          <line x1="170" y1="389" x2="170" y2="401" stroke="#16A34A" strokeWidth="1" />
          <line x1="290" y1="389" x2="290" y2="401" stroke="#16A34A" strokeWidth="1" />
          <rect x="198" y="398" width="52" height="12" rx="3" fill="#16A34A" />
          <text x="224" y="407" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('60', '1525')}</text>

          {/* Pull-up 96" */}
          <line x1="300" y1="395" x2="500" y2="395" stroke="#C2410C" strokeWidth="1" />
          <line x1="300" y1="389" x2="300" y2="401" stroke="#C2410C" strokeWidth="1" />
          <line x1="500" y1="389" x2="500" y2="401" stroke="#C2410C" strokeWidth="1" />
          <rect x="372" y="398" width="52" height="12" rx="3" fill="#C2410C" />
          <text x="398" y="407" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('96', '2440')}</text>

          {/* 20' length */}
          <line x1="510" y1="50" x2="510" y2="380" stroke="#94A3B8" strokeWidth="1" />
          <line x1="504" y1="50" x2="516" y2="50" stroke="#94A3B8" strokeWidth="1" />
          <line x1="504" y1="380" x2="516" y2="380" stroke="#94A3B8" strokeWidth="1" />
          <rect x="515" y="208" width="44" height="12" rx="3" fill="#94A3B8" />
          <text x="537" y="217" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">20 ft min</text>

          {/* Vertical clearance note */}
          <rect x="580" y="55" width="130" height="40" rx="6" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1" />
          <text x="645" y="72" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#2563EB" fontWeight="600">Vertical: {d('114', '2895')} min</text>
          <text x="645" y="86" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#2563EB">(9 ft 6 in overhead)</text>

          {/* Accessible route arrow */}
          <line x1="120" y1="140" x2="165" y2="140" stroke="#D97706" strokeWidth="1.5" markerEnd="url(#lzArr)" />
          <text x="142" y="132" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#D97706" fontWeight="600">→ Route</text>
          <defs><marker id="lzArr" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="#D97706" /></marker></defs>

          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity=".3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from=".4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.color : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.color}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="412" fontFamily="Manrope, sans-serif" fontSize="9" fill="#94A3B8">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      {ac && (
        <div ref={panelRef} style={{ marginTop: 12, background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden', animation: 'lzFade .25s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--slate-200)', background: '#FAFAF9', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: ac.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{ac.id}</span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)' }}>{ac.label}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: ac.color, background: `${ac.color}15`, padding: '2px 8px', borderRadius: 4 }}>{ac.section}</span>
            </div>
            <button onClick={() => setActive(null)} aria-label="Close" style={{ background: 'none', border: '1px solid var(--slate-200)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-600)', minHeight: 44 }}>Close <span aria-hidden="true">✕</span></button>
          </div>
          <div className="guide-two-col" style={{ padding: 20, gap: 24, margin: 0 }}>
            <div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-700)', lineHeight: 1.75, margin: 0 }}>{ac.plain}</p></div>
            <aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: '#FFFBF7', borderLeft: '3px solid #C2410C', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--slate-500)', margin: '0 0 8px' }}>Official Standard — {parseCite(ac.citation)}</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(ac.legal)}</p>
            </div></aside>
          </div>
        </div>
      )}
      <style>{`@keyframes lzFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}