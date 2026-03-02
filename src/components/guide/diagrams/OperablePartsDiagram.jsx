import React, { useState, useRef, useEffect, useCallback } from 'react';

const OP_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#309-operable-parts';
const CALLOUTS = [
  { id: 1, label: 'Height Range', section: '§309.3', color: '#C2410C', textColor: '#8B2E08', x: 100, y: 42, plain: 'All operable parts must be located between 15 inches minimum and 48 inches maximum above the floor. This range matches the reach ranges in §308 for both forward and side approaches. Controls mounted above 48 inches are inaccessible to most wheelchair users. Controls below 15 inches require excessive bending.', legal: '"Operable parts shall be placed within one or more of the reach ranges specified in §308." Forward/side unobstructed: 15 to 48 inches.', citation: '§309.3' },
  { id: 2, label: 'One-Hand Operation', section: '§309.4', color: '#15803D', textColor: '#14532D', x: 300, y: 42, plain: 'Every operable part must be usable with one hand without requiring tight grasping, pinching, or twisting of the wrist. This accommodates people with limited hand function, arthritis, amputation, or prosthetics. Lever handles, push buttons, rocker switches, and touch-activated controls all comply. Round doorknobs do not.', legal: '"Operable parts shall be operable with one hand and shall not require tight grasping, pinching, or twisting of the wrist."', citation: '§309.4' },
  { id: 3, label: 'Force', section: '§309.4', color: '#2563EB', textColor: '#1E3A8A', x: 500, y: 42, plain: 'The maximum force required to activate any operable part is 5 pounds. This applies to light switches, door handles (not the door itself), faucet controls, dispensers, and all other manually operated elements. Stiff toggle switches, tight rotary controls, and heavy push mechanisms fail this requirement.', legal: '"The force required to activate operable parts shall be 5 pounds (22.2 N) maximum."', citation: '§309.4' },
  { id: 4, label: 'Compliant Types', section: 'Advisory §309', color: '#7C3AED', textColor: '#5B21B6', x: 100, y: 280, plain: 'Controls that comply include: lever door handles, push/pull door handles, push buttons (elevator, crosswalk), rocker light switches, paddle-style faucets, sensor-activated faucets and doors, toggle switches with wide paddles, and touch screens (if within reach range). These all operate without grasping or twisting.', legal: 'Advisory §309: "Lever-operated, push-type, and electronically controlled mechanisms are examples of acceptable designs."', citation: '§309' },
  { id: 5, label: 'Non-Compliant Types', section: 'Advisory §309', color: '#92400E', textColor: '#78350F', x: 300, y: 280, plain: 'Controls that fail include: round doorknobs (require full wrist rotation), tight thumb-turn deadbolts, small twist-type faucet handles, narrow toggle switches requiring fingertip pinch, keypads with raised/small buttons requiring precise finger placement, and any mechanism requiring two hands simultaneously.', legal: 'Advisory §309: Round doorknobs, tight-grasping mechanisms, and controls requiring wrist twisting are non-compliant.', citation: '§309' },
  { id: 6, label: 'Exceptions', section: '§309 Exceptions', color: '#BE185D', textColor: '#9D174D', x: 500, y: 280, plain: 'Some operable parts are exempt: controls on dedicated equipment that is not required to be accessible (commercial kitchen appliances, industrial machinery), electrical and communication receptacles serving dedicated equipment, floor electrical receptacles, and HVAC diffusers. Key-operated locks are also exempt from the no-twisting requirement.', legal: '§309.4 Exceptions: "Electrical or communications receptacles serving a dedicated use… gas pump nozzles… operable parts used only by service personnel."', citation: '§309' },
  { id: 7, label: 'Common Applications', section: '§309.1', color: '#0E7490', textColor: '#0C4A6E', x: 700, y: 160, plain: 'Section 309 applies to: light switches, thermostats, fire alarm pull stations, electrical outlets, communication jacks (phone/data), window hardware (locks, cranks), cabinet and drawer hardware, bathroom faucets and flush controls, towel and soap dispensers, vending machine controls, and elevator buttons.', legal: '"Operable parts on accessible elements, accessible routes, and in accessible rooms and spaces shall comply with §309." All manually operated controls.', citation: '§309.1' }
];

function makeLink(t) { return (<a href={OP_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}>{t}<span aria-hidden="true" style={{ fontSize: '.65em', marginLeft: 1, verticalAlign: 'super' }}>↗</span></a>); }
function parseCite(t) { return t.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

export default function OperablePartsDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>§309 Operable Parts</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: isA ? 'var(--dark-bg)' : 'white', color: isA ? 'white' : 'var(--body)', cursor: 'pointer', minHeight: 44 }}>{u}</button>); })}
        </div>
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <svg viewBox="0 0 900 480" role="img" aria-labelledby="op-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="op-title">ADA §309 Operable Parts — Front Elevation</title>
          <rect width="900" height="480" fill="var(--page-bg-subtle)" />
          <text x="350" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing=".08em">FRONT ELEVATION — OPERABLE PARTS</text>

          {/* Wall */}
          <rect x="100" y="50" width="400" height="390" fill="#E7E5E4" opacity="0.1" stroke="#94A3B8" strokeWidth="1" rx="2" />
          {/* Floor */}
          <line x1="80" y1="440" x2="520" y2="440" stroke="#94A3B8" strokeWidth="2" />

          {/* Operable zone highlight (15"-48" = y:220 to y:370) */}
          <rect x="110" y="150" width="380" height="220" rx="4" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="2" strokeDasharray="6 3" />
          <text x="300" y="380" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#14532D" fontWeight="600">COMPLIANT ZONE: {d('15', '380')} – {d('48', '1220')}</text>

          {/* Height dims */}
          <line x1="88" y1="150" x2="88" y2="440" stroke="#C2410C" strokeWidth="1" />
          <line x1="82" y1="150" x2="94" y2="150" stroke="#C2410C" strokeWidth="1" />
          <line x1="82" y1="370" x2="94" y2="370" stroke="#C2410C" strokeWidth="1" />
          <line x1="82" y1="440" x2="94" y2="440" stroke="#C2410C" strokeWidth="1" />
          <rect x="60" y="148" width="42" height="12" rx="3" fill="#C2410C" />
          <text x="81" y="157" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('48', '1220')}</text>
          <rect x="60" y="368" width="42" height="12" rx="3" fill="#C2410C" />
          <text x="81" y="377" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('15', '380')}</text>

          {/* COMPLIANT controls (in zone) */}
          {/* Lever handle */}
          <rect x="140" y="240" width="50" height="30" rx="6" fill="#7C3AED" opacity="0.1" stroke="#7C3AED" strokeWidth="1.5" />
          <line x1="150" y1="255" x2="180" y2="255" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
          <text x="165" y="285" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#5B21B6" fontWeight="600">Lever ✓</text>
          {/* Rocker switch */}
          <rect x="220" y="240" width="30" height="50" rx="4" fill="#7C3AED" opacity="0.1" stroke="#7C3AED" strokeWidth="1.5" />
          <rect x="225" y="243" width="20" height="22" rx="2" fill="#7C3AED" opacity="0.2" />
          <text x="235" y="305" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#5B21B6" fontWeight="600">Rocker ✓</text>
          {/* Push button */}
          <circle cx="300" cy="260" r="15" fill="#7C3AED" opacity="0.1" stroke="#7C3AED" strokeWidth="1.5" />
          <circle cx="300" cy="260" r="8" fill="#7C3AED" opacity="0.2" />
          <text x="300" y="290" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#5B21B6" fontWeight="600">Push ✓</text>
          {/* Outlet */}
          <rect x="355" y="320" width="30" height="40" rx="3" fill="#7C3AED" opacity="0.1" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="370" y="375" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#5B21B6" fontWeight="600">Outlet ✓</text>

          {/* NON-COMPLIANT above zone */}
          <rect x="140" y="80" width="50" height="40" rx="6" fill="#EF4444" opacity="0.08" stroke="#EF4444" strokeWidth="1.5" />
          <text x="165" y="105" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#EF4444" fontWeight="600">TOO HIGH</text>
          <text x="165" y="135" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#EF4444">✕ Thermostat</text>

          {/* NON-COMPLIANT controls (knobs) */}
          <circle cx="430" cy="200" r="18" fill="#B45309" opacity="0.08" stroke="#B45309" strokeWidth="1.5" />
          <text x="430" y="204" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#78350F" fontWeight="600">KNOB</text>
          <text x="430" y="230" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#78350F">✕ Twist required</text>

          {/* 5 lbs max label */}
          <rect x="330" y="168" width="80" height="20" rx="4" fill="#2563EB" opacity="0.06" stroke="#2563EB" strokeWidth="1" />
          <text x="370" y="182" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#1E3A8A" fontWeight="600">≤ 5 lbs force</text>

          {/* Wheelchair user */}
          <circle cx="600" cy="260" r="12" fill="#E2E8F0" stroke="#475569" strokeWidth="1.2" />
          <line x1="600" y1="272" x2="600" y2="330" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="588" cy="365" r="22" fill="none" stroke="#64748B" strokeWidth="1.2" />
          <circle cx="630" cy="382" r="9" fill="none" stroke="#64748B" strokeWidth="0.8" />
          <line x1="596" y1="330" x2="584" y2="360" stroke="#64748B" strokeWidth="1.5" />
          <line x1="604" y1="330" x2="630" y2="374" stroke="#64748B" strokeWidth="1.5" />
          <line x1="600" y1="295" x2="510" y2="260" stroke="#475569" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
          <line x1="596" y1="330" x2="576" y2="360" stroke="#475569" strokeWidth="1.5" />
          <line x1="604" y1="330" x2="624" y2="360" stroke="#475569" strokeWidth="1.5" />
          {/* Backrest */}
          <line x1="596" y1="330" x2="592" y2="290" stroke="#64748B" strokeWidth="2" />

          {/* Common applications box */}
          <rect x="560" y="70" width="170" height="130" rx="8" fill="#0EA5E9" opacity="0.04" stroke="#0891B2" strokeWidth="1" />
          <text x="645" y="90" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#0C4A6E" fontWeight="700">COMMON APPLICATIONS</text>
          {['Light switches', 'Thermostats', 'Fire alarm pulls', 'Faucets & dispensers', 'Door hardware', 'Elevator buttons', 'Window locks'].map((t, i) => (
            <text key={i} x="575" y={108 + i * 13} fontFamily="Manrope, sans-serif" fontSize="7" fill="#0C4A6E">• {t}</text>
          ))}

          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity=".3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from=".4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="470" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      {ac && (
        <div ref={panelRef} style={{ marginTop: 12, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', animation: 'opFade .25s ease-out' }}>
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
            <aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: '#FFFBF7', borderLeft: '3px solid #C2410C', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard — {parseCite(ac.citation)}</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(ac.legal)}</p>
            </div></aside>
          </div>
        </div>
      )}
      <style>{`@keyframes opFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}        @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}