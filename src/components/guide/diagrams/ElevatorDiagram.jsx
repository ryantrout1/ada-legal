import React, { useState, useRef, useEffect, useCallback } from 'react';

const ELV_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#407-elevators';
const CALLOUTS = [
  { id: 1, label: 'Cab Size', section: '§407.4.1', color: '#C2410C', textColor: '#8B2E08', x: 100, y: 42,
    plain: 'Elevator cab dimensions depend on door configuration. Most common: center-opening door requires 80 inches deep × 51 inches wide minimum; side-opening door requires 68 inches deep × 51 inches wide. LULA (Limited Use/Limited Application) elevators may be 54 × 36 inches minimum. The cab must provide enough space for a wheelchair to enter, turn, and reach controls.',
    legal: '"Inside dimensions per Table 407.4.1." Center-opening: 80 × 51 inches min. Side-opening: 68 × 51 inches min.', citation: '§407.4.1' },
  { id: 2, label: 'Door Width', section: '§407.4.3', color: '#16A34A', textColor: '#14532D', x: 300, y: 42,
    plain: 'The clear opening width of the elevator door must be at least 36 inches for side-opening doors and 42 inches for center-opening doors. This width must be maintained when the doors are fully open. The opening must be wide enough for a standard wheelchair (typically 25-27 inches wide) plus clearance for hands on wheel rims.',
    legal: '"Elevator car doors shall provide a clear width of 36 inches minimum for side-opening and 42 inches minimum for center-opening."', citation: '§407.4.3' },
  { id: 3, label: 'Door Timing', section: '§407.3.4', color: '#2563EB', textColor: '#1E3A8A', x: 500, y: 42,
    plain: 'Elevator doors must stay open long enough for a person using a wheelchair to enter. The minimum time is calculated: distance from the hall call button to the car door, divided by 1.5 feet per second. The doors must have a reopening device that automatically reopens when obstructed, and a "nudging mode" (slow close with audible signal) for extended holds.',
    legal: '"The minimum acceptable time from notification that a car is answering a call until the doors start to close shall be calculated using: D/1.5 ft/s." Reopening device required.', citation: '§407.3.4' },
  { id: 4, label: 'Controls Inside', section: '§407.4.7', color: '#7C3AED', textColor: '#5B21B6', x: 100, y: 260,
    plain: 'Floor buttons must be within reach range (15-48 inches for side approach). Each button must have raised characters and Braille to its left. Visual indicators confirm button registration. Emergency controls (alarm, phone, stop) are grouped at the bottom of the panel. The emergency phone must have volume control and work without a handset. Key slots at 48 inches max.',
    legal: '"Floor buttons shall be provided in the car… within one of the reach ranges specified in §308." Raised characters and Braille per §703. Emergency controls grouped at bottom.', citation: '§407.4.7' },
  { id: 5, label: 'Hall Calls Outside', section: '§407.2.1', color: '#D97706', textColor: '#78350F', x: 300, y: 260,
    plain: 'Hall call buttons outside the elevator must be mounted 42 inches maximum above the floor. Each button must be at least ¾ inch in diameter. A visual indicator must confirm the call is registered. Up and down buttons must be distinguishable visually and tactilely (raised arrow symbols). Buttons must have a visible and audible response when pressed.',
    legal: '"Call buttons shall be located 42 inches maximum above the finish floor." Diameter: "3/4 inch minimum." Visual indicator required.', citation: '§407.2.1' },
  { id: 6, label: 'Hall Signals', section: '§407.2.2', color: '#DB2777', textColor: '#9D174D', x: 500, y: 260,
    plain: 'When the elevator arrives, both visible and audible signals must indicate which car is answering and which direction it\'s going. Audible signals: one tone for up, two tones for down (or verbal announcement). Visible signals: illuminated arrows visible from the hall call button area. Signals must be at least 2.5 inches high.',
    legal: '"A visible and audible signal at each hoistway entrance shall indicate which car is answering a call and the car\'s direction of travel." One tone up, two down.', citation: '§407.2.2' },
  { id: 7, label: 'Floor Designation', section: '§407.4.7.1', color: '#0891B2', textColor: '#0C4A6E', x: 700, y: 150,
    plain: 'Floor designations must be provided in raised characters and Braille on BOTH door jambs (both sides of the door opening), centered at 48 inches above the floor. Characters must be at least 2 inches high. This allows a person who is blind to confirm their floor by touching either jamb as they exit. The star symbol (★) must mark the main entry floor.',
    legal: '"Floor designations… provided in raised characters and Braille complying with §703.2 and §703.3 on both jambs." Height: "48 inches above the finish floor." Characters: "2 inches high minimum."', citation: '§407.4.7.1' }
];

function makeLink(t) { return (<a href={ELV_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}>{t}<span aria-hidden="true" style={{ fontSize: '.65em', marginLeft: 1, verticalAlign: 'super' }}>↗</span></a>); }
function parseCite(t) { return t.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

export default function ElevatorDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>§407 Elevators</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--slate-500)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--slate-200)', background: isA ? '#1A1F2B' : 'white', color: isA ? 'white' : 'var(--slate-600)', cursor: 'pointer', minHeight: 44 }}>{u}</button>); })}
        </div>
      </div>
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden' }}>
        <svg viewBox="0 0 900 420" role="img" aria-labelledby="elv-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="elv-title">ADA §407 Elevators — Plan View and Control Panel</title>
          <rect width="900" height="420" fill="#FAFAF9" />

          {/* LEFT: Cab Plan View */}
          <text x="210" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing=".08em">PLAN VIEW — ELEVATOR CAB</text>
          {/* Cab walls */}
          <rect x="60" y="50" width="300" height="320" rx="4" fill="white" stroke="#94A3B8" strokeWidth="2.5" />
          {/* Door opening (center) */}
          <rect x="135" y="46" width="150" height="8" rx="0" fill="#FAFAF9" stroke="none" />
          <line x1="135" y1="50" x2="135" y2="42" stroke="#16A34A" strokeWidth="3" />
          <line x1="285" y1="50" x2="285" y2="42" stroke="#16A34A" strokeWidth="3" />
          <line x1="135" y1="42" x2="180" y2="42" stroke="#16A34A" strokeWidth="2" strokeDasharray="4 3" />
          <line x1="240" y1="42" x2="285" y2="42" stroke="#16A34A" strokeWidth="2" strokeDasharray="4 3" />
          <text x="210" y="38" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#14532D" fontWeight="600">DOOR ({d('42', '1065')} center)</text>
          {/* Cab width */}
          <line x1="60" y1="385" x2="360" y2="385" stroke="#C2410C" strokeWidth="1" />
          <line x1="60" y1="379" x2="60" y2="391" stroke="#C2410C" strokeWidth="1" />
          <line x1="360" y1="379" x2="360" y2="391" stroke="#C2410C" strokeWidth="1" />
          <rect x="170" y="388" width="80" height="13" rx="3" fill="#C2410C" />
          <text x="210" y="397" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('51', '1295')} min wide</text>
          {/* Cab depth */}
          <line x1="375" y1="50" x2="375" y2="370" stroke="#C2410C" strokeWidth="1" />
          <line x1="369" y1="50" x2="381" y2="50" stroke="#C2410C" strokeWidth="1" />
          <line x1="369" y1="370" x2="381" y2="370" stroke="#C2410C" strokeWidth="1" />
          <rect x="378" y="200" width="76" height="13" rx="3" fill="#C2410C" />
          <text x="416" y="209" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('80', '2030')} deep</text>
          {/* Wheelchair icon */}
          <circle cx="210" cy="220" r="18" fill="#E2E8F0" stroke="#475569" strokeWidth="1.2" />
          <rect x="192" y="195" width="36" height="20" rx="4" fill="none" stroke="#64748B" strokeWidth="1" />
          <circle cx="195" cy="248" r="10" fill="none" stroke="#64748B" strokeWidth="0.8" />
          <circle cx="225" cy="248" r="10" fill="none" stroke="#64748B" strokeWidth="0.8" />
          {/* Turning space */}
          <circle cx="210" cy="220" r="55" fill="none" stroke="#7C3AED" strokeWidth="1" strokeDasharray="4 3" opacity="0.3" />
          <text x="210" y="285" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#5B21B6">Turning space</text>
          {/* Control panel location */}
          <rect x="330" y="80" width="24" height="100" rx="2" fill="#7C3AED" opacity="0.1" stroke="#7C3AED" strokeWidth="1" />
          <text x="342" y="140" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5" fill="#5B21B6" fontWeight="600" transform="rotate(-90 342 140)">PANEL</text>

          {/* DIVIDER */}
          <line x1="475" y1="20" x2="475" y2="410" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />

          {/* RIGHT: Control Panel Elevation */}
          <text x="690" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing=".08em">CONTROL PANEL ELEVATION</text>
          {/* Panel background */}
          <rect x="600" y="50" width="180" height="330" rx="8" fill="#1A1F2B" stroke="#64748B" strokeWidth="1.5" />
          {/* Floor buttons */}
          {[1,2,3,4,5].map(f => (
            <React.Fragment key={f}>
              <circle cx={640 + (f % 2 === 0 ? 60 : 0)} cy={300 - (Math.floor((f - 1) / 2)) * 50} r="12" fill="#334155" stroke="#64748B" strokeWidth="1" />
              <text x={640 + (f % 2 === 0 ? 60 : 0)} y={304 - (Math.floor((f - 1) / 2)) * 50} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{f}</text>
            </React.Fragment>
          ))}
          {/* Braille labels */}
          <text x="720" y="170" fontFamily="Manrope, sans-serif" fontSize="6" fill="#4B5563">← Braille + raised</text>
          <text x="720" y="180" fontFamily="Manrope, sans-serif" fontSize="6" fill="#4B5563">   characters each</text>
          {/* Emergency controls at bottom */}
          <rect x="620" y="330" width="140" height="35" rx="4" fill="#EF4444" opacity="0.1" stroke="#EF4444" strokeWidth="1" />
          <text x="690" y="350" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#EF4444" fontWeight="600">🔔 ALARM  📞 PHONE  ⏹ STOP</text>
          {/* Star on floor 1 */}
          <text x="618" y="308" fontFamily="Manrope, sans-serif" fontSize="10" fill="#78350F">★</text>
          {/* Reach range zone */}
          <line x1="590" y1="95" x2="590" y2="360" stroke="#D97706" strokeWidth="1" strokeDasharray="4 3" />
          <rect x="540" y="95" width="46" height="12" rx="3" fill="#D97706" />
          <text x="563" y="104" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fontWeight="700" fill="white">{d('48', '1220')}</text>
          <rect x="540" y="350" width="46" height="12" rx="3" fill="#D97706" />
          <text x="563" y="359" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fontWeight="700" fill="white">{d('15', '380')}</text>

          {/* Hall call button note (outside) */}
          <rect x="500" y="260" width="80" height="40" rx="6" fill="#D97706" opacity="0.06" stroke="#D97706" strokeWidth="1" />
          <text x="540" y="278" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#78350F" fontWeight="600">Hall calls</text>
          <text x="540" y="290" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#78350F">≤ {d('42', '1065')}</text>

          {/* Floor jamb designation */}
          <rect x="790" y="120" width="90" height="55" rx="6" fill="#0EA5E9" opacity="0.04" stroke="#0891B2" strokeWidth="1" />
          <text x="835" y="140" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#0C4A6E" fontWeight="600">JAMB SIGNS</text>
          <text x="835" y="153" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#0C4A6E">Both sides, {d('48', '1220')}</text>
          <text x="835" y="165" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#0C4A6E">{d('2', '51')} high min</text>

          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity=".3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from=".4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="410" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      {ac && (
        <div ref={panelRef} style={{ marginTop: 12, background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden', animation: 'elvFade .25s ease-out' }}>
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
      <style>{`@keyframes elvFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}        @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}