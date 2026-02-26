import React, { useState, useRef, useEffect, useCallback } from 'react';

const STD_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#810-transportation-facilities';
const CALLOUTS = [
  { id: 1, label: 'Bus Boarding Area', section: '§810.2', color: '#C2410C', textColor: '#8B2E08', x: 120, y: 100, plain: 'Bus stops must have a firm, stable surface with a clear area at least 96 inches long (parallel to the road) and 60 inches deep (perpendicular from the curb). This allows a wheelchair lift to deploy. The slope must not exceed 1:48 in any direction. The boarding area must connect to an accessible route.', legal: '"Bus boarding and alighting areas shall provide a clear length of 96 inches minimum, measured perpendicular to the curb or vehicle roadway edge, and a clear width of 60 inches minimum, measured parallel to the vehicle roadway." Slope: "not steeper than 1:48."', citation: '§810.2.1, §810.2.2, §810.2.3' },
  { id: 2, label: 'Bus Shelters', section: '§810.3', color: '#16A34A', textColor: '#14532D', x: 350, y: 100, plain: 'If a bus shelter is provided, it must have a minimum clear floor space of 30 × 48 inches inside, entirely within the shelter. The shelter must be connected to the boarding area by an accessible route. A wheelchair user must be able to enter the shelter and reach the seating or waiting area.', legal: '"Bus shelters shall provide a minimum clear floor or ground space of 30 inches by 48 inches, entirely within the shelter. Bus shelters shall be connected by an accessible route to a boarding and alighting area."', citation: '§810.3' },
  { id: 3, label: 'Detectable Warnings', section: '§810.5.2', color: '#2563EB', textColor: '#1E3A8A', x: 580, y: 100, plain: 'Rail platform edges not protected by guards or screens must have detectable warning surfaces (truncated domes) along the full length of the platform edge. The detectable warning must be 24 inches deep and extend the full length of the public use area of the platform. The domes provide tactile and visual cues to people who are blind or have low vision.', legal: '"Platform boarding edges not protected by platform screens or guards shall have detectable warnings 24 inches deep running the full length of the public use area of the platform."', citation: '§810.5.2, §705' },
  { id: 4, label: 'Platform Gap', section: '§810.5.3', color: '#7C3AED', textColor: '#5B21B6', x: 120, y: 340, plain: 'The horizontal gap between the rail vehicle door and the platform edge must be as small as practicable — the standard aims for 3 inches maximum. The vertical difference between the vehicle floor and the platform must also be minimized. Bridge plates or ramps may be used to span gaps.', legal: '"The horizontal gap between the vehicle floor and platform shall be as small as practicable." Advisory: "The platform-to-vehicle gap should be minimized to enable independent boarding."', citation: '§810.5.3' },
  { id: 5, label: 'Signage & Information', section: '§810.6', color: '#D97706', textColor: '#78350F', x: 350, y: 340, plain: 'Route maps, timetables, and fare information displayed at stations must comply with §703 signage requirements where applicable. Station names must be provided in raised characters and Braille at each station. Real-time arrival information, where provided, should include both visual and audible formats.', legal: '"Station signs shall comply with 703." Per §810.6: route identification signage at stations.', citation: '§810.6, §703' },
  { id: 6, label: 'Accessible Route to Platform', section: '§810.5.1', color: '#0EA5E9', textColor: '#0C4A6E', x: 580, y: 340, plain: 'An accessible route must connect each entry point of the transit station to all boarding platforms, fare collection areas, and key destination points within the station. If the station has multiple levels, elevators or platform lifts must be provided. Fare gates must include at least one accessible gate wide enough for a wheelchair (32 inches minimum clear width).', legal: '"Each platform shall be connected to the station entrance by an accessible route complying with 402."', citation: '§810.5.1, §402' }
];

function makeLink(t) { return (<a href={STD_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}>{t}<span aria-hidden="true" style={{ fontSize: '.65em', marginLeft: 1, verticalAlign: 'super' }}>↗</span></a>); }
function parseCite(t) { return t.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

export default function TransportationDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>§810 Transportation Facilities</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--slate-500)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--slate-200)', background: isA ? '#1A1F2B' : 'white', color: isA ? 'white' : 'var(--slate-600)', cursor: 'pointer', minHeight: 28 }}>{u}</button>); })}
        </div>
      </div>
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden' }}>
        <svg viewBox="0 0 900 520" role="img" aria-labelledby="tr-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="tr-title">ADA §810 Transportation Facilities — Bus Stop & Rail Platform</title>
          <rect width="900" height="520" fill="#FAFAF9" />
          <text x="220" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing=".08em">BUS STOP — PLAN VIEW</text>
          <text x="680" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing=".08em">RAIL PLATFORM — ELEVATION</text>

          {/* ===== LEFT: Bus stop plan view ===== */}
          {/* Roadway */}
          <rect x="60" y="40" width="380" height="120" fill="#94A3B8" opacity="0.05" stroke="#94A3B8" strokeWidth="1" rx="2" />
          <text x="250" y="105" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#4B5563" fontWeight="500">ROADWAY</text>

          {/* Curb line */}
          <line x1="60" y1="160" x2="440" y2="160" stroke="#94A3B8" strokeWidth="3" />
          <text x="450" y="164" fontFamily="Manrope, sans-serif" fontSize="7" fill="#4B5563">CURB</text>

          {/* Boarding area */}
          <rect x="120" y="165" width="200" height="130" rx="4" fill="#C2410C" opacity="0.05" stroke="#C2410C" strokeWidth="2" />
          <text x="220" y="235" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#8B2E08" fontWeight="600">BOARDING AREA</text>

          {/* Bus silhouette on road */}
          <rect x="130" y="60" width="180" height="80" rx="12" fill="#94A3B8" opacity="0.08" stroke="#94A3B8" strokeWidth="1" />
          <text x="220" y="105" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#4B5563">BUS</text>

          {/* Boarding area dims */}
          <line x1="120" y1="310" x2="320" y2="310" stroke="#C2410C" strokeWidth="1" />
          <line x1="120" y1="304" x2="120" y2="316" stroke="#C2410C" strokeWidth="1" />
          <line x1="320" y1="304" x2="320" y2="316" stroke="#C2410C" strokeWidth="1" />
          <rect x="192" y="313" width="56" height="12" rx="3" fill="#C2410C" />
          <text x="220" y="322" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('96', '2440')} min</text>

          <line x1="335" y1="165" x2="335" y2="295" stroke="#C2410C" strokeWidth="1" />
          <line x1="329" y1="165" x2="341" y2="165" stroke="#C2410C" strokeWidth="1" />
          <line x1="329" y1="295" x2="341" y2="295" stroke="#C2410C" strokeWidth="1" />
          <rect x="340" y="223" width="52" height="12" rx="3" fill="#C2410C" />
          <text x="366" y="232" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('60', '1525')} min</text>

          {/* Bus shelter */}
          <rect x="80" y="330" width="120" height="90" rx="6" fill="#16A34A" opacity="0.04" stroke="#16A34A" strokeWidth="1.5" />
          <text x="140" y="360" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#14532D" fontWeight="600">BUS SHELTER</text>
          {/* Clear space inside shelter */}
          <rect x="95" y="370" width="90" height="40" rx="3" fill="#16A34A" opacity="0.08" stroke="#16A34A" strokeWidth="1" strokeDasharray="4 2" />
          <text x="140" y="394" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#14532D">{d('30', '760')}×{d('48', '1220')} clear</text>

          {/* Accessible route arrow */}
          <line x1="200" y1="295" x2="150" y2="330" stroke="#0EA5E9" strokeWidth="1.5" markerEnd="url(#trArr)" />
          <text x="190" y="320" fontFamily="Manrope, sans-serif" fontSize="6" fill="#0C4A6E" fontWeight="600">Route</text>
          <defs><marker id="trArr" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="#0EA5E9" /></marker></defs>

          {/* Sidewalk */}
          <rect x="60" y="440" width="380" height="40" rx="2" fill="#94A3B8" opacity="0.04" stroke="#94A3B8" strokeWidth="1" />
          <text x="250" y="465" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#4B5563" fontWeight="500">SIDEWALK</text>

          {/* ===== RIGHT: Rail platform elevation ===== */}
          {/* Platform */}
          <rect x="500" y="280" width="370" height="30" fill="#94A3B8" opacity="0.15" stroke="#94A3B8" strokeWidth="1.5" rx="2" />
          <text x="685" y="300" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563" fontWeight="600">PLATFORM</text>

          {/* Detectable warning strip */}
          <rect x="500" y="270" width="370" height="10" fill="#D97706" opacity="0.2" stroke="#2563EB" strokeWidth="1.5" />
          {/* Truncated dome dots */}
          {Array.from({ length: 30 }, (_, i) => (
            <circle key={`d${i}`} cx={510 + i * 12} cy="275" r="2" fill="#2563EB" opacity="0.3" />
          ))}
          <text x="685" y="265" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#1E3A8A" fontWeight="600">DETECTABLE WARNINGS — {d('24', '610')} deep</text>

          {/* Track/gap */}
          <rect x="500" y="310" width="370" height="20" fill="#7C3AED" opacity="0.04" />
          <text x="685" y="324" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#5B21B6">GAP</text>

          {/* Train car */}
          <rect x="500" y="330" width="370" height="100" rx="8" fill="#94A3B8" opacity="0.06" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="685" y="385" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#4B5563" fontWeight="500">RAIL VEHICLE</text>
          {/* Door opening */}
          <rect x="630" y="330" width="70" height="15" fill="#2563EB" opacity="0.1" stroke="#2563EB" strokeWidth="1" />
          <text x="665" y="342" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#1E3A8A" fontWeight="600">DOOR</text>

          {/* Gap dimension */}
          <line x1="660" y1="310" x2="660" y2="330" stroke="#7C3AED" strokeWidth="1" />
          <line x1="654" y1="310" x2="666" y2="310" stroke="#7C3AED" strokeWidth="1" />
          <line x1="654" y1="330" x2="666" y2="330" stroke="#7C3AED" strokeWidth="1" />
          <text x="680" y="323" fontFamily="Manrope, sans-serif" fontSize="6" fill="#5B21B6" fontWeight="600">3" max goal</text>

          {/* Person with cane on platform */}
          <circle cx="580" cy="230" r="7" fill="#475569" opacity="0.15" />
          <line x1="580" y1="237" x2="580" y2="265" stroke="#475569" strokeWidth="1.5" opacity="0.15" />
          <line x1="575" y1="248" x2="585" y2="248" stroke="#475569" strokeWidth="1" opacity="0.15" />
          {/* Cane */}
          <line x1="580" y1="255" x2="570" y2="278" stroke="#475569" strokeWidth="1.5" opacity="0.2" />

          {/* Signage note */}
          <rect x="760" y="180" width="100" height="60" rx="6" fill="#D97706" opacity="0.05" stroke="#D97706" strokeWidth="1" />
          <text x="810" y="200" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#78350F" fontWeight="600">STATION SIGN</text>
          <text x="810" y="212" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#78350F">Raised chars</text>
          <text x="810" y="222" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#78350F">+ Braille per §703</text>

          {/* Accessible route arrow */}
          <line x1="530" y1="450" x2="530" y2="315" stroke="#0EA5E9" strokeWidth="1.5" markerEnd="url(#trArr2)" />
          <text x="545" y="450" fontFamily="Manrope, sans-serif" fontSize="7" fill="#0C4A6E" fontWeight="600">Accessible Route</text>
          <text x="545" y="462" fontFamily="Manrope, sans-serif" fontSize="6" fill="#0C4A6E">from entrance</text>
          <defs><marker id="trArr2" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="#0EA5E9" /></marker></defs>

          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity=".3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from=".4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.color : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="510" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      {ac && (
        <div ref={panelRef} style={{ marginTop: 12, background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden', animation: 'trFade .25s ease-out' }}>
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
      <style>{`@keyframes trFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}        @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}