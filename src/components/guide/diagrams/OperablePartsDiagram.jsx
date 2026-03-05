import React, { useState, useRef, useEffect, useCallback } from 'react';

const OP_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#309-operable-parts';

const RULE_CALLOUTS = [
  {
    id: 1, label: 'Height Range', section: '\u00a7309.3',
    color: '#C2410C', textColor: '#7C2D12', x: 100, y: 52,
    plain: 'All operable parts must be located between 15 and 48 inches above the floor. This matches the reach ranges in \u00a7308. Controls mounted above 48 inches are unreachable for most wheelchair users. Controls below 15 inches require excessive bending. This applies to light switches, thermostats, fire alarm pull stations, electrical outlets, elevator buttons, faucet handles, dispensers, and all other manually operated elements.',
    legal: '\u201COperable parts shall be placed within one or more of the reach ranges specified in \u00a7308.\u201D Forward/side unobstructed: 15 to 48 inches.',
    citation: '\u00a7309.3'
  },
  {
    id: 2, label: 'One Hand, No Twisting, 5 lbs Max', section: '\u00a7309.4',
    color: '#15803D', textColor: '#14532D', x: 470, y: 52,
    plain: 'Every control must work with one hand, without tight grasping, pinching, or twisting of the wrist. The maximum operating force is 5 pounds. This accommodates people with limited hand function, arthritis, amputation, or prosthetics. Lever handles, push buttons, rocker switches, and touch-activated controls all comply. Round doorknobs and tight twist-locks do not.',
    legal: '\u201COperable parts shall be operable with one hand and shall not require tight grasping, pinching, or twisting of the wrist. The force required to activate operable parts shall be 5 pounds (22.2 N) maximum.\u201D',
    citation: '\u00a7309.4'
  }
];

const TYPE_CALLOUTS = [
  {
    id: 1, label: 'Compliant Controls', section: '\u00a7309.4',
    color: '#15803D', textColor: '#14532D', x: 100, y: 52,
    plain: 'Controls that comply include: lever door handles, push/pull door handles, push buttons (elevator, crosswalk), rocker light switches, paddle-style faucets, sensor-activated faucets and doors, toggle switches with wide paddles, and touch screens within reach range. These all operate without grasping or twisting.',
    legal: 'Advisory \u00a7309: \u201CLever-operated, push-type, and electronically controlled mechanisms are examples of acceptable designs.\u201D',
    citation: '\u00a7309'
  },
  {
    id: 2, label: 'Non-Compliant Controls', section: '\u00a7309.4',
    color: '#C2410C', textColor: '#7C2D12', x: 470, y: 52,
    plain: 'Controls that fail include: round doorknobs (require full wrist rotation), tight thumb-turn deadbolts, small twist-type faucet handles, narrow toggle switches requiring fingertip pinch, keypads with raised tiny buttons, and any mechanism requiring two hands simultaneously. These all violate the no-grasping and no-twisting requirements.',
    legal: 'Advisory \u00a7309: Round doorknobs, tight-grasping mechanisms, and controls requiring wrist twisting are non-compliant.',
    citation: '\u00a7309'
  }
];

function makeLink(text) {
  return (<a href={OP_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${text} on ADA.gov`}>{text}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>);
}
function parseCitations(text) {
  return text.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p);
}

function CalloutPanel({ callout, onClose, panelRef }) {
  if (!callout) return null;
  return (
    <div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'opFade 0.25s ease-out' }}>
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
      <circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="op-focus-ring" />
    </g>
  ));
}


export default function OperablePartsDiagram() {
  const [ruleActive, setRuleActive] = useState(null);
  const [typeActive, setTypeActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const ruleRef = useRef(null);
  const typeRef = useRef(null);

  const toggleRule = useCallback((id) => { setRuleActive(prev => prev === id ? null : id); setTypeActive(null); }, []);
  const toggleType = useCallback((id) => { setTypeActive(prev => prev === id ? null : id); setRuleActive(null); }, []);

  useEffect(() => { if (ruleActive && ruleRef.current) ruleRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [ruleActive]);
  useEffect(() => { if (typeActive && typeRef.current) typeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [typeActive]);
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') { setRuleActive(null); setTypeActive(null); } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);

  const d = (inches, mm) => metric ? `${mm} mm` : `${inches}\u2033`;
  const ruleCallout = RULE_CALLOUTS.find(c => c.id === ruleActive);
  const typeCallout = TYPE_CALLOUTS.find(c => c.id === typeActive);

  const unitToggle = (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
      {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}
    </div>
  );

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>

      {/* DIAGRAM 1: The Rules */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>The Three Rules</h3>
        {unitToggle}
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 380" role="img" aria-labelledby="rules-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="rules-title">Operable Parts {'\u2014'} Height Range and Operation Rules</title>
          <rect width="720" height="380" fill="var(--page-bg-subtle)" />

          {/* LEFT: Height range */}
          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Right height: {d('15', '380')}{'\u2013'}{d('48', '1220')}</text>

          {/* Wall */}
          <rect x="80" y="50" width="180" height="290" fill="#E7E5E4" opacity="0.1" stroke="#94A3B8" strokeWidth="1" rx="2" />

          {/* Compliant zone */}
          <rect x="88" y="112" width="164" height="188" rx="4" fill="#15803D" opacity="0.05" stroke="#15803D" strokeWidth="2" strokeDasharray="6 3" />

          {/* Too high zone */}
          <rect x="88" y="58" width="164" height="54" rx="4" fill="#C2410C" opacity="0.04" />
          <text x="170" y="88" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="600">too high</text>

          {/* 48" line */}
          <line x1="60" y1="112" x2="270" y2="112" stroke="#C2410C" strokeWidth="1.5" strokeDasharray="4 3" />
          <rect x="272" y="102" width="50" height="22" rx="6" fill="#C2410C" />
          <text x="297" y="117" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill="white">{d('48', '1220')}</text>

          {/* 15" line */}
          <line x1="60" y1="300" x2="270" y2="300" stroke="#C2410C" strokeWidth="1.5" strokeDasharray="4 3" />
          <rect x="272" y="290" width="50" height="22" rx="6" fill="#C2410C" />
          <text x="297" y="305" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill="white">{d('15', '380')}</text>

          {/* Example controls in the zone */}
          {/* Switch */}
          <rect x="110" y="175" width="20" height="32" rx="3" fill="white" stroke="#15803D" strokeWidth="1.5" />
          <rect x="115" y="178" width="10" height="14" rx="1.5" fill="#15803D" opacity="0.3" />
          <text x="120" y="222" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="600">switch</text>

          {/* Thermostat */}
          <rect x="155" y="165" width="30" height="30" rx="6" fill="white" stroke="#15803D" strokeWidth="1.5" />
          <text x="170" y="184" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="600">72{'\u00b0'}</text>
          <text x="170" y="212" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="600">thermostat</text>

          {/* Outlet */}
          <rect x="210" y="255" width="22" height="30" rx="3" fill="white" stroke="#15803D" strokeWidth="1.5" />
          <text x="221" y="300" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="600">outlet</text>

          {/* Thermostat too high (violation) */}
          <rect x="210" y="62" width="24" height="24" rx="4" fill="white" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="210" y1="62" x2="234" y2="86" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="234" y1="62" x2="210" y2="86" stroke="#C2410C" strokeWidth="1.5" />

          {/* Floor */}
          <line x1="40" y1="340" x2="330" y2="340" stroke="#94A3B8" strokeWidth="2" />


          {/* DIVIDER */}
          <line x1="360" y1="20" x2="360" y2="360" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />


          {/* RIGHT: Operation rules */}
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">One hand, no twisting, light force</text>

          {/* Three rule boxes */}
          <rect x="400" y="70" width="280" height="72" rx="10" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="1.5" />
          <text x="420" y="98" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="#14532D">One-hand operation</text>
          <text x="420" y="116" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D">Must work with a single hand</text>
          <text x="666" y="108" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="22" fill="#15803D" opacity="0.3">{'\u270b'}</text>

          <rect x="400" y="156" width="280" height="72" rx="10" fill="#7C3AED" opacity="0.04" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="420" y="184" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="#5B21B6">No grasping, pinching, twisting</text>
          <text x="420" y="202" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6">Round doorknobs fail this test</text>
          <text x="666" y="194" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="22" fill="#7C3AED" opacity="0.3">{'\u21bb'}</text>

          <rect x="400" y="242" width="280" height="72" rx="10" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1.5" />
          <text x="420" y="270" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="#1E3A8A">{'\u2264'} 5 pounds of force</text>
          <text x="420" y="288" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">No stiff switches or heavy push mechanisms</text>
          <rect x="640" y="266" width="46" height="22" rx="6" fill="#2563EB" />
          <text x="663" y="281" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">5 lbs</text>

          <CalloutDots callouts={RULE_CALLOUTS} active={ruleActive} toggle={toggleRule} />
          <text x="20" y="368" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{ruleCallout ? `Showing: ${ruleCallout.label}` : ''}</div>
      <CalloutPanel callout={ruleCallout} onClose={() => setRuleActive(null)} panelRef={ruleRef} />

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Operable Parts</p>
        <KeyFact color="#C2410C" number={`${d('15', '380')}\u2013${d('48', '1220')}`}>Height range for all controls (same as reach ranges)</KeyFact>
        <KeyFact color="#15803D" number="1 hand">Must work with one hand {'\u2014'} no grasping, pinching, or twisting</KeyFact>
        <KeyFact color="#2563EB" number={'\u2264 5 lbs'}>Maximum force to operate any control</KeyFact>
      </div>


      {/* DIAGRAM 2: Pass vs. Fail */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Pass vs. Fail</h3>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 340" role="img" aria-labelledby="types-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="types-title">Compliant vs. Non-Compliant Control Types</title>
          <rect width="720" height="340" fill="var(--page-bg-subtle)" />

          {/* LEFT: PASS */}
          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="#15803D">These pass {'\u2714'}</text>

          {/* Lever handle */}
          <rect x="50" y="68" width="70" height="50" rx="8" fill="#15803D" opacity="0.06" stroke="#15803D" strokeWidth="1.5" />
          <line x1="65" y1="93" x2="105" y2="93" stroke="#15803D" strokeWidth="4" strokeLinecap="round" />
          <circle cx="65" cy="93" r="4" fill="#15803D" />
          <text x="85" y="135" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D" fontWeight="600">Lever handle</text>
          <text x="85" y="150" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D" textAnchor="middle">push down to open</text>

          {/* Rocker switch */}
          <rect x="155" y="68" width="40" height="60" rx="6" fill="#15803D" opacity="0.06" stroke="#15803D" strokeWidth="1.5" />
          <rect x="161" y="72" width="28" height="26" rx="3" fill="#15803D" opacity="0.15" />
          <text x="175" y="135" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D" fontWeight="600">Rocker switch</text>
          <text x="175" y="150" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D" textAnchor="middle">press up or down</text>

          {/* Push button */}
          <circle cx="260" cy="93" r="22" fill="#15803D" opacity="0.06" stroke="#15803D" strokeWidth="1.5" />
          <circle cx="260" cy="93" r="12" fill="#15803D" opacity="0.12" />
          <text x="260" y="135" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D" fontWeight="600">Push button</text>
          <text x="260" y="150" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D" textAnchor="middle">press with palm or fist</text>

          {/* Paddle faucet */}
          <rect x="60" y="185" width="60" height="40" rx="6" fill="#15803D" opacity="0.06" stroke="#15803D" strokeWidth="1.5" />
          <line x1="75" y1="205" x2="105" y2="205" stroke="#15803D" strokeWidth="3" strokeLinecap="round" />
          <line x1="90" y1="195" x2="90" y2="215" stroke="#15803D" strokeWidth="1.5" />
          <text x="90" y="243" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D" fontWeight="600">Paddle faucet</text>
          <text x="90" y="258" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D" textAnchor="middle">push with wrist</text>

          {/* Touch/sensor */}
          <rect x="160" y="185" width="55" height="40" rx="6" fill="#15803D" opacity="0.06" stroke="#15803D" strokeWidth="1.5" />
          <text x="188" y="210" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="14" fill="#15803D" opacity="0.4">{'\u2728'}</text>
          <text x="188" y="243" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D" fontWeight="600">Sensor</text>
          <text x="188" y="258" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D" textAnchor="middle">no touch needed</text>


          {/* DIVIDER */}
          <line x1="345" y1="20" x2="345" y2="320" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />


          {/* RIGHT: FAIL */}
          <text x="560" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="#C2410C">These fail {'\u2718'}</text>

          {/* Round doorknob */}
          <circle cx="420" cy="93" r="22" fill="#C2410C" opacity="0.06" stroke="#C2410C" strokeWidth="1.5" />
          <circle cx="420" cy="93" r="10" fill="none" stroke="#C2410C" strokeWidth="1.5" opacity="0.3" />
          <text x="420" y="130" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12" fontWeight="600">Round knob</text>
          <text x="420" y="144" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12" textAnchor="middle">wrist twist</text>

          {/* Twist faucet */}
          <rect x="505" y="72" width="50" height="42" rx="6" fill="#C2410C" opacity="0.06" stroke="#C2410C" strokeWidth="1.5" />
          <text x="530" y="98" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fill="#C2410C" opacity="0.4">{'\u21bb'}</text>
          <text x="530" y="130" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12" fontWeight="600">Twist faucet</text>
          <text x="530" y="144" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12" textAnchor="middle">grip + rotate</text>

          {/* Tight thumb-turn */}
          <rect x="620" y="72" width="40" height="42" rx="6" fill="#C2410C" opacity="0.06" stroke="#C2410C" strokeWidth="1.5" />
          <rect x="634" y="86" width="12" height="14" rx="2" fill="#C2410C" opacity="0.2" />
          <text x="640" y="130" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12" fontWeight="600">Thumb-turn</text>
          <text x="640" y="144" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12" textAnchor="middle">pinch + twist</text>

          {/* Tiny toggle */}
          <rect x="415" y="175" width="30" height="40" rx="4" fill="#C2410C" opacity="0.06" stroke="#C2410C" strokeWidth="1.5" />
          <rect x="423" y="180" width="14" height="6" rx="1" fill="#C2410C" opacity="0.2" />
          <text x="430" y="233" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12" fontWeight="600">Tiny toggle</text>
          <text x="430" y="247" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12" textAnchor="middle">fingertip pinch</text>

          {/* Stiff crank */}
          <rect x="515" y="175" width="50" height="40" rx="6" fill="#C2410C" opacity="0.06" stroke="#C2410C" strokeWidth="1.5" />
          <circle cx="540" cy="195" r="8" fill="none" stroke="#C2410C" strokeWidth="1.5" opacity="0.3" />
          <line x1="540" y1="187" x2="540" y2="195" stroke="#C2410C" strokeWidth="2" />
          <text x="540" y="233" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12" fontWeight="600">Stiff valve</text>
          <text x="540" y="247" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12" textAnchor="middle">{"> 5 lbs force"}</text>

          <CalloutDots callouts={TYPE_CALLOUTS} active={typeActive} toggle={toggleType} />
          <text x="20" y="328" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{typeCallout ? `Showing: ${typeCallout.label}` : ''}</div>
      <CalloutPanel callout={typeCallout} onClose={() => setTypeActive(null)} panelRef={typeRef} />

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Quick test {'\u2014'} Does this control pass?</p>
        <KeyFact color="#15803D" number="Pass">Can you use it with a closed fist? Lever, push, rocker, paddle {'\u2014'} all pass.</KeyFact>
        <KeyFact color="#C2410C" number="Fail">Do you need to grab, twist, or pinch? Round knobs, twist handles {'\u2014'} all fail.</KeyFact>
      </div>


      <style>{`
        @keyframes opFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .op-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        g[role="button"]:focus .oper-fr{stroke:var(--accent);stroke-width:2.5} @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
