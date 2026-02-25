import React, { useState, useRef, useEffect, useCallback } from 'react';

const STD_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#410-platform-lifts';
const CALLOUTS = [
  { id: 1, label: 'Platform Size', section: '§410.2', color: '#C2410C', x: 120, y: 80, plain: 'The platform must provide a clear floor space at least 36 inches wide by 48 inches deep (915 × 1220 mm). If the platform is entered from the narrow (36-inch) end, the clear floor space must be at least 36 × 60 inches (915 × 1525 mm) to allow a wheelchair user to turn and exit forward.', legal: '"Platform lifts shall provide a clear floor space complying with 305."', citation: '§410.2, §305' },
  { id: 2, label: 'Floor Surfaces', section: '§410.3', color: '#16A34A', x: 350, y: 80, plain: 'The platform floor must be firm, stable, and slip-resistant. The gap between the platform edge and the landing must not exceed ¾ inch (19 mm). The transition between the platform and the landing must be level — no lips, bumps, or changes in level greater than ¼ inch.', legal: '"Floor surfaces in platform lifts shall comply with 302." Gap: per ASME A18.1, maximum ¾ inch gap between platform and landing.', citation: '§410.3, §302' },
  { id: 3, label: 'Doors & Gates', section: '§410.5', color: '#2563EB', x: 580, y: 80, plain: 'Doors and gates on platform lifts must provide at least 32 inches (815 mm) of clear width. Doors must not require tight grasping, pinching, or twisting to operate. Power-operated doors that open automatically or with a push button are preferred. Doors must remain open long enough for a wheelchair user to enter or exit.', legal: '"Platform lifts shall comply with ASME A18.1. Platform lifts shall not be attendant-operated."', citation: '§410.1, §410.5' },
  { id: 4, label: 'Controls', section: '§410.4', color: '#7C3AED', x: 120, y: 300, plain: 'Lift controls must be operable with one hand and not require tight grasping, pinching, or twisting. The force to operate must not exceed 5 pounds. Controls must be between 15 and 48 inches above the floor. Platform lifts must NOT require an attendant to operate — the user must be able to call and operate the lift independently.', legal: '"Platform lifts shall not be attendant-operated." Controls: "Operable parts shall comply with 309."', citation: '§410.1, §309' },
  { id: 5, label: 'Where Permitted', section: '§206.7', color: '#D97706', x: 350, y: 300, plain: 'Platform lifts can be used instead of ramps or elevators in these situations: as part of an accessible route to a performing area, wheelchair spaces in assembly areas, incidental spaces with an occupant load of 5 or fewer, courtrooms, certain existing buildings, and recreation facilities. They are not a substitute for elevators in new multi-story construction unless one of these exceptions applies.', legal: '§206.7: "Platform lifts shall be permitted as a component of an accessible route in specific locations" including performance areas (§206.7.1), wheelchair spaces in assembly areas (§206.7.2), incidental spaces (§206.7.3), judicial spaces (§206.7.4), existing buildings (§206.7.5), and recreation (§206.7.8-10).', citation: '§206.7' },
  { id: 6, label: 'ASME A18.1 Safety', section: '§410.1', color: '#0EA5E9', x: 580, y: 300, plain: 'All platform lifts must comply with ASME A18.1 Safety Standard. This includes requirements for: enclosure walls on sides not used for entry/exit, a grab bar on the full length of non-entry walls, emergency stop controls, non-skid surfaces, maximum speed of 12 inches per second, and capacity ratings. Annual inspections are typically required by state codes.', legal: '"Platform lifts shall comply with ASME A18.1 listed in 105.2.2."', citation: '§410.1' }
];

function makeLink(t) { return (<a href={STD_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}>{t}<span aria-hidden="true" style={{ fontSize: '.65em', marginLeft: 1, verticalAlign: 'super' }}>↗</span></a>); }
function parseCite(t) { return t.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

export default function PlatformLiftDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>§410 Platform Lifts</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--slate-500)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--slate-200)', background: isA ? '#1A1F2B' : 'white', color: isA ? 'white' : 'var(--slate-600)', cursor: 'pointer', minHeight: 28 }}>{u}</button>); })}
        </div>
      </div>
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden' }}>
        <svg viewBox="0 0 900 520" role="img" aria-labelledby="pl-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="pl-title">ADA §410 Platform Lifts — Elevation & Plan View</title>
          <rect width="900" height="520" fill="#FAFAF9" />
          <text x="220" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#94A3B8" letterSpacing=".08em">SIDE ELEVATION</text>
          <text x="680" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#94A3B8" letterSpacing=".08em">PLAN VIEW (TOP DOWN)</text>

          {/* ===== LEFT: Side elevation ===== */}
          {/* Upper floor */}
          <rect x="60" y="120" width="180" height="12" fill="#94A3B8" opacity="0.25" rx="2" />
          <text x="150" y="112" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#94A3B8" fontWeight="500">UPPER LEVEL</text>

          {/* Lower floor */}
          <rect x="60" y="400" width="180" height="12" fill="#94A3B8" opacity="0.25" rx="2" />
          <rect x="280" y="400" width="140" height="12" fill="#94A3B8" opacity="0.25" rx="2" />
          <text x="340" y="395" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#94A3B8" fontWeight="500">LOWER LEVEL</text>

          {/* Lift shaft enclosure */}
          <rect x="240" y="120" width="100" height="292" fill="#7C3AED" opacity="0.03" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="6 3" />
          {/* Left wall */}
          <line x1="240" y1="120" x2="240" y2="412" stroke="#94A3B8" strokeWidth="2" />
          {/* Right wall */}
          <line x1="340" y1="180" x2="340" y2="400" stroke="#94A3B8" strokeWidth="2" />

          {/* Platform in mid-travel */}
          <rect x="244" y="260" width="92" height="8" rx="2" fill="#C2410C" opacity="0.2" stroke="#C2410C" strokeWidth="1.5" />

          {/* Wheelchair on platform */}
          <circle cx="290" cy="240" r="8" fill="#475569" opacity="0.15" />
          <rect x="282" y="248" width="16" height="18" rx="2" fill="#475569" opacity="0.1" />
          <circle cx="280" cy="266" r="6" fill="none" stroke="#475569" strokeWidth="1.2" opacity="0.2" />
          <circle cx="300" cy="266" r="6" fill="none" stroke="#475569" strokeWidth="1.2" opacity="0.2" />

          {/* Travel arrows */}
          <line x1="370" y1="160" x2="370" y2="380" stroke="#7C3AED" strokeWidth="1.5" strokeDasharray="4 3" />
          <polygon points="370,155 365,165 375,165" fill="#7C3AED" opacity="0.5" />
          <polygon points="370,385 365,375 375,375" fill="#7C3AED" opacity="0.5" />
          <text x="388" y="275" fontFamily="Manrope, sans-serif" fontSize="7" fill="#7C3AED" fontWeight="500">TRAVEL</text>

          {/* Door opening at upper level */}
          <line x1="240" y1="120" x2="240" y2="170" stroke="#2563EB" strokeWidth="2.5" />
          <text x="225" y="150" textAnchor="end" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#2563EB" fontWeight="600">DOOR</text>

          {/* Door opening at lower level */}
          <line x1="340" y1="350" x2="340" y2="400" stroke="#2563EB" strokeWidth="2.5" />
          <text x="355" y="380" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#2563EB" fontWeight="600">DOOR</text>

          {/* Grab bar on wall */}
          <line x1="244" y1="210" x2="244" y2="300" stroke="#0EA5E9" strokeWidth="3" opacity="0.4" />
          <text x="235" y="260" textAnchor="end" fontFamily="Manrope, sans-serif" fontSize="5.5" fill="#0EA5E9">grab bar</text>

          {/* Controls */}
          <rect x="246" y="290" width="6" height="10" rx="1" fill="#7C3AED" opacity="0.3" stroke="#7C3AED" strokeWidth="1" />
          <text x="235" y="298" textAnchor="end" fontFamily="Manrope, sans-serif" fontSize="5.5" fill="#7C3AED">controls</text>

          {/* Speed note */}
          <rect x="60" y="460" width="160" height="30" rx="6" fill="#0EA5E9" opacity="0.05" stroke="#0EA5E9" strokeWidth="1" />
          <text x="140" y="478" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#0EA5E9" fontWeight="600">Max speed: 12"/sec</text>

          {/* ===== RIGHT: Plan view ===== */}
          {/* Enclosure walls */}
          <rect x="520" y="140" width="300" height="240" fill="#C2410C" opacity="0.03" stroke="#94A3B8" strokeWidth="1.5" />
          {/* Left wall */}
          <line x1="520" y1="140" x2="520" y2="380" stroke="#94A3B8" strokeWidth="2" />
          {/* Right wall */}
          <line x1="820" y1="140" x2="820" y2="380" stroke="#94A3B8" strokeWidth="2" />
          {/* Back wall */}
          <line x1="520" y1="140" x2="820" y2="140" stroke="#94A3B8" strokeWidth="2" />
          {/* Front wall with door opening */}
          <line x1="520" y1="380" x2="620" y2="380" stroke="#94A3B8" strokeWidth="2" />
          <line x1="720" y1="380" x2="820" y2="380" stroke="#94A3B8" strokeWidth="2" />
          {/* Door opening */}
          <line x1="620" y1="378" x2="720" y2="378" stroke="#2563EB" strokeWidth="3" />
          <text x="670" y="396" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#2563EB" fontWeight="600">DOOR OPENING</text>

          {/* Clear floor space */}
          <rect x="570" y="170" width="200" height="180" rx="4" fill="#C2410C" opacity="0.05" stroke="#C2410C" strokeWidth="1.5" strokeDasharray="6 3" />
          <text x="670" y="265" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#C2410C" fontWeight="600">CLEAR FLOOR</text>
          <text x="670" y="278" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#C2410C" fontWeight="600">SPACE</text>

          {/* Grab bars on non-entry walls */}
          <line x1="524" y1="180" x2="524" y2="340" stroke="#0EA5E9" strokeWidth="3" opacity="0.3" />
          <line x1="816" y1="180" x2="816" y2="340" stroke="#0EA5E9" strokeWidth="3" opacity="0.3" />
          <line x1="560" y1="144" x2="780" y2="144" stroke="#0EA5E9" strokeWidth="3" opacity="0.3" />

          {/* Dim: width */}
          <line x1="570" y1="420" x2="770" y2="420" stroke="#C2410C" strokeWidth="1" />
          <line x1="570" y1="414" x2="570" y2="426" stroke="#C2410C" strokeWidth="1" />
          <line x1="770" y1="414" x2="770" y2="426" stroke="#C2410C" strokeWidth="1" />
          <rect x="642" y="423" width="56" height="14" rx="3" fill="#C2410C" />
          <text x="670" y="433" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('36', '915')} min</text>

          {/* Dim: depth */}
          <line x1="840" y1="170" x2="840" y2="350" stroke="#C2410C" strokeWidth="1" />
          <line x1="834" y1="170" x2="846" y2="170" stroke="#C2410C" strokeWidth="1" />
          <line x1="834" y1="350" x2="846" y2="350" stroke="#C2410C" strokeWidth="1" />
          <rect x="845" y="253" width="52" height="14" rx="3" fill="#C2410C" />
          <text x="871" y="263" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('48', '1220')} min</text>

          {/* Door width dim */}
          <line x1="620" y1="405" x2="720" y2="405" stroke="#2563EB" strokeWidth="1" />
          <line x1="620" y1="399" x2="620" y2="411" stroke="#2563EB" strokeWidth="1" />
          <line x1="720" y1="399" x2="720" y2="411" stroke="#2563EB" strokeWidth="1" />
          <rect x="642" y="408" width="56" height="12" rx="3" fill="#2563EB" />
          <text x="670" y="417" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('32', '815')} min</text>

          {/* Where permitted note */}
          <rect x="520" y="460" width="300" height="36" rx="8" fill="#D97706" opacity="0.05" stroke="#D97706" strokeWidth="1" />
          <text x="670" y="478" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fill="#D97706" fontWeight="600">Permitted in specific locations per §206.7</text>
          <text x="670" y="490" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#D97706">Performance areas · Assembly · Courtrooms · Existing buildings</text>

          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity=".3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from=".4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.color : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.color}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="510" fontFamily="Manrope, sans-serif" fontSize="9" fill="#94A3B8">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      {ac && (
        <div ref={panelRef} style={{ marginTop: 12, background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden', animation: 'plFade .25s ease-out' }}>
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
      <style>{`@keyframes plFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}