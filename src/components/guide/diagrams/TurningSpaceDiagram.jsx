import React, { useState, useRef, useEffect, useCallback } from 'react';

const TURN_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#304-turning-space';

const CALLOUTS = [
  {
    id: 1, label: 'Circular Turning Space', section: '\u00a7304.3.1',
    color: '#C2410C', textColor: '#7C2D12', x: 170, y: 52,
    plain: 'The most common option is a clear circular area with a 60-inch (5-foot) diameter. This allows a wheelchair user to make a full 360-degree turn. The entire circle must be free of obstructions \u2014 no columns, trash cans, or furniture legs. The floor must be level (max 1:48 slope) and the surface firm, stable, and slip-resistant.',
    legal: '\u201CThe floor or ground surface of a circular turning space shall be a circular space with a 60 inch (1525 mm) diameter minimum. The floor or ground surface shall comply with 302.\u201D',
    citation: '\u00a7304.3.1'
  },
  {
    id: 2, label: 'T-Shaped Turning Space', section: '\u00a7304.3.2',
    color: '#15803D', textColor: '#14532D', x: 540, y: 52,
    plain: 'The T-shaped turning space is an alternative for tighter layouts like corridors or alcoves. It fits within a 60-inch square. The person executes a three-point turn \u2014 rolling forward into one arm, backing into the stem, then rolling forward in the new direction. Each arm and the stem must be at least 36 inches wide and clear of obstructions.',
    legal: '\u201CThe floor or ground surface of a T-shaped turning space shall be a T-shaped space within a 60 inch (1525 mm) square minimum with arms and base 36 inches (915 mm) wide minimum.\u201D',
    citation: '\u00a7304.3.2'
  }
];

function makeLink(text) {
  return (<a href={TURN_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${text} on ADA.gov`}>{text}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>);
}
function parseCitations(text) {
  return text.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p);
}

function CalloutPanel({ callout, onClose, panelRef }) {
  if (!callout) return null;
  return (
    <div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'turnFade 0.25s ease-out' }}>
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

export default function TurningSpaceDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>{'\u00a7'}304 Turning Space</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 360" role="img" aria-labelledby="turn-title turn-desc" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="turn-title">Turning Space Options</title>
          <desc id="turn-desc">Two plan-view options: a 60-inch diameter circle on the left, and a T-shaped space within a 60-inch square on the right, with each arm 36 inches wide.</desc>
          <rect width="720" height="360" fill="var(--page-bg-subtle)" />

          {/* LEFT: CIRCULAR */}
          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Full circle</text>

          <circle cx="170" cy="185" r="110" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="2" />

          {/* Wheelchair silhouette */}
          <g transform="translate(145,155) scale(0.8)" opacity="0.3">
            <circle cx="22" cy="10" r="9" fill="#E2E8F0" stroke="#475569" strokeWidth="1.8" />
            <rect x="10" y="22" width="24" height="18" rx="4" fill="none" stroke="#475569" strokeWidth="1.5" />
            <circle cx="10" cy="52" r="12" fill="none" stroke="#475569" strokeWidth="1.5" />
            <circle cx="34" cy="52" r="12" fill="none" stroke="#475569" strokeWidth="1.5" />
          </g>

          {/* 360 rotation arrow */}
          <path d="M 220 110 A 60 60 0 1 1 120 110" fill="none" stroke="#C2410C" strokeWidth="1.2" opacity="0.35" />
          <polygon points="120,110 125,120 115,118" fill="#C2410C" opacity="0.45" />
          <text x="170" y="140" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="600" opacity="0.5">360{'\u00b0'} turn</text>

          {/* Diameter dimension */}
          <line x1="60" y1="185" x2="280" y2="185" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="60" y1="178" x2="60" y2="192" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="280" y1="178" x2="280" y2="192" stroke="#C2410C" strokeWidth="1.5" />
          <rect x="128" y="192" width="84" height="22" rx="6" fill="#C2410C" />
          <text x="170" y="207" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill="white">{d('60', '1525')} dia.</text>


          {/* DIVIDER */}
          <line x1="345" y1="20" x2="345" y2="340" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />


          {/* RIGHT: T-SHAPED */}
          <text x="530" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">T-shaped (3-point turn)</text>

          {/* 60" bounding square (dashed) */}
          <rect x="420" y="60" width="220" height="250" fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />

          {/* T-shape: top arm + vertical stem */}
          <rect x="420" y="60" width="220" height="80" rx="2" fill="#15803D" opacity="0.06" stroke="#15803D" strokeWidth="1.5" />
          <rect x="493" y="140" width="74" height="170" rx="2" fill="#15803D" opacity="0.06" stroke="#15803D" strokeWidth="1.5" />

          {/* Direction labels */}
          <text x="458" y="106" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D" fontWeight="600">{'\u2190'} turn left</text>
          <text x="604" y="106" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D" fontWeight="600">turn right {'\u2192'}</text>
          <text x="530" y="240" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D" fontWeight="600">enter / back up</text>

          {/* Wheelchair at T intersection */}
          <g transform="translate(510,120) scale(0.55)" opacity="0.25">
            <circle cx="22" cy="10" r="9" fill="#E2E8F0" stroke="#475569" strokeWidth="2" />
            <rect x="10" y="22" width="24" height="18" rx="4" fill="none" stroke="#475569" strokeWidth="2" />
            <circle cx="10" cy="52" r="12" fill="none" stroke="#475569" strokeWidth="2" />
            <circle cx="34" cy="52" r="12" fill="none" stroke="#475569" strokeWidth="2" />
          </g>

          {/* Arm width dimension (36") */}
          <line x1="420" y1="150" x2="493" y2="150" stroke="#15803D" strokeWidth="1.2" />
          <line x1="420" y1="144" x2="420" y2="156" stroke="#15803D" strokeWidth="1.2" />
          <line x1="493" y1="144" x2="493" y2="156" stroke="#15803D" strokeWidth="1.2" />
          <rect x="425" y="156" width="60" height="18" rx="5" fill="#15803D" />
          <text x="455" y="169" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fontWeight="700" fill="white">{d('36', '915')} min</text>

          {/* Stem width dimension (36") */}
          <line x1="493" y1="318" x2="567" y2="318" stroke="#15803D" strokeWidth="1.2" />
          <line x1="493" y1="312" x2="493" y2="324" stroke="#15803D" strokeWidth="1.2" />
          <line x1="567" y1="312" x2="567" y2="324" stroke="#15803D" strokeWidth="1.2" />
          <rect x="498" y="324" width="60" height="18" rx="5" fill="#15803D" />
          <text x="528" y="337" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fontWeight="700" fill="white">{d('36', '915')} min</text>

          {/* Overall 60" dimension */}
          <line x1="420" y1="48" x2="640" y2="48" stroke="#64748B" strokeWidth="1.2" />
          <line x1="420" y1="42" x2="420" y2="54" stroke="#64748B" strokeWidth="1.2" />
          <line x1="640" y1="42" x2="640" y2="54" stroke="#64748B" strokeWidth="1.2" />
          <rect x="497" y="36" width="66" height="18" rx="5" fill="#64748B" />
          <text x="530" y="49" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fontWeight="700" fill="white">{d('60', '1525')} sq.</text>


          {/* CALLOUT DOTS */}
          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && (<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>)}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
              <circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="turn-focus-ring" />
            </g>
          ))}
          <text x="20" y="348" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      <CalloutPanel callout={ac} onClose={() => setActive(null)} panelRef={panelRef} />

      {/* Key facts */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Turning Space</p>
        <KeyFact color="#C2410C" number={d('60', '1525')}>Minimum diameter for a circular turning space (5 feet across)</KeyFact>
        <KeyFact color="#15803D" number={d('36', '915')}>Minimum width of each arm and stem in a T-shaped turning space</KeyFact>
        <KeyFact color="#64748B" number="1:48">Maximum floor slope in any direction within the turning space</KeyFact>
      </div>

      <style>{`
        @keyframes turnFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .turn-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
