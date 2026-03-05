import React, { useState, useRef, useEffect, useCallback } from 'react';

const KNEE_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#306-knee-and-toe-clearance';

const CALLOUTS = [
  {
    id: 1, label: 'Knee Clearance', section: '\u00a7306.3',
    color: '#7C3AED', textColor: '#5B21B6', x: 260, y: 52,
    plain: 'At the front edge where the wheelchair approaches, knee clearance must be at least 27 inches above the floor. This height allows standard wheelchair armrests (typically 25\u201327 inches) to slide under. At 27 inches high, the space must be at least 8 inches deep from the front edge. At 9 inches above the floor (where it transitions to toe clearance), it must be at least 11 inches deep. The space tapers between these points, following the natural shape of seated legs.',
    legal: '\u201CKnee clearance shall be 27 inches (685 mm) high minimum, 30 inches (760 mm) wide minimum, and 8 inches (205 mm) deep minimum.\u201D At 9 inches above the floor: 11 inches deep minimum, 25 inches deep maximum.',
    citation: '\u00a7306.3'
  },
  {
    id: 2, label: 'Toe Clearance', section: '\u00a7306.2',
    color: '#15803D', textColor: '#14532D', x: 420, y: 52,
    plain: 'The toe clearance zone is from the floor up to 9 inches above the floor \u2014 where a wheelchair\u0027s footrests and the user\u0027s feet extend under an element. Toe clearance must extend at least 17 inches under the element and can go up to 25 inches maximum. Anything in this zone (pipes, supports, trash cans) reduces clearance and can block access. The full 9-inch height and 30-inch width must be maintained.',
    legal: '\u201CSpace under an element between the finish floor and 9 inches above the finish floor shall be considered toe clearance.\u201D Depth: 17 inches minimum, 25 inches maximum. Width: 30 inches minimum.',
    citation: '\u00a7306.2'
  },
  {
    id: 3, label: 'Overall Dimensions', section: '\u00a7306',
    color: '#C2410C', textColor: '#7C2D12', x: 580, y: 52,
    plain: 'The entire clearance envelope is 25 inches deep maximum and 30 inches wide minimum, measured from the front edge toward the wall. This applies to lavatories, desks, counters, dining surfaces, and check-writing areas. When insulation or pipe covers are added under lavatories, they must fit within this envelope without reducing the required clearance.',
    legal: '\u201CToe clearance shall be permitted to extend 25 inches maximum under an element.\u201D Both toe and knee clearance: 30 inches wide minimum. Clearance required at lavatories (\u00a7606), dining/work surfaces (\u00a7902), and service counters (\u00a7904).',
    citation: '\u00a7306'
  }
];

function makeLink(text) {
  return (<a href={KNEE_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${text} on ADA.gov`}>{text}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>);
}
function parseCitations(text) {
  return text.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p);
}

function CalloutPanel({ callout, onClose, panelRef }) {
  if (!callout) return null;
  return (
    <div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'kneeFade 0.25s ease-out' }}>
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

export default function KneeToeDiagram() {
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const panelRef = useRef(null);
  const toggle = useCallback((id) => setActive(prev => prev === id ? null : id), []);
  useEffect(() => { if (active && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [active]);
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') setActive(null); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const d = (inches, mm) => metric ? `${mm} mm` : `${inches}\u2033`;
  const ac = CALLOUTS.find(c => c.id === active);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>{'\u00a7'}306 Knee & Toe Clearance</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 450" role="img" aria-labelledby="knee-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="knee-title">Knee and Toe Clearance \u2014 Side Cross-Section</title>
          <rect width="720" height="450" fill="var(--page-bg-subtle)" />

          <text x="300" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">What fits under a counter or desk</text>

          {/* Wall */}
          <rect x="100" y="68" width="12" height="312" fill="#CBD5E1" rx="2" />
          <text x="96" y="62" textAnchor="end" fontFamily="Manrope, sans-serif" fontSize="10" fill="#94A3B8" fontWeight="600">wall</text>

          {/* Counter/desk surface */}
          <rect x="112" y="138" width="230" height="12" rx="3" fill="#94A3B8" stroke="#64748B" strokeWidth="1.5" />
          <text x="227" y="132" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B" fontWeight="600">counter / desk surface</text>

          {/* Floor */}
          <line x1="60" y1="380" x2="700" y2="380" stroke="#94A3B8" strokeWidth="2.5" />

          {/* Front edge line */}
          <line x1="342" y1="120" x2="342" y2="395" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <text x="346" y="118" fontFamily="Manrope, sans-serif" fontSize="10" fill="#94A3B8">front edge</text>

          {/* KNEE ZONE */}
          <path d="M 342 150 L 268 150 L 232 305 L 342 305 Z" fill="#7C3AED" opacity="0.06" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="310" y="230" fontFamily="Manrope, sans-serif" fontSize="11" fill="#7C3AED" fontWeight="600" opacity="0.6">knee</text>
          <text x="310" y="245" fontFamily="Manrope, sans-serif" fontSize="11" fill="#7C3AED" fontWeight="600" opacity="0.6">zone</text>

          {/* TOE ZONE */}
          <rect x="112" y="305" width="230" height="75" fill="#15803D" opacity="0.06" stroke="#15803D" strokeWidth="1.5" />
          <text x="227" y="348" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#15803D" fontWeight="600" opacity="0.6">toe zone</text>

          {/* Taper line */}
          <line x1="268" y1="150" x2="232" y2="305" stroke="#B45309" strokeWidth="2" strokeDasharray="5 3" />

          {/* === DIMENSIONS === */}

          {/* 27" height */}
          <line x1="78" y1="150" x2="78" y2="380" stroke="#7C3AED" strokeWidth="1.5" />
          <line x1="70" y1="150" x2="86" y2="150" stroke="#7C3AED" strokeWidth="1.5" />
          <line x1="70" y1="380" x2="86" y2="380" stroke="#7C3AED" strokeWidth="1.5" />
          <rect x="42" y="256" width="68" height="22" rx="6" fill="#7C3AED" />
          <text x="76" y="271" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill="white">{d('27', '685')}</text>
          <text x="76" y="295" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C3AED" fontWeight="600">min high</text>

          {/* 9" toe height */}
          <rect x="42" y="332" width="52" height="20" rx="6" fill="#15803D" />
          <text x="68" y="346" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('9', '230')}</text>

          {/* 8" deep at 27" */}
          <line x1="268" y1="156" x2="342" y2="156" stroke="#B45309" strokeWidth="1.2" />
          <line x1="268" y1="150" x2="268" y2="162" stroke="#B45309" strokeWidth="1.2" />
          <rect x="272" y="160" width="66" height="20" rx="6" fill="#B45309" />
          <text x="305" y="174" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('8', '205')} min</text>

          {/* 11" deep at 9" */}
          <line x1="232" y1="298" x2="342" y2="298" stroke="#B45309" strokeWidth="1.2" />
          <line x1="232" y1="292" x2="232" y2="304" stroke="#B45309" strokeWidth="1.2" />
          <rect x="250" y="278" width="66" height="20" rx="6" fill="#B45309" />
          <text x="283" y="292" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('11', '280')} min</text>

          {/* 25" max total depth */}
          <line x1="112" y1="396" x2="342" y2="396" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="112" y1="389" x2="112" y2="403" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="342" y1="389" x2="342" y2="403" stroke="#C2410C" strokeWidth="1.5" />
          <rect x="189" y="400" width="68" height="20" rx="6" fill="#C2410C" />
          <text x="223" y="414" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('25', '635')} max</text>

          {/* 17" min toe depth */}
          <line x1="185" y1="372" x2="342" y2="372" stroke="#2563EB" strokeWidth="1.2" />
          <line x1="185" y1="365" x2="185" y2="379" stroke="#2563EB" strokeWidth="1.2" />
          <rect x="222" y="356" width="66" height="20" rx="6" fill="#2563EB" />
          <text x="255" y="370" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('17', '430')} min</text>


          {/* WHEELCHAIR USER (right side) */}
          <g transform="translate(420,175) scale(1.4)">
            <circle cx="22" cy="10" r="9" fill="#E2E8F0" stroke="#475569" strokeWidth="1.8" />
            <line x1="25" y1="50" x2="22" y2="22" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="15" y1="55" x2="55" y2="55" stroke="#475569" strokeWidth="2" />
            <line x1="15" y1="55" x2="10" y2="73" stroke="#475569" strokeWidth="1.8" />
            <line x1="55" y1="55" x2="55" y2="75" stroke="#475569" strokeWidth="1.8" />
            <line x1="15" y1="55" x2="12" y2="28" stroke="#475569" strokeWidth="2" />
            <circle cx="20" cy="73" r="20" fill="none" stroke="#475569" strokeWidth="2.2" />
            <circle cx="58" cy="80" r="7" fill="none" stroke="#475569" strokeWidth="1.5" />
            <line x1="40" y1="80" x2="55" y2="80" stroke="#475569" strokeWidth="1.5" />
            {/* Arms forward toward counter */}
            <line x1="24" y1="30" x2="-15" y2="-5" stroke="#475569" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            {/* Thighs going under counter */}
            <line x1="25" y1="50" x2="-10" y2="20" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
            <line x1="-10" y1="20" x2="-20" y2="60" stroke="#475569" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
          </g>

          {/* Uses label */}
          <text x="580" y="172" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B" fontWeight="600">Required at:</text>
          <text x="580" y="190" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B">sinks, desks, counters,</text>
          <text x="580" y="206" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B">dining surfaces</text>

          {/* CALLOUT DOTS */}
          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && (<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>)}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
              <circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="knee-focus-ring" />
            </g>
          ))}
          <text x="20" y="438" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      <CalloutPanel callout={ac} onClose={() => setActive(null)} panelRef={panelRef} />

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Knee & Toe Clearance</p>
        <KeyFact color="#7C3AED" number={d('27', '685')}>Minimum height for knee clearance at the front edge</KeyFact>
        <KeyFact color="#15803D" number={d('9', '230')}>Minimum height for toe clearance (below 9{'\u2033'} is the toe zone)</KeyFact>
        <KeyFact color="#C2410C" number={d('25', '635')}>Maximum total depth under the element (wall to front edge)</KeyFact>
        <KeyFact color="#2563EB" number={d('17', '430')}>Minimum depth for toe clearance</KeyFact>
        <KeyFact color="#B45309" number={d('30', '760')}>Minimum width for both knee and toe clearance</KeyFact>
      </div>

      <style>{`
        @keyframes kneeFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .knee-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
