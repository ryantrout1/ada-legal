import React, { useState, useRef, useEffect, useCallback } from 'react';

const DOOR_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#404-doors-doorways-and-gates';

const OPEN_CALLOUTS = [
  { id: 1, label: 'Clear Width & Maneuvering Space', section: '\u00a7404.2.3',
    color: 'var(--dx-orange)', textColor: 'var(--dx-orange)', x: 100, y: 52,
    plain: 'When a door is open 90\u00b0, there must be at least 32 inches of clear width. Maneuvering clearance on both sides of the door depends on approach direction and door type \u2014 for example, a wheelchair user pulling a door toward them needs 60 inches of depth on the pull side and 18 inches of space on the latch side.',
    legal: '\u201CDoor openings shall provide a clear width of 32 inches minimum.\u201D Maneuvering clearances per Table 404.2.4.1. Pull-side forward approach: 60 inches depth, 18 inches latch-side clearance.',
    citation: '\u00a7404.2.3, \u00a7404.2.4' },
  { id: 2, label: 'Opening Force & Closing Speed', section: '\u00a7404.2.9',
    color: 'var(--dx-green)', textColor: 'var(--dx-green)', x: 470, y: 52,
    plain: 'Interior doors require no more than 5 pounds of force to open. Fire doors may have higher requirements per local code but must still be as light as the fire code allows. Door closers must take at least 5 seconds to move from 90\u00b0 to 12\u00b0 from the latch \u2014 this gives a wheelchair user time to get through before the door swings shut.',
    legal: '\u201COpening force for interior doors shall be 5 pounds maximum.\u201D \u201CDoor closers and gate closers shall be adjusted so that from an open position of 90 degrees, the time required to move the door to a position of 12 degrees from the latch is 5 seconds minimum.\u201D',
    citation: '\u00a7404.2.9, \u00a7404.2.8' }
];

const HARD_CALLOUTS = [
  { id: 1, label: 'Hardware & Handles', section: '\u00a7404.2.7',
    color: 'var(--dx-violet)', textColor: 'var(--dx-violet)', x: 100, y: 52,
    plain: 'Door handles must be operable with one hand, without tight grasping, pinching, or twisting. Lever handles and push/pull bars pass. Round doorknobs fail. Hardware must be between 34 and 48 inches above the floor. Locks must also be operable with one hand.',
    legal: '\u201CHandles, pulls, latches, locks, and other operable parts on doors and gates shall comply with \u00a7309.4. Operable parts shall be 34 inches minimum and 48 inches maximum above the finish floor.\u201D',
    citation: '\u00a7404.2.7' },
  { id: 2, label: 'Threshold & Bottom Surface', section: '\u00a7404.2.5',
    color: 'var(--dx-blue)', textColor: 'var(--dx-blue)', x: 470, y: 52,
    plain: 'Door thresholds can be no more than \u00bd inch high (\u00be inch for sliding doors). They must be beveled if higher than \u00bc inch. The bottom 10 inches of the push side must have a smooth, kickplate-style surface \u2014 wheelchair footrests push against this area to open the door.',
    legal: '\u201CThresholds at doorways shall be \u00bd inch high maximum. Thresholds at existing or altered sliding doors shall be \u00be inch high maximum.\u201D \u201CSwinging door and gate surfaces within 10 inches of the finish floor shall have a smooth surface on the push side.\u201D',
    citation: '\u00a7404.2.5, \u00a7404.2.10' }
];

function makeLink(t) { return (<a href={DOOR_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }
function CalloutPanel({ callout, onClose, panelRef }) {
  if (!callout) return null;
  return (<div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'doorFade 0.25s ease-out' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: callout.color, color: 'var(--page-bg)', fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 700 }}>{callout.id}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{callout.label}</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--page-bg)', background: callout.color, padding: '2px 8px', borderRadius: '4px' }}>{callout.section}</span>
      </div>
      <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px' }}>Close {'\u2715'}</button>
    </div>
    <div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}>
      <div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{callout.plain}</p></div>
      <aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard {'\u2014'} {parseCite(callout.citation)}</p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(callout.legal)}</p>
      </div></aside>
    </div>
  </div>);
}
function KeyFact({ color, number, children }) { return (<div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '6px 0' }}><span style={{ background: color, color: 'var(--page-bg)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 700, minWidth: '60px', textAlign: 'center', padding: '3px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>{number}</span><span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>{children}</span></div>); }
function Dots({ callouts, active, toggle }) { return callouts.map(c => (<g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>{active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}<circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" /><text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="var(--font-body)" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text><circle cx={c.x} cy={c.y} r="22" fill="none" stroke="transparent" strokeWidth="2" className="door-fr"/></g>)); }

export default function DoorDiagram() {
  const [openActive, setOpenActive] = useState(null);
  const [hardActive, setHardActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const openRef = useRef(null); const hardRef = useRef(null);
  const toggleOpen = useCallback(id => { setOpenActive(p => p === id ? null : id); setHardActive(null); }, []);
  const toggleHard = useCallback(id => { setHardActive(p => p === id ? null : id); setOpenActive(null); }, []);
  useEffect(() => { if (openActive && openRef.current) openRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [openActive]);
  useEffect(() => { if (hardActive && hardRef.current) hardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [hardActive]);
  useEffect(() => { const h = e => { if (e.key === 'Escape') { setOpenActive(null); setHardActive(null); } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const d = (i, m) => metric ? `${m} mm` : `${i}\u2033`;
  const openC = OPEN_CALLOUTS.find(c => c.id === openActive);
  const hardC = HARD_CALLOUTS.find(c => c.id === hardActive);
  const unitToggle = (<div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>{['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}</div>);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      {/* DIAGRAM 1: Opening & Clearance */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Opening & Clearance</h3>
        {unitToggle}
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 380" role="img" aria-labelledby="door-open-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="door-open-title">Door Clear Width and Maneuvering Clearance</title>
          <rect width="720" height="380" fill="var(--page-bg-subtle)" />

          {/* LEFT: Clear width top-down */}
          <text x="170" y="30" textAnchor="middle" fontFamily="var(--font-body)" fontSize="12" fontWeight="700" fill="var(--body-secondary)">How wide it must open</text>

          {/* Wall with door opening (plan view) */}
          <rect x="50" y="140" width="100" height="12" rx="1" fill="var(--dx-line)" />
          <rect x="220" y="140" width="100" height="12" rx="1" fill="var(--dx-line)" />
          {/* Door leaf swung open 90° */}
          <rect x="148" y="80" width="6" height="60" rx="1" fill="var(--dx-label)" />
          <path d="M 154 140 A 70 70 0 0 1 220 140" fill="none" stroke="var(--dx-label)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
          <text x="190" y="116" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-label)">90{'\u00b0'}</text>

          {/* 32" clear width dimension */}
          <line x1="154" y1="160" x2="220" y2="160" stroke="var(--dx-orange)" strokeWidth="1.5" />
          <line x1="154" y1="154" x2="154" y2="166" stroke="var(--dx-orange)" strokeWidth="1.5" />
          <line x1="220" y1="154" x2="220" y2="166" stroke="var(--dx-orange)" strokeWidth="1.5" />
          <rect x="150" y="168" width="72" height="22" rx="6" fill="var(--dx-orange)" />
          <text x="186" y="183" textAnchor="middle" fontFamily="var(--font-body)" fontSize="11" fontWeight="700" fill="var(--page-bg)">{d('32', '815')} min</text>

          {/* Wheelchair approaching */}
          <g transform="translate(145,215) scale(0.7)" opacity="0.5">
            <rect x="0" y="0" width="50" height="40" rx="4" fill="none" stroke="var(--dx-line)" strokeWidth="2" />
            <circle cx="25" cy="20" r="8" fill="var(--dx-line)" stroke="var(--dx-line)" strokeWidth="1.5" />
            <circle cx="5" cy="48" r="13" fill="none" stroke="var(--dx-line)" strokeWidth="2" />
            <circle cx="45" cy="48" r="13" fill="none" stroke="var(--dx-line)" strokeWidth="2" />
          </g>
          <text x="170" y="296" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-label)">approaching</text>

          {/* DIVIDER */}
          <line x1="350" y1="20" x2="350" y2="360" stroke="var(--dx-line)" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* RIGHT: Force & Speed */}
          <text x="535" y="30" textAnchor="middle" fontFamily="var(--font-body)" fontSize="12" fontWeight="700" fill="var(--body-secondary)">How easy to open</text>

          <rect x="395" y="80" width="280" height="60" rx="10" fill="var(--dx-green)" opacity="0.04" stroke="var(--dx-green)" strokeWidth="1.5" />
          <text x="535" y="106" textAnchor="middle" fontFamily="var(--font-body)" fontSize="12" fontWeight="700" fill="var(--dx-green)">{'\u2264'} 5 lbs to push open</text>
          <text x="535" y="124" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-green)">interior doors (fire doors follow fire code)</text>

          <rect x="395" y="160" width="280" height="60" rx="10" fill="var(--dx-blue)" opacity="0.04" stroke="var(--dx-blue)" strokeWidth="1.5" />
          <text x="535" y="186" textAnchor="middle" fontFamily="var(--font-body)" fontSize="12" fontWeight="700" fill="var(--dx-blue)">5 seconds to close</text>
          <text x="535" y="204" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-blue)">from 90{'\u00b0'} to 12{'\u00b0'} from latch</text>

          <rect x="395" y="240" width="280" height="60" rx="10" fill="var(--dx-violet)" opacity="0.04" stroke="var(--dx-violet)" strokeWidth="1.5" />
          <text x="535" y="266" textAnchor="middle" fontFamily="var(--font-body)" fontSize="12" fontWeight="700" fill="var(--dx-violet)">{d('60', '1525')} depth on pull side</text>
          <text x="535" y="284" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-violet)">wheelchair needs room to pull door toward them</text>

          <Dots callouts={OPEN_CALLOUTS} active={openActive} toggle={toggleOpen} />
          <text x="20" y="368" fontFamily="var(--font-body)" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{openC ? `Showing: ${openC.label}` : ''}</div>
      <CalloutPanel callout={openC} onClose={() => setOpenActive(null)} panelRef={openRef} />
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Opening & Clearance</p>
        <KeyFact color="var(--dx-orange)" number={d('32', '815')}>Minimum clear width when door is open 90{'\u00b0'}</KeyFact>
        <KeyFact color="var(--dx-green)" number={'\u2264 5 lbs'}>Maximum force to open an interior door</KeyFact>
        <KeyFact color="var(--dx-blue)" number="5 sec">Minimum time for door closer to swing from 90{'\u00b0'} to 12{'\u00b0'}</KeyFact>
      </div>

      {/* DIAGRAM 2: Hardware & Thresholds */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Hardware & Thresholds</h3>
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 340" role="img" aria-labelledby="door-hard-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="door-hard-title">Door Hardware and Threshold Requirements</title>
          <rect width="720" height="340" fill="var(--page-bg-subtle)" />

          {/* LEFT: Hardware */}
          <text x="170" y="30" textAnchor="middle" fontFamily="var(--font-body)" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Handles that work for everyone</text>

          {/* Lever handle (pass) */}
          <rect x="60" y="80" width="80" height="55" rx="8" fill="var(--dx-green)" opacity="0.06" stroke="var(--dx-green)" strokeWidth="1.5" />
          <line x1="75" y1="108" x2="125" y2="108" stroke="var(--dx-green)" strokeWidth="4" strokeLinecap="round" />
          <circle cx="75" cy="108" r="4" fill="var(--dx-green)" />
          <text x="100" y="150" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-green)" fontWeight="600">Lever {'\u2714'}</text>

          {/* Push bar (pass) */}
          <rect x="170" y="80" width="80" height="55" rx="8" fill="var(--dx-green)" opacity="0.06" stroke="var(--dx-green)" strokeWidth="1.5" />
          <rect x="185" y="102" width="50" height="10" rx="3" fill="var(--dx-green)" opacity="0.3" />
          <text x="210" y="150" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-green)" fontWeight="600">Push bar {'\u2714'}</text>

          {/* Round knob (fail) */}
          <rect x="60" y="175" width="80" height="55" rx="8" fill="var(--dx-orange)" opacity="0.06" stroke="var(--dx-orange)" strokeWidth="1.5" />
          <circle cx="100" cy="203" r="14" fill="none" stroke="var(--dx-orange)" strokeWidth="1.5" opacity="0.4" />
          <text x="100" y="248" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-orange)" fontWeight="600">Round knob {'\u2718'}</text>

          {/* Height range */}
          <rect x="180" y="185" width="120" height="40" rx="8" fill="var(--dx-violet)" opacity="0.05" stroke="var(--dx-violet)" strokeWidth="1.5" />
          <text x="240" y="203" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-violet)" fontWeight="600">{d('34', '865')}{'\u2013'}{d('48', '1220')}</text>
          <text x="240" y="218" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-violet)">handle height</text>

          {/* DIVIDER */}
          <line x1="340" y1="20" x2="340" y2="320" stroke="var(--dx-line)" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* RIGHT: Threshold */}
          <text x="530" y="30" textAnchor="middle" fontFamily="var(--font-body)" fontSize="12" fontWeight="700" fill="var(--body-secondary)">The bump at the bottom</text>

          {/* Side view of threshold */}
          <line x1="380" y1="220" x2="690" y2="220" stroke="var(--dx-label)" strokeWidth="2" />

          {/* Threshold bump */}
          <rect x="510" y="206" width="50" height="14" rx="2" fill="var(--dx-blue)" opacity="0.15" stroke="var(--dx-blue)" strokeWidth="1.5" />
          <text x="535" y="200" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-blue)" fontWeight="600">threshold</text>

          {/* 1/2" dimension */}
          <line x1="575" y1="206" x2="575" y2="220" stroke="var(--dx-blue)" strokeWidth="1.2" />
          <rect x="580" y="205" width="70" height="20" rx="6" fill="var(--dx-blue)" />
          <text x="615" y="219" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fontWeight="700" fill="var(--page-bg)">{d('\u00bd', '13')} max</text>

          {/* Door surface note */}
          <rect x="390" y="80" width="280" height="50" rx="8" fill="var(--dx-amber)" opacity="0.04" stroke="var(--dx-amber)" strokeWidth="1.5" />
          <text x="530" y="100" textAnchor="middle" fontFamily="var(--font-body)" fontSize="11" fill="var(--dx-amber)" fontWeight="600">Bottom {d('10', '255')} must be smooth</text>
          <text x="530" y="118" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-amber)">on push side {'\u2014'} wheelchair footrests push here</text>

          {/* Arrow showing wheelchair approaches from left */}
          <line x1="400" y1="218" x2="500" y2="218" stroke="var(--dx-line)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.3" />
          <polygon points="500,218 492,214 492,222" fill="var(--dx-line)" opacity="0.3" />
          <text x="450" y="240" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-label)">wheelchair approaches</text>

          <Dots callouts={HARD_CALLOUTS} active={hardActive} toggle={toggleHard} />
          <text x="20" y="328" fontFamily="var(--font-body)" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{hardC ? `Showing: ${hardC.label}` : ''}</div>
      <CalloutPanel callout={hardC} onClose={() => setHardActive(null)} panelRef={hardRef} />
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Hardware & Thresholds</p>
        <KeyFact color="var(--dx-violet)" number={`${d('34', '865')}\u2013${d('48', '1220')}`}>Height range for door handles and locks</KeyFact>
        <KeyFact color="var(--dx-green)" number="Lever">Lever and push/pull handles pass; round knobs fail</KeyFact>
        <KeyFact color="var(--dx-blue)" number={`\u2264 ${d('\u00bd', '13')}`}>Maximum threshold height ({d('\u00be', '19')} for sliding doors)</KeyFact>
        <KeyFact color="var(--dx-amber)" number={d('10', '255')}>Bottom of push side must be smooth for wheelchair footrests</KeyFact>
      </div>

      <style>{`
        @keyframes doorFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        g[role="button"]:focus .door-fr { stroke: var(--accent); stroke-width: 2.5; } @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
