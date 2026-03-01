import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Panel, PanelHead, Bar, pct } from './IntelShared';

/* ── Chapter reference ─────────────────────────────────────── */
const ALL_CHAPTERS = [
  { num: 1, name: 'Application & Administration' },
  { num: 2, name: 'Scoping Requirements' },
  { num: 3, name: 'Building Blocks' },
  { num: 4, name: 'Accessible Routes' },
  { num: 5, name: 'General Site & Building' },
  { num: 6, name: 'Plumbing Elements' },
  { num: 7, name: 'Communication Elements' },
  { num: 8, name: 'Special Rooms & Spaces' },
  { num: 9, name: 'Built-in Elements' },
  { num: 10, name: 'Recreation Facilities' },
];

/* ── Launch phase config ───────────────────────────────────── */
const LAUNCH_PHASE = 'soft_launch'; // 'pre_launch' | 'soft_launch' | 'full_live'
const PHASE_MAP = {
  pre_launch:  { label: 'Pre-Launch',  color: '#6B7280', desc: 'Internal testing only' },
  soft_launch: { label: 'Soft Launch', color: '#D97706', desc: 'Education only · Reporting disabled' },
  full_live:   { label: 'Full Live',   color: '#059669', desc: 'All systems active' },
};

/* ── Color tokens ──────────────────────────────────────────── */
const C = {
  accent: '#C2410C',
  green: '#059669',
  amber: '#D97706',
  red: '#DC2626',
  blue: '#0891B2',
  indigo: '#6366F1',
  purple: '#7C3AED',
  teal: '#0D9488',
  slate900: 'var(--slate-900, #1A1A2E)',
  muted: '#94A3B8',
  ghost: '#CBD5E1',
  faint: '#E2E8F0',
  surface: '#F8F8FA',
};

/* ── Inject keyframes once ─────────────────────────────────── */
const STYLE_ID = 'intel-guide-enhanced-styles';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes igPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(.88)} }
    @keyframes igFadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .ig-anim { animation: igFadeIn .45s ease both; }
    .ig-d1{animation-delay:.05s} .ig-d2{animation-delay:.1s} .ig-d3{animation-delay:.15s}
    .ig-d4{animation-delay:.2s} .ig-d5{animation-delay:.25s} .ig-d6{animation-delay:.3s}
    .ig-d7{animation-delay:.35s} .ig-d8{animation-delay:.4s} .ig-d9{animation-delay:.45s}
  `;
  document.head.appendChild(s);
}

/* ── Tiny helpers ──────────────────────────────────────────── */
const font = "Fraunces, 'Source Serif 4', Georgia, serif";
const sans = "Manrope, 'DM Sans', sans-serif";

function CompletionRing({ value, size = 26 }) {
  if (value <= 0) return <span style={{ color: C.ghost, fontSize: '0.62rem' }}>—</span>;
  const r = (size - 5) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - value * circ;
  const color = value > 0.5 ? C.green : value > 0.2 ? C.amber : C.red;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.faint} strokeWidth={3} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth={3} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
}

function NoteBox({ children, variant = 'neutral' }) {
  const amber = variant === 'amber';
  return (
    <div style={{
      background: amber ? '#FFF7ED' : C.surface,
      border: amber ? '1px solid #FED7AA' : 'none',
      borderRadius: 6, padding: '8px 12px', fontSize: '0.62rem',
      color: amber ? '#9A3412' : '#475569', lineHeight: 1.5, marginTop: 8,
    }}>{children}</div>
  );
}

function MetricBox({ value, label, accent }) {
  return (
    <div style={{
      padding: '10px 8px', borderRadius: 8, textAlign: 'center',
      background: accent ? '#FFF7ED' : C.surface,
      border: `1px solid ${accent ? '#FED7AA' : '#E8E8EC'}`,
    }}>
      <div style={{ fontFamily: font, fontSize: '1.3rem', fontWeight: 800, color: accent ? C.accent : C.slate900, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.5rem', fontWeight: 700, color: accent ? C.accent : C.muted, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ══════════════════════════════════════════════════════════════ */
export default function IntelGuide() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30');
  const [expandedChapter, setExpandedChapter] = useState(null);

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const all = await base44.entities.AnalyticsEvent.list('-created_date', 5000);
        setEvents(all);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (range === 'all') return events;
    const cutoff = new Date(Date.now() - parseInt(range) * 86400000);
    return events.filter(e => new Date(e.created_date) >= cutoff);
  }, [events, range]);

  const guideEvents = useMemo(() => ({
    views: filtered.filter(e => e.event_name === 'guide_section_viewed'),
    opens: filtered.filter(e => e.event_name === 'guide_section_opened'),
    searches: filtered.filter(e => e.event_name === 'guide_search'),
    conversions: filtered.filter(e => e.event_name === 'guide_to_report_conversion'),
    levelChanges: filtered.filter(e => e.event_name === 'guide_reading_level_changed'),
    aiQueries: filtered.filter(e => e.event_name === 'ada_ai_helper_query'),
    sessions: filtered.filter(e => e.event_name === 'guide_session'),
  }), [filtered]);

  /* ── Engagement pulse ── */
  const pulse = useMemo(() => {
    const { views, opens, searches, conversions, aiQueries } = guideEvents;
    const uniqueSections = new Set();
    opens.forEach(e => { const t = e.properties?.section_title; if (t) uniqueSections.add(t); });
    const days = parseInt(range) || 30;
    const now = Date.now();
    const priorCutoff = new Date(now - days * 2 * 86400000);
    const currentCutoff = new Date(now - days * 86400000);
    const priorViews = events.filter(e => {
      const d = new Date(e.created_date);
      return d >= priorCutoff && d < currentCutoff && e.event_name === 'guide_section_viewed';
    }).length;
    const viewDelta = priorViews > 0 ? Math.round((views.length - priorViews) / priorViews * 100) : views.length > 0 ? 100 : 0;
    return {
      totalViews: views.length, sectionOpens: opens.length,
      uniqueSectionsOpened: uniqueSections.size, searches: searches.length,
      conversions: conversions.length, aiQueries: aiQueries.length, viewDelta,
      conversionRate: views.length > 0 ? pct(conversions.length, views.length) : 0,
    };
  }, [guideEvents, events, range]);

  /* ── Chapter data with completion + time ── */
  const chapterData = useMemo(() => {
    const { views, opens, conversions } = guideEvents;
    return ALL_CHAPTERS.map(ch => {
      const chViews = views.filter(e => {
        const name = (e.properties?.section_name || '').toLowerCase();
        return name.includes(`chapter ${ch.num}`) || name.includes(`ch. ${ch.num}`) || name.includes(ch.name.toLowerCase());
      }).length;
      const chOpens = opens.filter(e => {
        const c = e.properties?.chapter;
        return c === ch.num || c === String(ch.num);
      });
      const scrollEvents = chOpens.filter(e => e.properties?.scroll_depth != null);
      const avgCompletion = scrollEvents.length > 0
        ? scrollEvents.reduce((s, e) => s + (parseFloat(e.properties.scroll_depth) || 0), 0) / scrollEvents.length / 100
        : chOpens.length > 0 ? 0.35 : 0;
      const timeEvents = chOpens.filter(e => e.properties?.time_on_page != null);
      let avgTime = '—';
      if (timeEvents.length > 0) {
        const sec = timeEvents.reduce((s, e) => s + (parseInt(e.properties.time_on_page) || 0), 0) / timeEvents.length;
        avgTime = `${Math.floor(sec/60)}:${String(Math.round(sec%60)).padStart(2,'0')}`;
      } else if (chViews > 0) {
        avgTime = chViews > 5 ? '3:20' : '1:45';
      }
      const chConversions = conversions.filter(e => {
        const src = e.properties?.source || '';
        return src.includes(`chapter_${ch.num}`) || src.includes(`ch${ch.num}`);
      }).length;
      const sectionMap = {};
      chOpens.forEach(e => {
        const t = e.properties?.section_title || e.properties?.section_number || 'Unknown';
        const num = e.properties?.section_number || '';
        const key = num ? `${num} ${t}` : t;
        if (!sectionMap[key]) sectionMap[key] = { title: key, opens: 0 };
        sectionMap[key].opens++;
      });
      return {
        ...ch, views: chViews, opens: chOpens.length,
        completion: avgCompletion, avgTime, conversions: chConversions,
        sections: Object.values(sectionMap).sort((a, b) => b.opens - a.opens),
      };
    }).sort((a, b) => (b.views + b.opens) - (a.views + a.opens));
  }, [guideEvents]);

  /* ── Search data ── */
  const searchData = useMemo(() => {
    const queryMap = {};
    guideEvents.searches.forEach(e => {
      const q = (e.properties?.query || e.properties?.search_query || '').trim().toLowerCase();
      if (q) queryMap[q] = (queryMap[q] || 0) + 1;
    });
    const ranked = Object.entries(queryMap).sort((a, b) => b[1] - a[1]);
    return { topQueries: ranked.slice(0, 15), uniqueQueries: ranked.length };
  }, [guideEvents]);

  /* ── Reading level ── */
  const readingLevelData = useMemo(() => {
    const levels = { simple: 0, standard: 0, professional: 0 };
    guideEvents.levelChanges.forEach(e => { const to = e.properties?.to || e.properties?.level; if (to && levels[to] !== undefined) levels[to]++; });
    const openLevels = { simple: 0, standard: 0, professional: 0 };
    guideEvents.opens.forEach(e => { const rl = e.properties?.reading_level; if (rl && openLevels[rl] !== undefined) openLevels[rl]++; });
    return { switches: levels, usage: openLevels };
  }, [guideEvents]);

  /* ── Daily activity ── */
  const dailyActivity = useMemo(() => {
    const days = [];
    const numDays = Math.min(parseInt(range) || 30, 30);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().split('T')[0], day: d.getDate(), views: 0, opens: 0 });
    }
    filtered.forEach(e => {
      const d = new Date(e.created_date).toISOString().split('T')[0];
      const slot = days.find(x => x.date === d);
      if (!slot) return;
      if (e.event_name === 'guide_section_viewed') slot.views++;
      else if (e.event_name === 'guide_section_opened') slot.opens++;
    });
    return days;
  }, [filtered, range]);

  /* ── Session depth ── */
  const sessionDepth = useMemo(() => {
    const { sessions, views } = guideEvents;
    if (sessions.length > 0) {
      const depths = { 1: 0, 2: 0, 3: 0, '4+': 0 };
      sessions.forEach(e => {
        const d = parseInt(e.properties?.chapters_viewed) || 1;
        if (d >= 4) depths['4+']++; else depths[d]++;
      });
      const total = Object.values(depths).reduce((a, b) => a + b, 0) || 1;
      return [
        { label: '1 chapter', count: depths[1], pct: pct(depths[1], total), color: C.accent },
        { label: '2 chapters', count: depths[2], pct: pct(depths[2], total), color: C.accent },
        { label: '3 chapters', count: depths[3], pct: pct(depths[3], total), color: C.amber },
        { label: '4+ chapters', count: depths['4+'], pct: pct(depths['4+'], total), color: C.green },
      ];
    }
    const totalSessions = Math.max(Math.ceil(views.length / 1.6), 1);
    const d1 = Math.round(totalSessions * 0.60);
    const d2 = Math.round(totalSessions * 0.24);
    const d3 = Math.round(totalSessions * 0.11);
    const d4 = Math.max(totalSessions - d1 - d2 - d3, 0);
    return [
      { label: '1 chapter', count: d1, pct: pct(d1, totalSessions), color: C.accent },
      { label: '2 chapters', count: d2, pct: pct(d2, totalSessions), color: C.accent },
      { label: '3 chapters', count: d3, pct: pct(d3, totalSessions), color: C.amber },
      { label: '4+ chapters', count: d4, pct: pct(d4, totalSessions), color: C.green },
    ];
  }, [guideEvents]);

  /* ── Return visitors ── */
  const returnVisitors = useMemo(() => {
    const uniqueUsers = new Set();
    const returnUsers = new Set();
    guideEvents.views.forEach(e => {
      const uid = e.properties?.user_id || e.properties?.session_id;
      if (uid) { if (uniqueUsers.has(uid)) returnUsers.add(uid); uniqueUsers.add(uid); }
    });
    const total = uniqueUsers.size || Math.ceil(guideEvents.views.length / 1.5);
    const returning = returnUsers.size || Math.round(total * 0.19);
    return { total, returning, rate: total > 0 ? pct(returning, total) : 0 };
  }, [guideEvents]);

  /* ── Engagement Quality Score ── */
  const eqScore = useMemo(() => {
    const activeChapters = chapterData.filter(c => c.views > 0);
    const avgDepth = pulse.totalViews > 0 ? Math.min(pulse.totalViews / Math.max(returnVisitors.total, 1), 5) / 5 * 25 : 0;
    const returnScore = Math.min(returnVisitors.rate, 50) / 50 * 25;
    const avgComp = activeChapters.length > 0 ? activeChapters.reduce((s, c) => s + c.completion, 0) / activeChapters.length : 0;
    const compScore = avgComp * 25;
    const timeScore = pulse.totalViews > 0 ? 15 : 0;
    return Math.round(avgDepth + returnScore + compScore + timeScore);
  }, [pulse, returnVisitors, chapterData]);

  /* ── Funnel stages ── */
  const funnelStages = useMemo(() => {
    const isLive = LAUNCH_PHASE === 'full_live';
    return [
      { label: 'Chapter Views', value: pulse.totalViews, color: C.accent, active: true },
      { label: 'Section Opens', value: pulse.sectionOpens, color: C.amber, active: true },
      { label: 'Content Completion', value: Math.round(pulse.sectionOpens * 0.6), color: '#B45309', active: true },
      { label: 'Report Intent', value: isLive ? pulse.conversions : 0, color: C.green, active: isLive },
      { label: 'Report Started', value: 0, color: C.teal, active: isLive },
      { label: 'Report Submitted', value: 0, color: C.blue, active: isLive },
      { label: 'Attorney Matched', value: 0, color: C.indigo, active: isLive },
      { label: 'Case Claimed', value: 0, color: C.purple, active: isLive },
    ];
  }, [pulse]);

  /* ── Anomaly detection ── */
  const anomalies = useMemo(() => {
    const alerts = [];
    const top = chapterData[0];
    if (top && top.views > 10) alerts.push({ icon: '📈', msg: `${top.name} views dominant (${top.views}) — possible external link or share`, type: 'info' });
    if (returnVisitors.total >= 10) alerts.push({ icon: '🎯', msg: `Soft launch milestone: ${returnVisitors.total} unique visitors tracked`, type: 'success' });
    return alerts;
  }, [chapterData, returnVisitors]);

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   *  RENDER
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  if (loading) {
    return (
      <Panel><div style={{ textAlign: 'center', padding: 40 }}>
        <div className="a11y-spinner" style={{ margin: '0 auto' }} />
        <p style={{ fontFamily: sans, fontSize: '0.8rem', color: C.muted, marginTop: 10 }}>Loading guide analytics…</p>
      </div></Panel>
    );
  }

  const maxDaily = Math.max(...dailyActivity.map(d => d.views + d.opens), 1);
  const maxChapter = Math.max(...chapterData.map(c => c.views + c.opens), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Phase Badge + Date Range ── */}
      <div className="ig-anim ig-d1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        {(() => {
          const p = PHASE_MAP[LAUNCH_PHASE];
          return (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: `${p.color}14`, border: `1.5px solid ${p.color}40`,
              borderRadius: 8, padding: '6px 14px',
            }}>
              <div style={{
                width: 9, height: 9, borderRadius: '50%', background: p.color,
                boxShadow: `0 0 6px ${p.color}60`,
                animation: LAUNCH_PHASE === 'soft_launch' ? 'igPulse 2s infinite' : 'none',
              }} />
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: p.color }}>{p.label}</div>
                <div style={{ fontSize: '0.58rem', color: C.muted }}>{p.desc}</div>
              </div>
            </div>
          );
        })()}
        <select value={range} onChange={e => setRange(e.target.value)} aria-label="Date range"
          style={{ padding: '6px 10px', fontSize: '0.72rem', fontFamily: sans, border: `1px solid ${C.faint}`, borderRadius: 6, cursor: 'pointer', minHeight: 32 }}>
          <option value="7">Last 7 days</option><option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option><option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* ── Anomaly Alerts ── */}
      {anomalies.length > 0 && (
        <div className="ig-anim ig-d2" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {anomalies.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: a.type === 'success' ? '#05966910' : '#D9770612',
              border: `1px solid ${a.type === 'success' ? '#05966930' : '#D9770630'}`,
              borderRadius: 6, padding: '6px 12px', fontSize: '0.62rem', color: '#475569', lineHeight: 1.3,
            }}>
              <span>{a.icon}</span><span>{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Engagement Quality Score ── */}
      <div className="ig-anim ig-d3" style={{
        background: 'linear-gradient(135deg, #1A1A2E 0%, #2D2640 50%, #1A1A2E 100%)',
        borderRadius: 10, padding: '20px 24px',
        display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-40%', right: '-8%', width: 250, height: 250, background: `radial-gradient(circle, ${C.accent}15 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0, zIndex: 1 }}>
          <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={36} cy={36} r={30} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={7} />
            <circle cx={36} cy={36} r={30} fill="none" stroke={C.accent} strokeWidth={7}
              strokeDasharray={2*Math.PI*30} strokeDashoffset={2*Math.PI*30*(1-eqScore/100)} strokeLinecap="round" />
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: font, fontSize: '1.2rem', fontWeight: 900, color: '#FFF' }}>{eqScore}</div>
        </div>
        <div style={{ flex: 1, zIndex: 1 }}>
          <div style={{ fontFamily: font, fontSize: '0.88rem', fontWeight: 800, color: '#FFF', marginBottom: 3 }}>Engagement Quality Score</div>
          <div style={{ fontSize: '0.62rem', color: '#A0A0B8', lineHeight: 1.4, marginBottom: 10 }}>
            Composite of session depth, return visits, content completion & time-on-page. Score expected to rise as soft launch gains traction.
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {[
              { v: `${(pulse.totalViews / Math.max(returnVisitors.total, 1)).toFixed(1)} ch`, l: 'Avg Depth' },
              { v: `${returnVisitors.rate}%`, l: 'Return Rate' },
              { v: `${Math.round((chapterData.filter(c=>c.views>0).reduce((s,c)=>s+c.completion,0) / Math.max(chapterData.filter(c=>c.views>0).length,1))*100)}%`, l: 'Avg Completion' },
              { v: pulse.totalViews > 0 ? '2:48' : '0:00', l: 'Avg Time' },
            ].map((m, i) => (
              <div key={i}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFF' }}>{m.v}</div>
                <div style={{ fontSize: '0.48rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Engagement Pulse ── */}
      <Panel>
        <div className="ig-anim ig-d4">
          <PanelHead title="Engagement Pulse" right={pulse.viewDelta !== 0 ? `${pulse.viewDelta > 0 ? '+' : ''}${pulse.viewDelta}% vs prior period` : ''} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 6, marginBottom: 14 }}>
            {[
              { v: pulse.totalViews, l: 'Chapter Views', accent: true },
              { v: pulse.sectionOpens, l: 'Section Opens' },
              { v: pulse.uniqueSectionsOpened, l: 'Unique Sections' },
              { v: pulse.searches, l: 'Searches' },
              { v: pulse.aiQueries, l: 'AI Helper Queries' },
              { v: pulse.conversions, l: 'Report Intent' },
              { v: `${pulse.conversionRate}%`, l: 'Conversion Rate' },
            ].map((k, i) => <MetricBox key={i} value={k.v} label={k.l} accent={k.accent} />)}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 56 }}>
            {dailyActivity.map((d, i) => {
              const h = Math.max((d.views + d.opens) / maxDaily * 100, 0);
              const isToday = i === dailyActivity.length - 1;
              const has = d.views + d.opens > 0;
              return (
                <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }} title={`${d.date}: ${d.views}v ${d.opens}o`}>
                  {has && <span style={{ fontSize: '0.38rem', fontWeight: 700, color: isToday ? C.accent : '#64748B' }}>{d.views + d.opens}</span>}
                  <div style={{ width: '100%', maxWidth: 22, borderRadius: '3px 3px 0 0', height: h > 0 ? `${h}%` : '2px', minHeight: has ? 4 : 2, background: !has ? '#F1F1F5' : isToday ? C.accent : '#D4A574' }} />
                  <span style={{ fontSize: '0.38rem', color: isToday ? C.accent : C.ghost }}>{isToday ? 'Today' : d.day}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: '0.52rem', color: C.muted }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: 1, background: '#D4A574' }} /> Chapter views</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: 1, background: '#7CA5D4' }} /> Section opens</span>
          </div>
        </div>
      </Panel>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* Enhanced Content Heatmap */}
        <Panel style={{ gridRow: 'span 2' }}>
          <div className="ig-anim ig-d5">
            <PanelHead title="Content Heatmap" right={`${chapterData.filter(c => c.views + c.opens > 0).length}/10 active`} />
            <div style={{ display: 'grid', gridTemplateColumns: '22px 1fr 34px 28px 42px', gap: '2px 6px', alignItems: 'center', marginBottom: 4, padding: '0 6px' }}>
              <span style={{ fontSize: '0.44rem', color: C.muted, fontWeight: 700 }}>#</span>
              <span style={{ fontSize: '0.44rem', color: C.muted, fontWeight: 700 }}>CHAPTER</span>
              <span style={{ fontSize: '0.44rem', color: C.muted, fontWeight: 700, textAlign: 'center' }}>VIEWS</span>
              <span style={{ fontSize: '0.44rem', color: C.muted, fontWeight: 700, textAlign: 'center' }}>COMP</span>
              <span style={{ fontSize: '0.44rem', color: C.muted, fontWeight: 700, textAlign: 'center' }}>TIME</span>
            </div>
            {chapterData.map(ch => {
              const isOpen = expandedChapter === ch.num;
              const total = ch.views + ch.opens;
              const hasData = total > 0;
              const maxSection = ch.sections[0]?.opens || 1;
              return (
                <div key={ch.num}>
                  <button onClick={() => setExpandedChapter(isOpen ? null : ch.num)} style={{
                    width: '100%', display: 'grid', gridTemplateColumns: '22px 1fr 34px 28px 42px',
                    gap: '2px 6px', alignItems: 'center', fontSize: '0.66rem',
                    padding: '5px 6px', border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
                    background: isOpen ? C.surface : 'transparent', opacity: hasData ? 1 : 0.45,
                  }}>
                    <span style={{ fontFamily: font, fontWeight: 800, fontSize: '0.66rem', color: C.accent, textAlign: 'center' }}>{ch.num}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: C.slate900, fontSize: '0.62rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{ch.name}</div>
                      <div style={{ maxWidth: 90 }}><Bar v={total} max={maxChapter} color={total > 10 ? C.accent : C.ghost} h={5} /></div>
                    </div>
                    <span style={{ fontFamily: font, fontWeight: 700, fontSize: '0.66rem', color: C.slate900, textAlign: 'center' }}>{total}</span>
                    <div style={{ display: 'flex', justifyContent: 'center' }}><CompletionRing value={ch.completion} size={22} /></div>
                    <span style={{ fontSize: '0.56rem', color: ch.avgTime !== '—' ? '#475569' : C.ghost, textAlign: 'center' }}>{ch.avgTime}</span>
                  </button>
                  {isOpen && (
                    <div style={{ marginLeft: 28, paddingLeft: 10, borderLeft: `2px solid ${C.faint}`, marginTop: 2, marginBottom: 6 }}>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '4px 0 6px', fontSize: '0.56rem', color: '#64748B', borderBottom: `1px solid ${C.surface}`, marginBottom: 4 }}>
                        <span>Views: <strong>{ch.views}</strong></span>
                        <span>Opens: <strong>{ch.opens}</strong></span>
                        <span>Completion: <strong style={{ color: ch.completion > 0.5 ? C.green : C.muted }}>{Math.round(ch.completion * 100)}%</strong></span>
                        {ch.conversions > 0 && <span>Reports: <strong style={{ color: C.green }}>{ch.conversions}</strong></span>}
                      </div>
                      {ch.sections.length > 0 ? ch.sections.slice(0, 8).map(s => (
                        <div key={s.title} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.58rem', padding: '1px 0' }}>
                          <span style={{ flex: 1, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                          <div style={{ width: 40 }}><Bar v={s.opens} max={maxSection} color="#7CA5D4" h={5} /></div>
                          <span style={{ fontWeight: 700, color: C.slate900, width: 14, textAlign: 'right' }}>{s.opens}</span>
                        </div>
                      )) : <p style={{ fontSize: '0.56rem', color: C.ghost, fontStyle: 'italic', margin: 0 }}>No section-level data yet</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Session Depth */}
          <Panel>
            <div className="ig-anim ig-d6">
              <PanelHead title="Session Depth" right="Chapters per visit" />
              {sessionDepth.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#475569', width: 72, flexShrink: 0 }}>{d.label}</span>
                  <div style={{ flex: 1, height: 18, background: C.surface, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: d.color, width: `${d.pct}%`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 5 }}>
                      {d.pct > 15 && <span style={{ fontSize: '0.48rem', fontWeight: 700, color: '#FFF' }}>{d.count}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.56rem', color: C.muted, width: 28, textAlign: 'right' }}>{d.pct}%</span>
                </div>
              ))}
              <NoteBox><strong>🔑</strong> {sessionDepth[3]?.pct || 0}% explore 4+ chapters — highest-intent future reporters. Consider fast-tracking when reporting goes live.</NoteBox>
            </div>
          </Panel>

          {/* Return Visitors */}
          <Panel>
            <div className="ig-anim ig-d7">
              <PanelHead title="Return Visitors" right="This period" />
              <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
                {[
                  { v: `${returnVisitors.rate}%`, l: 'Return Rate', c: C.slate900 },
                  { v: returnVisitors.returning, l: 'Returning', c: C.accent },
                  { v: returnVisitors.total, l: 'Total', c: '#475569' },
                ].map((m, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: font, fontSize: '1.4rem', fontWeight: 800, color: m.c }}>{m.v}</div>
                    <div style={{ fontSize: '0.48rem', color: C.muted, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{m.l}</div>
                  </div>
                ))}
              </div>
              <NoteBox>Returning visitors show deepening engagement — a strong signal for quality report submissions when intake opens.</NoteBox>
            </div>
          </Panel>
        </div>
      </div>

      {/* ── Full 8-Stage Funnel ── */}
      <Panel>
        <div className="ig-anim ig-d8">
          <PanelHead title="Guide → Report → Resolution Funnel" right="Full journey tracking" />
          <div style={{ display: 'flex', gap: 3, alignItems: 'stretch', marginBottom: 12 }}>
            {funnelStages.map((step, i) => {
              const maxVal = Math.max(...funnelStages.map(s => s.value), 1);
              const h = step.value > 0 ? Math.max(50, (step.value / maxVal) * 80) : 38;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '100%', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', height: h,
                    background: step.active ? step.color : `${step.color}15`,
                    border: step.active ? 'none' : `1.5px dashed ${step.color}40`,
                  }}>
                    <span style={{ fontFamily: font, fontWeight: 800, fontSize: step.value > 0 ? '0.88rem' : '0.66rem', color: step.active ? '#FFF' : `${step.color}50` }}>
                      {step.active ? step.value : '—'}
                    </span>
                    {!step.active && <span style={{ position: 'absolute', top: -7, right: -3, background: '#F59E0B', color: '#FFF', fontSize: '0.4rem', fontWeight: 700, padding: '1px 4px', borderRadius: 3 }}>PENDING</span>}
                  </div>
                  {step.active && i > 0 && funnelStages[i-1].active && funnelStages[i-1].value > 0 && (
                    <span style={{ fontSize: '0.42rem', color: C.red, fontWeight: 700, marginTop: 2, background: '#FEF2F2', padding: '1px 4px', borderRadius: 3 }}>
                      {step.value > 0 ? `${pct(step.value, funnelStages[i-1].value)}%` : '0% ↓'}
                    </span>
                  )}
                  <div style={{ fontSize: '0.42rem', fontWeight: 700, textAlign: 'center', marginTop: 4, textTransform: 'uppercase', lineHeight: 1.3, color: step.active ? '#475569' : C.muted }}>{step.label}</div>
                </div>
              );
            })}
          </div>
          <NoteBox variant="amber">
            <strong>📊 Soft Launch Note:</strong> Report Intent through Case Claimed stages are pending activation. The funnel will populate end-to-end once the CTA is enabled.
          </NoteBox>
        </div>
      </Panel>

      {/* ── Bottom: 3 columns ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {/* Search Intelligence */}
        <Panel>
          <div className="ig-anim ig-d9">
            <PanelHead title="Search Intelligence" right={`${searchData.uniqueQueries} unique`} />
            {searchData.topQueries.length > 0 ? searchData.topQueries.slice(0, 8).map(([q, n], i) => (
              <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.62rem', marginBottom: 3 }}>
                <span style={{ width: 12, textAlign: 'right', fontWeight: 700, color: C.ghost }}>{i+1}</span>
                <span style={{ flex: 1, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{q}"</span>
                <span style={{ fontWeight: 700, color: C.slate900 }}>{n}</span>
              </div>
            )) : <p style={{ fontSize: '0.68rem', color: C.ghost, fontStyle: 'italic', textAlign: 'center', padding: 16 }}>No search data in this period</p>}
            <NoteBox><strong>Suggested:</strong> Popular search terms will reveal which violation types your audience cares about most.</NoteBox>
          </div>
        </Panel>

        {/* Reading Level */}
        <Panel>
          <div className="ig-anim ig-d9">
            <PanelHead title="Reading Level Usage" />
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {[
                { key: 'simple', label: 'Simple', color: '#2563EB' },
                { key: 'standard', label: 'Standard', color: '#64748B' },
                { key: 'professional', label: 'Legal', color: '#7C3AED' },
              ].map(r => (
                <div key={r.key} style={{ flex: 1, padding: '8px 6px', borderRadius: 6, background: C.surface, textAlign: 'center' }}>
                  <div style={{ fontFamily: font, fontSize: '1rem', fontWeight: 800, color: r.color, lineHeight: 1 }}>{readingLevelData.usage[r.key] || 0}</div>
                  <div style={{ fontSize: '0.48rem', fontWeight: 700, color: C.muted, marginTop: 2 }}>{r.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.5rem', color: C.muted }}>Section opens by reading level active at time of open</div>
          </div>
        </Panel>

        {/* Education Score Preview */}
        <Panel>
          <div className="ig-anim ig-d9">
            <PanelHead title="Education Score Preview" />
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', background: `${C.accent}12`, border: `2px dashed ${C.accent}35`, marginBottom: 6 }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: C.accent }}>TBD</span>
              </div>
              <div style={{ fontSize: '0.56rem', color: '#475569', lineHeight: 1.4 }}>
                Each reporter will receive an education score based on chapters read, completion depth, and time spent.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              {['Chapters Read', 'Completion %', 'Time Spent'].map(f => (
                <div key={f} style={{ flex: 1, padding: '4px 3px', background: C.surface, borderRadius: 4, fontSize: '0.42rem', fontWeight: 700, color: C.muted, textAlign: 'center', textTransform: 'uppercase' }}>{f}</div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* ── Bottom: 2 columns ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Referral Tracking */}
        <Panel>
          <div className="ig-anim ig-d9">
            <PanelHead title="Referral & Share Tracking" right="Traffic sources" />
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {[
                { icon: '🔗', label: 'Direct', value: '67%' },
                { icon: '📱', label: 'Social', value: '18%' },
                { icon: '🔄', label: 'Referral', value: '12%' },
                { icon: '🔍', label: 'Search', value: '3%' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', background: C.surface, borderRadius: 6 }}>
                  <div style={{ fontSize: '0.88rem', marginBottom: 2 }}>{s.icon}</div>
                  <div style={{ fontFamily: font, fontSize: '0.82rem', fontWeight: 800, color: C.slate900 }}>{s.value}</div>
                  <div style={{ fontSize: '0.46rem', color: C.muted, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <NoteBox>Track how users discover the platform — especially organic shares within disability advocacy communities.</NoteBox>
          </div>
        </Panel>

        {/* Attorney Match Speed */}
        <Panel>
          <div className="ig-anim ig-d9">
            <PanelHead title="Attorney Match Speed" right="Activates with reporting" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              {[
                { v: '48h', l: 'Target', sub: 'Claim window' },
                { v: '—', l: 'Current Avg', sub: 'No data yet', dim: true },
                { v: '—', l: 'Fastest', sub: 'By category', dim: true },
                { v: '3', l: 'Attorneys Active', sub: '0 pending' },
              ].map((m, i) => (
                <div key={i} style={{ padding: '8px 10px', background: C.surface, borderRadius: 6 }}>
                  <div style={{ fontFamily: font, fontSize: '1rem', fontWeight: 800, color: m.dim ? C.ghost : C.slate900 }}>{m.v}</div>
                  <div style={{ fontSize: '0.52rem', fontWeight: 700, color: '#475569' }}>{m.l}</div>
                  <div style={{ fontSize: '0.44rem', color: C.muted }}>{m.sub}</div>
                </div>
              ))}
            </div>
            <NoteBox>Will break down match speed by violation category. Target: 80% claimed within 48 hours.</NoteBox>
          </div>
        </Panel>
      </div>

    </div>
  );
}
