import React, { useState, useRef, useEffect, useCallback } from 'react';

const REACH_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#308-reach-ranges';

/* ── FORWARD REACH callouts (diagram 1) ── */
const FWD_CALLOUTS = [
  {
    id: 1, label: 'Unobstructed Forward Reach', section: '§308.2.1',
    color: '#C2410C', textColor: '#7C2D12',
    x: 100, y: 52,
    plain: 'When a wheelchair user approaches an element head-on with nothing in the way, the reach range is 15 inches minimum to 48 inches maximum above the floor. This covers controls like elevator buttons, light switches, and thermostats mounted on a wall. A clear floor space of 30 × 48 inches must be provided in front of the element so the wheelchair can pull straight up to it.',
    legal: '"Where a forward reach is unobstructed, the high forward reach shall be 48 inches (1220 mm) maximum and the low forward reach shall be 15 inches (380 mm) minimum above the finish floor or ground."',
    citation: '§308.2.1'
  },
  {
    id: 2, label: 'Obstructed Forward Reach', section: '§308.2.2',
    color: '#15803D', textColor: '#14532D',
    x: 470, y: 52,
    plain: 'When reaching forward over a counter, shelf, or other obstruction, the maximum reach height decreases as the obstruction gets deeper. If the obstruction is up to 20 inches deep, the maximum high reach is 48 inches. If it\u0027s 20 to 25 inches deep, the maximum drops to 44 inches. Obstructions deeper than 25 inches are not permitted — you\u0027d need a side approach instead.',
    legal: '"Where the high forward reach is over an obstruction, the clear floor space shall extend beneath the element for a distance not less than the required reach depth over the obstruction." Obstruction \u226420 inches: high reach 48 inches max. Obstruction 20\u201325 inches: high reach 44 inches max.',
    citation: '§308.2.2'
  }
];

/* ── SIDE REACH callouts (diagram 2) ── */
const SIDE_CALLOUTS = [
  {
    id: 1, label: 'Unobstructed Side Reach', section: '§308.3.1',
    color: '#2563EB', textColor: '#1E3A8A',
    x: 100, y: 52,
    plain: 'When approaching from the side (parallel to the element), with the wheelchair alongside it, the reach range is 15 inches minimum to 48 inches maximum above the floor — same as unobstructed forward reach. This is common for wall-mounted fire extinguishers, paper towel dispensers, and coat hooks.',
    legal: '"Where a clear floor or ground space allows a parallel approach to an element and the side reach is unobstructed, the high side reach shall be 48 inches (1220 mm) maximum and the low side reach shall be 15 inches (380 mm) minimum above the finish floor or ground."',
    citation: '§308.3.1'
  },
  {
    id: 2, label: 'Obstructed Side Reach', section: '§308.3.2',
    color: '#7C3AED', textColor: '#5B21B6',
    x: 470, y: 52,
    plain: 'When reaching sideways over an obstruction (like a counter or shelf), the rules depend on depth. Up to 10 inches deep: maximum reach is 48 inches (same as unobstructed). Between 10 and 24 inches deep: maximum drops to 46 inches. Obstructions deeper than 24 inches are not permitted for side reach. The obstruction cannot be taller than 34 inches.',
    legal: '"Where a clear floor or ground space allows a parallel approach to an element and the high side reach is over an obstruction, the height of the obstruction shall be 34 inches (865 mm) maximum and the depth shall be 24 inches (610 mm) maximum." 10\u201324 inches deep: high reach 46 inches max.',
    citation: '§308.3.2'
  }
];


function makeLink(text) {
  return (
    <a href={REACH_URL} target="_blank" rel="noopener noreferrer"
      style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }}
      aria-label={`${text} on ADA.gov (opens in new tab)`}>
      {text}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span>
    </a>
  );
}

function parseCitations(text) {
  return text.split(/(§\d{3,4}(?:\.\d+)*)/g).map((part, i) =>
    /^§\d{3,4}/.test(part)
      ? <React.Fragment key={i}>{makeLink(part)}</React.Fragment>
      : part
  );
}


/* ── Reusable callout panel ── */
function CalloutPanel({ callout, onClose, panelRef }) {
  if (!callout) return null;
  return (
    <div ref={panelRef} style={{
      marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: '12px', overflow: 'hidden', animation: 'reachFadeIn 0.25s ease-out'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)',
        flexWrap: 'wrap', gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '26px', height: '26px', borderRadius: '50%',
            background: callout.color, color: 'white',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700
          }}>{callout.id}</span>
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>
            {callout.label}
          </span>
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
            color: callout.color, background: `${callout.color}15`,
            padding: '2px 8px', borderRadius: '4px'
          }}>{callout.section}</span>
        </div>
        <button onClick={onClose} aria-label="Close panel"
          style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: '8px',
            padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
            fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px'
          }}>Close <span aria-hidden="true">{'\u2715'}</span></button>
      </div>
      <div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}>
        <div style={{ flex: '1 1 55%', minWidth: 0 }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>
            {callout.plain}
          </p>
        </div>
        <aside style={{ flex: '1 1 40%', minWidth: 0 }}>
          <div style={{
            background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)',
            borderRadius: '0 10px 10px 0', padding: '16px 18px'
          }}>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--body-secondary)', margin: '0 0 8px'
            }}>Official Standard — {parseCitations(callout.citation)}</p>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
              color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic'
            }}>{parseCitations(callout.legal)}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}


/* ── Key fact row ── */
function KeyFact({ color, number, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '6px 0' }}>
      <span style={{
        background: color, color: 'white', fontFamily: 'Manrope, sans-serif',
        fontSize: '0.95rem', fontWeight: 700, minWidth: '60px', textAlign: 'center',
        padding: '3px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap'
      }}>{number}</span>
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>
        {children}
      </span>
    </div>
  );
}


/* ── Callout dots shared renderer ── */
function CalloutDots({ callouts, active, toggle }) {
  return callouts.map(c => (
    <g key={c.id}
      tabIndex="0" role="button"
      aria-label={`Callout ${c.id}: ${c.label} \u2014 ${c.section}. Press Enter for details.`}
      aria-expanded={active === c.id}
      onClick={() => toggle(c.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }}
      style={{ cursor: 'pointer', outline: 'none' }}>
      {active === c.id && (
        <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3">
          <animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}
      <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'}
        stroke={c.color} strokeWidth="2" />
      <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif"
        fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
      <circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2"
        className="reach-focus-ring" />
    </g>
  ));
}


/* ── Wheelchair side view (used in forward reach) ── */
function WheelchairSide({ x, y, armToX, armToY }) {
  return (
    <g transform={`translate(${x},${y}) scale(1.3)`}>
      <circle cx="22" cy="10" r="9" fill="#E2E8F0" stroke="#475569" strokeWidth="1.8" />
      <line x1="25" y1="50" x2="22" y2="22" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="15" y1="55" x2="55" y2="55" stroke="#475569" strokeWidth="2" />
      <line x1="15" y1="55" x2="10" y2="73" stroke="#475569" strokeWidth="1.8" />
      <line x1="55" y1="55" x2="55" y2="75" stroke="#475569" strokeWidth="1.8" />
      <line x1="15" y1="55" x2="12" y2="28" stroke="#475569" strokeWidth="2" />
      <circle cx="20" cy="73" r="20" fill="none" stroke="#475569" strokeWidth="2.2" />
      <circle cx="58" cy="80" r="7" fill="none" stroke="#475569" strokeWidth="1.5" />
      <line x1="40" y1="80" x2="55" y2="80" stroke="#475569" strokeWidth="1.5" />
      <line x1="24" y1="30" x2={armToX} y2={armToY} stroke="#475569" strokeWidth="2.2" strokeLinecap="round" />
    </g>
  );
}

/* ── Wheelchair front view (used in side reach) ── */
function WheelchairFront({ x, y, armToX, armToY, dotColor }) {
  return (
    <g transform={`translate(${x},${y}) scale(1.3)`}>
      <circle cx="40" cy="10" r="10" fill="#E2E8F0" stroke="#475569" strokeWidth="1.8" />
      <rect x="26" y="24" width="28" height="40" rx="5" fill="none" stroke="#475569" strokeWidth="2" />
      <circle cx="25" cy="100" r="22" fill="none" stroke="#475569" strokeWidth="2.2" />
      <circle cx="55" cy="100" r="22" fill="none" stroke="#475569" strokeWidth="2.2" />
      <line x1="26" y1="36" x2={armToX} y2={armToY} stroke="#475569" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx={armToX - 1} cy={armToY - 1} r="4" fill={dotColor} opacity="0.35" />
    </g>
  );
}


export default function ReachRangeDiagram() {
  const [fwdActive, setFwdActive] = useState(null);
  const [sideActive, setSideActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const fwdPanelRef = useRef(null);
  const sidePanelRef = useRef(null);

  const toggleFwd = useCallback((id) => {
    setFwdActive(prev => prev === id ? null : id);
    setSideActive(null);
  }, []);
  const toggleSide = useCallback((id) => {
    setSideActive(prev => prev === id ? null : id);
    setFwdActive(null);
  }, []);

  useEffect(() => {
    if (fwdActive && fwdPanelRef.current) fwdPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [fwdActive]);
  useEffect(() => {
    if (sideActive && sidePanelRef.current) sidePanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [sideActive]);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') { setFwdActive(null); setSideActive(null); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const d = (inches, mm) => metric ? `${mm} mm` : `${inches}\u2033`;

  const fwdCallout = FWD_CALLOUTS.find(c => c.id === fwdActive);
  const sideCallout = SIDE_CALLOUTS.find(c => c.id === sideActive);

  const unitToggle = (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
      {['Imperial', 'Metric'].map(u => {
        const isA = u === 'Metric' ? metric : !metric;
        return (
          <button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA}
            style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500,
              padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)',
              background: isA ? 'var(--heading)' : 'var(--card-bg)',
              color: isA ? 'var(--page-bg)' : 'var(--body)',
              cursor: 'pointer', minHeight: '44px'
            }}>{u}</button>
        );
      })}
    </div>
  );

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>

      {/* ════════════════════════════════════════════ */}
      {/*  DIAGRAM 1: FORWARD REACH                   */}
      {/* ════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '8px', flexWrap: 'wrap', gap: '8px'
      }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>
          Forward Reach
        </h3>
        {unitToggle}
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 380" role="img" aria-labelledby="fwd-title fwd-desc"
          style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="fwd-title">Forward Reach Range</title>
          <desc id="fwd-desc">
            Two side views of a person in a wheelchair reaching forward. Left: nothing in the way,
            reachable zone is 15 to 48 inches above floor. Right: reaching over a counter no deeper
            than 25 inches, maximum reach drops to 44 inches.
          </desc>
          <rect width="720" height="380" fill="var(--page-bg-subtle)" />

          {/* ─── LEFT: Nothing in the way ─── */}
          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">
            Nothing in the way
          </text>

          {/* Wall */}
          <rect x="258" y="60" width="10" height="268" fill="#CBD5E1" rx="2" />
          <text x="250" y="55" textAnchor="end" fontFamily="Manrope, sans-serif" fontSize="10" fill="#94A3B8" fontWeight="600">wall</text>

          {/* Reachable zone */}
          <rect x="70" y="96" width="188" height="200" fill="#C2410C" opacity="0.05" rx="6" stroke="#C2410C" strokeWidth="1.5" />

          {/* 48" max line */}
          <line x1="60" y1="96" x2="270" y2="96" stroke="#C2410C" strokeWidth="1.5" strokeDasharray="4 3" />
          <rect x="8" y="86" width="50" height="22" rx="6" fill="#C2410C" />
          <text x="33" y="101" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill="white">{d('48', '1220')}</text>
          <text x="33" y="122" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="600">max high</text>

          {/* 15" min line */}
          <line x1="60" y1="296" x2="270" y2="296" stroke="#C2410C" strokeWidth="1.5" strokeDasharray="4 3" />
          <rect x="8" y="286" width="50" height="22" rx="6" fill="#C2410C" />
          <text x="33" y="301" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill="white">{d('15', '380')}</text>
          <text x="33" y="322" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="600">min low</text>

          {/* Wheelchair */}
          <WheelchairSide x={110} y={180} armToX={65} armToY={-20} />

          {/* Floor */}
          <line x1="30" y1="328" x2="340" y2="328" stroke="#94A3B8" strokeWidth="2" />


          {/* ─── DIVIDER ─── */}
          <line x1="360" y1="20" x2="360" y2="360" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />


          {/* ─── RIGHT: Reaching over a counter ─── */}
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">
            Reaching over a counter
          </text>

          {/* Wall */}
          <rect x="638" y="60" width="10" height="268" fill="#CBD5E1" rx="2" />

          {/* Counter */}
          <rect x="540" y="195" width="100" height="10" rx="2" fill="#94A3B8" stroke="#64748B" strokeWidth="1.5" />
          <text x="590" y="190" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B" fontWeight="600">counter surface</text>

          {/* Counter depth */}
          <line x1="540" y1="218" x2="640" y2="218" stroke="#15803D" strokeWidth="1.5" />
          <line x1="540" y1="211" x2="540" y2="225" stroke="#15803D" strokeWidth="1.5" />
          <line x1="640" y1="211" x2="640" y2="225" stroke="#15803D" strokeWidth="1.5" />
          <rect x="557" y="224" width="66" height="20" rx="6" fill="#15803D" />
          <text x="590" y="238" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{'\u2264'} {d('25', '635')} deep</text>

          {/* Reach zone */}
          <rect x="460" y="96" width="178" height="98" fill="#15803D" opacity="0.04" rx="6" stroke="#15803D" strokeWidth="1.5" />

          {/* 44-48" max */}
          <line x1="450" y1="96" x2="650" y2="96" stroke="#15803D" strokeWidth="1.5" strokeDasharray="4 3" />
          <rect x="654" y="82" width="62" height="28" rx="6" fill="#15803D" />
          <text x="685" y="100" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('44\u201348', '1120')}</text>
          <text x="685" y="124" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="600">max high</text>
          <text x="685" y="138" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#94A3B8">(depends on</text>
          <text x="685" y="150" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#94A3B8">counter depth)</text>

          {/* Wheelchair */}
          <WheelchairSide x={440} y={180} armToX={80} armToY={-15} />

          {/* Floor */}
          <line x1="390" y1="328" x2="710" y2="328" stroke="#94A3B8" strokeWidth="2" />

          {/* Callout dots */}
          <CalloutDots callouts={FWD_CALLOUTS} active={fwdActive} toggle={toggleFwd} />

          <text x="20" y="365" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">
            Click or tap numbered callouts for details
          </text>
        </svg>
      </div>

      {/* Forward callout panel */}
      <div aria-live="polite" className="sr-only">
        {fwdCallout ? `Showing callout ${fwdCallout.id}: ${fwdCallout.label}` : ''}
      </div>
      <CalloutPanel callout={fwdCallout} onClose={() => setFwdActive(null)} panelRef={fwdPanelRef} />

      {/* Forward key facts */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '20px 24px', marginTop: '12px'
      }}>
        <p style={{
          fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700,
          color: 'var(--heading)', margin: '0 0 12px'
        }}>Key numbers {'\u2014'} Forward Reach</p>
        <KeyFact color="#C2410C" number={`${d('15', '380')} \u2013 ${d('48', '1220')}`}>
          Reachable zone when nothing is in the way (15 to 48 inches above the floor)
        </KeyFact>
        <KeyFact color="#15803D" number={`\u2264 ${d('25', '635')}`}>
          Maximum counter depth you can reach over {'\u2014'} deeper than 25 inches means the control is too far
        </KeyFact>
        <KeyFact color="#15803D" number={`${d('44', '1120')} \u2013 ${d('48', '1220')}`}>
          Maximum height drops to 44 inches when reaching over a counter 20{'\u2013'}25 inches deep
        </KeyFact>
      </div>


      {/* ════════════════════════════════════════════ */}
      {/*  DIAGRAM 2: SIDE REACH                      */}
      {/* ════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: '40px', marginBottom: '8px', flexWrap: 'wrap', gap: '8px'
      }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>
          Side Reach
        </h3>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 380" role="img" aria-labelledby="side-title side-desc"
          style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="side-title">Side Reach Range</title>
          <desc id="side-desc">
            Two views of a person in a wheelchair reaching sideways. Left: nothing in the way,
            reachable zone 15 to 48 inches. Right: reaching over a cabinet no deeper than 24 inches
            and no taller than 34 inches, max reach 46 inches.
          </desc>
          <rect width="720" height="380" fill="var(--page-bg-subtle)" />

          {/* ─── LEFT: Nothing in the way ─── */}
          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">
            Nothing in the way
          </text>

          {/* Wall */}
          <rect x="68" y="60" width="10" height="268" fill="#CBD5E1" rx="2" />

          {/* Light switch */}
          <rect x="78" y="178" width="14" height="22" rx="3" fill="white" stroke="#94A3B8" strokeWidth="1.5" />
          <rect x="83" y="184" width="4" height="10" rx="1" fill="#94A3B8" />
          <text x="85" y="172" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B" fontWeight="500">light</text>
          <text x="85" y="160" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B" fontWeight="500">switch</text>

          {/* Reach zone */}
          <rect x="78" y="96" width="70" height="200" fill="#2563EB" opacity="0.05" rx="6" stroke="#2563EB" strokeWidth="1.5" />

          {/* 48" max */}
          <line x1="70" y1="96" x2="270" y2="96" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="4 3" />
          <rect x="272" y="86" width="50" height="22" rx="6" fill="#2563EB" />
          <text x="297" y="101" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill="white">{d('48', '1220')}</text>
          <text x="297" y="122" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#2563EB" fontWeight="600">max high</text>

          {/* 15" min */}
          <line x1="70" y1="296" x2="270" y2="296" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="4 3" />
          <rect x="272" y="286" width="50" height="22" rx="6" fill="#2563EB" />
          <text x="297" y="301" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill="white">{d('15', '380')}</text>
          <text x="297" y="322" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#2563EB" fontWeight="600">min low</text>

          {/* Person front view */}
          <WheelchairFront x={140} y={140} armToX={-30} armToY={20} dotColor="#2563EB" />

          {/* Floor */}
          <line x1="30" y1="328" x2="340" y2="328" stroke="#94A3B8" strokeWidth="2" />


          {/* ─── DIVIDER ─── */}
          <line x1="360" y1="20" x2="360" y2="360" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />


          {/* ─── RIGHT: Reaching over something ─── */}
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">
            Reaching over something
          </text>

          {/* Wall */}
          <rect x="448" y="60" width="10" height="268" fill="#CBD5E1" rx="2" />

          {/* Cabinet */}
          <rect x="458" y="210" width="60" height="118" rx="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="488" y="275" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B" fontWeight="500">cabinet</text>

          {/* Obstruction height */}
          <rect x="390" y="200" width="54" height="22" rx="6" fill="#7C3AED" />
          <text x="417" y="215" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{'\u2264'} {d('34', '865')}</text>
          <text x="417" y="236" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C3AED" fontWeight="600">max height</text>

          {/* Obstruction depth */}
          <line x1="458" y1="340" x2="518" y2="340" stroke="#15803D" strokeWidth="1.5" />
          <line x1="458" y1="333" x2="458" y2="347" stroke="#15803D" strokeWidth="1.5" />
          <line x1="518" y1="333" x2="518" y2="347" stroke="#15803D" strokeWidth="1.5" />
          <rect x="460" y="348" width="56" height="18" rx="5" fill="#15803D" />
          <text x="488" y="361" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{'\u2264'} {d('24', '610')} deep</text>

          {/* Reach zone */}
          <rect x="458" y="104" width="60" height="106" fill="#7C3AED" opacity="0.04" rx="6" stroke="#7C3AED" strokeWidth="1.5" />

          {/* 46-48" max */}
          <line x1="440" y1="104" x2="650" y2="104" stroke="#7C3AED" strokeWidth="1.5" strokeDasharray="4 3" />
          <rect x="654" y="90" width="62" height="28" rx="6" fill="#7C3AED" />
          <text x="685" y="108" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('46\u201348', '1170')}</text>
          <text x="685" y="132" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C3AED" fontWeight="600">max high</text>

          {/* Person front view */}
          <WheelchairFront x={530} y={140} armToX={-30} armToY={8} dotColor="#7C3AED" />

          {/* Floor */}
          <line x1="390" y1="328" x2="710" y2="328" stroke="#94A3B8" strokeWidth="2" />

          {/* Callout dots */}
          <CalloutDots callouts={SIDE_CALLOUTS} active={sideActive} toggle={toggleSide} />

          <text x="20" y="365" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">
            Click or tap numbered callouts for details
          </text>
        </svg>
      </div>

      {/* Side callout panel */}
      <div aria-live="polite" className="sr-only">
        {sideCallout ? `Showing callout ${sideCallout.id}: ${sideCallout.label}` : ''}
      </div>
      <CalloutPanel callout={sideCallout} onClose={() => setSideActive(null)} panelRef={sidePanelRef} />

      {/* Side key facts */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '20px 24px', marginTop: '12px'
      }}>
        <p style={{
          fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700,
          color: 'var(--heading)', margin: '0 0 12px'
        }}>Key numbers {'\u2014'} Side Reach</p>
        <KeyFact color="#2563EB" number={`${d('15', '380')} \u2013 ${d('48', '1220')}`}>
          Reachable zone when nothing is in the way {'\u2014'} same range as forward reach
        </KeyFact>
        <KeyFact color="#15803D" number={`\u2264 ${d('24', '610')}`}>
          Maximum depth of any obstruction you have to reach over sideways
        </KeyFact>
        <KeyFact color="#7C3AED" number={`\u2264 ${d('34', '865')}`}>
          The obstruction can{'\u0027'}t be taller than 34 inches or it blocks the reach
        </KeyFact>
        <KeyFact color="#7C3AED" number={`${d('46', '1170')} \u2013 ${d('48', '1220')}`}>
          Maximum reach is 46 inches when the obstruction is 10{'\u2013'}24 inches deep
        </KeyFact>
      </div>


      <style>{`
        @keyframes reachFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        g[role="button"]:focus .reach-focus-ring {
          stroke: var(--accent); stroke-width: 2.5;
        }
        @media (max-width: 768px) {
          .guide-two-col { flex-direction: column !important; gap: 16px !important; }
        }
        g[role="button"]:focus .reac-fr{stroke:var(--accent);stroke-width:2.5} @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}
