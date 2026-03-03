import React, { useState, useRef, useEffect, useCallback } from 'react';

const STD_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#408-limited-uselimited-application-elevators';
const CALLOUTS = [
  { id: 1, label: 'Car Size', section: '§408.4.1', color: 'var(--section-label)', textColor: '#8B2E08', x: 150, y: 100, plain: 'LULA elevator cars must have a clear floor area of at least 51 inches deep by 51 inches wide for side-opening doors, or 54 inches deep by 36 inches wide for center or end-opening doors. These are smaller than standard passenger elevators but large enough for one wheelchair user.', legal: '"Inside dimensions: 51 inches wide by 51 inches deep with side opening doors, or 54 inches deep by 36 inches wide with end/center opening doors."', citation: '§408.4.1' },
  { id: 2, label: 'Door Width', section: '§408.4.2', color: '#15803D', textColor: '#14532D', x: 400, y: 100, plain: 'LULA elevator doors must provide a clear width of at least 32 inches (815 mm). Doors must be automatic or power-operated with reopening devices that prevent closing on a person.', legal: '"Elevator doors shall provide a clear width of 32 inches minimum."', citation: '§408.4.2' },
  { id: 3, label: 'Controls', section: '§408.4.6', color: '#2563EB', textColor: '#1E3A8A', x: 650, y: 100, plain: 'Car controls must be between 15 and 48 inches above the floor for a forward approach, or between 15 and 54 inches for a side approach. Buttons must be raised or flush. All controls must have both visual and tactile indicators.', legal: '"Controls shall comply with 309." Reach ranges per §308.', citation: '§408.4.6, §309' },
  { id: 4, label: 'Where Permitted', section: '§206.6', color: '#7C3AED', textColor: '#5B21B6', x: 150, y: 340, plain: 'LULA elevators can be used instead of standard elevators in certain situations: buildings where a standard elevator is not required (2 stories or fewer), or as part of an accessible route within a facility. They cannot substitute for passenger elevators required by §206.6.', legal: '§206.6: "In buildings not required to have a full passenger elevator, LULA elevators shall be permitted."', citation: '§206.6' },
  { id: 5, label: 'Speed & Travel', section: '§408.4', color: '#92400E', textColor: '#78350F', x: 400, y: 340, plain: 'LULA elevators are limited to a maximum travel distance of 25 feet and a maximum speed of 30 feet per minute. They are designed for low-traffic, short-distance vertical travel — typically 1-2 stories. They must comply with ASME A17.1 safety standards.', legal: 'Per ASME A17.1: maximum travel 25 feet, maximum speed 30 feet per minute.', citation: '§408.1' }
];

function makeLink(t) { return (<a href={STD_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }}>{t}<span aria-hidden="true" style={{ fontSize: '.65em', marginLeft: 1, verticalAlign: 'super' }}>↗</span></a>); }
function parseCite(t) { return t.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

export default function LULAElevatorDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>§408 LULA Elevators</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: 44 }}>{u}</button>); })}
        </div>
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <svg viewBox="0 0 900 520" role="img" aria-labelledby="lula-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="lula-title">ADA §408 LULA Elevators — Plan View</title>
          <rect width="900" height="520" fill="var(--page-bg-subtle)" />
          <text x="300" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="var(--body-secondary)" letterSpacing=".08em">SIDE-OPENING DOOR CONFIG</text>
          <text x="680" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="var(--body-secondary)" letterSpacing=".08em">END-OPENING DOOR CONFIG</text>

          {/* LEFT: Side-opening config */}
          <rect x="100" y="60" width="320" height="320" fill="#C2410C" opacity="0.03" stroke="#94A3B8" strokeWidth="2" rx="2" />
          {/* Walls */}
          <line x1="100" y1="60" x2="420" y2="60" stroke="#94A3B8" strokeWidth="3" />
          <line x1="100" y1="60" x2="100" y2="380" stroke="#94A3B8" strokeWidth="3" />
          <line x1="100" y1="380" x2="420" y2="380" stroke="#94A3B8" strokeWidth="3" />
          {/* Side door opening */}
          <line x1="420" y1="60" x2="420" y2="140" stroke="#94A3B8" strokeWidth="3" />
          <line x1="420" y1="260" x2="420" y2="380" stroke="#94A3B8" strokeWidth="3" />
          <line x1="418" y1="140" x2="418" y2="260" stroke="#15803D" strokeWidth="4" />
          <text x="435" y="205" fontFamily="Manrope, sans-serif" fontSize="8" fill="#14532D" fontWeight="600">DOOR</text>

          {/* Wheelchair silhouette */}
          <circle cx="260" cy="190" r="12" fill="#475569" opacity="0.1" />
          <rect x="248" y="204" width="24" height="28" rx="3" fill="#475569" opacity="0.08" />
          <circle cx="244" cy="232" r="9" fill="none" stroke="#475569" strokeWidth="1.2" opacity="0.15" />
          <circle cx="276" cy="232" r="9" fill="none" stroke="#475569" strokeWidth="1.2" opacity="0.15" />

          {/* Width dim */}
          <line x1="100" y1="410" x2="420" y2="410" stroke="#C2410C" strokeWidth="1" />
          <line x1="100" y1="404" x2="100" y2="416" stroke="#C2410C" strokeWidth="1" />
          <line x1="420" y1="404" x2="420" y2="416" stroke="#C2410C" strokeWidth="1" />
          <rect x="232" y="413" width="56" height="14" rx="3" fill="#C2410C" />
          <text x="260" y="423" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('51', '1295')} min</text>

          {/* Depth dim */}
          <line x1="60" y1="60" x2="60" y2="380" stroke="#C2410C" strokeWidth="1" />
          <line x1="54" y1="60" x2="66" y2="60" stroke="#C2410C" strokeWidth="1" />
          <line x1="54" y1="380" x2="66" y2="380" stroke="#C2410C" strokeWidth="1" />
          <rect x="35" y="213" width="52" height="14" rx="3" fill="#C2410C" />
          <text x="61" y="223" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('51', '1295')} min</text>

          {/* Door width dim */}
          <line x1="440" y1="140" x2="440" y2="260" stroke="#15803D" strokeWidth="1" />
          <line x1="434" y1="140" x2="446" y2="140" stroke="#15803D" strokeWidth="1" />
          <line x1="434" y1="260" x2="446" y2="260" stroke="#15803D" strokeWidth="1" />
          <rect x="448" y="193" width="52" height="14" rx="3" fill="#15803D" />
          <text x="474" y="203" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('32', '815')} min</text>

          {/* Controls panel */}
          <rect x="108" y="140" width="12" height="60" rx="2" fill="#2563EB" opacity="0.15" stroke="#2563EB" strokeWidth="1" />
          <text x="130" y="175" fontFamily="Manrope, sans-serif" fontSize="6" fill="#1E3A8A" fontWeight="600">CONTROLS</text>

          {/* RIGHT: End-opening config */}
          <rect x="540" y="60" width="220" height="320" fill="#C2410C" opacity="0.03" stroke="#94A3B8" strokeWidth="2" rx="2" />
          <line x1="540" y1="60" x2="760" y2="60" stroke="#94A3B8" strokeWidth="3" />
          <line x1="540" y1="60" x2="540" y2="380" stroke="#94A3B8" strokeWidth="3" />
          <line x1="760" y1="60" x2="760" y2="380" stroke="#94A3B8" strokeWidth="3" />
          {/* End door */}
          <line x1="540" y1="380" x2="600" y2="380" stroke="#94A3B8" strokeWidth="3" />
          <line x1="700" y1="380" x2="760" y2="380" stroke="#94A3B8" strokeWidth="3" />
          <line x1="600" y1="378" x2="700" y2="378" stroke="#15803D" strokeWidth="4" />
          <text x="650" y="396" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#14532D" fontWeight="600">DOOR</text>

          {/* End-opening: Wheelchair silhouette */}
          <circle cx="650" cy="190" r="12" fill="#475569" opacity="0.1" />
          <rect x="638" y="204" width="24" height="28" rx="3" fill="#475569" opacity="0.08" />
          <circle cx="634" cy="232" r="9" fill="none" stroke="#475569" strokeWidth="1.2" opacity="0.15" />
          <circle cx="666" cy="232" r="9" fill="none" stroke="#475569" strokeWidth="1.2" opacity="0.15" />

          {/* End-opening: Controls panel on side wall */}
          <rect x="548" y="140" width="12" height="60" rx="2" fill="#2563EB" opacity="0.15" stroke="#2563EB" strokeWidth="1" />
          <text x="570" y="175" fontFamily="Manrope, sans-serif" fontSize="6" fill="#1E3A8A" fontWeight="600">CONTROLS</text>

          {/* End-opening: Reach range indicator */}
          <line x1="554" y1="135" x2="554" y2="205" stroke="#2563EB" strokeWidth="0.5" strokeDasharray="3 2" opacity="0.4" />
          <text x="554" y="128" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5.5" fill="#1E3A8A">15"–48"</text>

          {/* Width dim */}
          <line x1="540" y1="410" x2="760" y2="410" stroke="#C2410C" strokeWidth="1" />
          <line x1="540" y1="404" x2="540" y2="416" stroke="#C2410C" strokeWidth="1" />
          <line x1="760" y1="404" x2="760" y2="416" stroke="#C2410C" strokeWidth="1" />
          <rect x="622" y="413" width="56" height="14" rx="3" fill="#C2410C" />
          <text x="650" y="423" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('36', '915')} min</text>

          {/* Depth dim */}
          <line x1="790" y1="60" x2="790" y2="380" stroke="#C2410C" strokeWidth="1" />
          <line x1="784" y1="60" x2="796" y2="60" stroke="#C2410C" strokeWidth="1" />
          <line x1="784" y1="380" x2="796" y2="380" stroke="#C2410C" strokeWidth="1" />
          <rect x="798" y="213" width="52" height="14" rx="3" fill="#C2410C" />
          <text x="824" y="223" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('54', '1370')} min</text>

          {/* Speed/travel note */}
          <rect x="540" y="460" width="220" height="36" rx="8" fill="#B45309" opacity="0.05" stroke="#B45309" strokeWidth="1" />
          <text x="650" y="478" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fill="#78350F" fontWeight="600">Max travel: 25 ft · Max speed: 30 ft/min</text>
          <text x="650" y="490" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#78350F">Complies with ASME A17.1</text>

          {/* Where permitted note */}
          <rect x="100" y="460" width="320" height="36" rx="8" fill="#7C3AED" opacity="0.05" stroke="#7C3AED" strokeWidth="1" />
          <text x="260" y="478" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fill="#5B21B6" fontWeight="600">Permitted where standard elevator not required</text>
          <text x="260" y="490" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#5B21B6">Buildings ≤ 2 stories per §206.6</text>

          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity=".3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from=".4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="510" fontFamily="Manrope, sans-serif" fontSize="9" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      {ac && (
        <div ref={panelRef} style={{ marginTop: 12, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', animation: 'luFade .25s ease-out' }}>
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
      <style>{`@keyframes luFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}        @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}