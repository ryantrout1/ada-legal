import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Panel, PanelHead, Bar, Dot, Tag, pct } from './IntelShared';

const CHAPTERS = [
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

export default function IntelGuide() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30');
  const [expandedChapter, setExpandedChapter] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const all = await base44.entities.AnalyticsEvent.list('-created_date', 3000);
        setEvents(all);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (range === 'all') return events;
    const cutoff = new Date(Date.now() - parseInt(range) * 86400000);
    return events.filter(e => new Date(e.created_date) >= cutoff);
  }, [events, range]);

  // ── Derived data ──
  const data = useMemo(() => {
    const guideViews = filtered.filter(e => e.event_name === 'guide_section_viewed');
    const sectionOpens = filtered.filter(e => e.event_name === 'guide_section_opened');
    const searches = filtered.filter(e => e.event_name === 'guide_search');
    const reportIntent = filtered.filter(e => e.event_name === 'guide_to_report_conversion');
    const aiQueries = filtered.filter(e => e.event_name === 'ada_ai_helper_query');
    const levelChanges = filtered.filter(e => e.event_name === 'guide_reading_level_changed');

    // Unique sections
    const uniqueSections = new Set();
    guideViews.forEach(e => { const n = e.properties?.section_name; if (n) uniqueSections.add(n); });

    // ── Chapter views (from guide_section_viewed section_name) ──
    const chapterViews = {};
    guideViews.forEach(e => {
      const name = e.properties?.section_name || '';
      // Try to match "Chapter N:" pattern
      const match = name.match(/Chapter\s+(\d+)/i);
      const num = match ? parseInt(match[1]) : null;
      if (num) {
        if (!chapterViews[num]) chapterViews[num] = { num, views: 0, conversions: 0, sections: {} };
        chapterViews[num].views++;
      }
    });

    // ── Section opens (from guide_section_opened) ──
    sectionOpens.forEach(e => {
      const ch = e.properties?.chapter;
      const secNum = e.properties?.section_number || '';
      const secTitle = e.properties?.section_title || '';
      if (ch) {
        if (!chapterViews[ch]) chapterViews[ch] = { num: ch, views: 0, conversions: 0, sections: {} };
        const key = `${secNum} ${secTitle}`.trim();
        if (key) chapterViews[ch].sections[key] = (chapterViews[ch].sections[key] || 0) + 1;
      }
    });

    // ── Conversions per chapter ──
    reportIntent.forEach(e => {
      const src = e.properties?.source || '';
      const match = src.match(/chapter_(\d+)/);
      const num = match ? parseInt(match[1]) : null;
      if (num && chapterViews[num]) chapterViews[num].conversions++;
    });

    const chapters = CHAPTERS.map(c => {
      const cv = chapterViews[c.num] || { num: c.num, views: 0, conversions: 0, sections: {} };
      return {
        ...c,
        views: cv.views,
        conversions: cv.conversions,
        sectionOpens: Object.entries(cv.sections).sort((a, b) => b[1] - a[1]),
        convRate: cv.views > 0 ? Math.round(cv.conversions / cv.views * 100) : 0,
      };
    }).sort((a, b) => b.views - a.views);

    // ── Search queries ──
    const queryMap = {};
    searches.forEach(e => {
      const q = (e.properties?.query || '').trim().toLowerCase();
      if (q) queryMap[q] = (queryMap[q] || 0) + 1;
    });
    const topQueries = Object.entries(queryMap).sort((a, b) => b[1] - a[1]).slice(0, 15);

    // ── Search themes ──
    const themes = {};
    const themeKeywords = {
      'Parking': ['parking', 'van', 'accessible parking', 'striped'],
      'Restroom': ['restroom', 'bathroom', 'toilet', 'water closet', 'lavatory', 'grab bar'],
      'Entrance': ['entrance', 'door', 'doorway', 'threshold', 'entry'],
      'Ramp': ['ramp', 'slope', 'incline', 'grade'],
      'Elevator': ['elevator', 'lift', 'platform lift'],
      'Signage': ['sign', 'signage', 'braille', 'tactile'],
      'Route': ['route', 'path', 'walkway', 'aisle', 'corridor'],
    };
    Object.entries(queryMap).forEach(([q]) => {
      let matched = false;
      for (const [theme, kws] of Object.entries(themeKeywords)) {
        if (kws.some(kw => q.includes(kw))) {
          themes[theme] = (themes[theme] || 0) + queryMap[q];
          matched = true;
          break;
        }
      }
      if (!matched) themes['Other'] = (themes['Other'] || 0) + queryMap[q];
    });
    const searchThemes = Object.entries(themes).sort((a, b) => b[1] - a[1]);

    // ── Reading level distribution ──
    const levelDist = { simple: 0, standard: 0, professional: 0 };
    levelChanges.forEach(e => {
      const l = e.properties?.level;
      if (l && levelDist[l] !== undefined) levelDist[l]++;
    });

    // ── Daily activity (last N days) ──
    const numDays = range === 'all' ? 90 : parseInt(range);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daily = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      daily.push({ date: d.toISOString().split('T')[0], day: d.getDate(), views: 0, opens: 0, searches: 0 });
    }
    guideViews.forEach(e => {
      const d = (e.created_date || '').split('T')[0];
      const slot = daily.find(x => x.date === d);
      if (slot) slot.views++;
    });
    sectionOpens.forEach(e => {
      const d = (e.created_date || '').split('T')[0];
      const slot = daily.find(x => x.date === d);
      if (slot) slot.opens++;
    });
    searches.forEach(e => {
      const d = (e.created_date || '').split('T')[0];
      const slot = daily.find(x => x.date === d);
      if (slot) slot.searches++;
    });

    // ── Period comparison ──
    const halfDays = Math.floor(numDays / 2);
    const recentViews = daily.slice(-halfDays).reduce((s, d) => s + d.views, 0);
    const priorViews = daily.slice(0, halfDays).reduce((s, d) => s + d.views, 0);
    const viewsDelta = priorViews > 0 ? Math.round((recentViews - priorViews) / priorViews * 100) : recentViews > 0 ? 100 : 0;

    return {
      guideViews: guideViews.length,
      sectionOpens: sectionOpens.length,
      searches: searches.length,
      reportIntent: reportIntent.length,
      aiQueries: aiQueries.length,
      uniqueSections: uniqueSections.size,
      chapters,
      topQueries,
      searchThemes,
      levelDist,
      levelChanges: levelChanges.length,
      daily,
      viewsDelta,
      convRate: guideViews.length > 0 ? Math.round(reportIntent.length / guideViews.length * 100) : 0,
    };
  }, [filtered]);

  if (loading) {
    return <Panel><div style={{ textAlign: 'center', padding: 40 }}><div className="a11y-spinner" style={{ margin: '0 auto' }} /><p style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: 8 }}>Loading guide analytics…</p></div></Panel>;
  }

  const maxDaily = Math.max(...data.daily.map(d => d.views + d.opens), 1);
  const maxChViews = data.chapters[0]?.views || 1;
  const maxQuery = data.topQueries[0]?.[1] || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Date range */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <select value={range} onChange={e => setRange(e.target.value)} aria-label="Date range"
          style={{ padding: '6px 12px', fontSize: '0.72rem', fontFamily: 'Manrope, sans-serif', fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 6, color: '#475569', cursor: 'pointer', minHeight: 32, background: 'white' }}>
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* ── Panel 1: Engagement Pulse ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Panel>
          <PanelHead title="Engagement Pulse" right={data.viewsDelta !== 0 ? `${data.viewsDelta > 0 ? '+' : ''}${data.viewsDelta}% vs prior period` : ''} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { v: data.guideViews, l: 'Page Views', accent: true },
              { v: data.sectionOpens, l: 'Sections Opened', accent: false },
              { v: data.uniqueSections, l: 'Unique Sections', accent: false },
            ].map(k => (
              <div key={k.l} style={{ textAlign: 'center', padding: '10px 6px', borderRadius: 8, background: k.accent ? '#FFF7ED' : '#F8F8FA' }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.4rem', fontWeight: 800, color: k.accent ? '#C2410C' : 'var(--slate-900, #1A1A2E)', lineHeight: 1 }}>{k.v}</div>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, color: k.accent ? '#C2410C' : '#94A3B8', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { v: data.searches, l: 'Searches', fg: '#1E40AF' },
              { v: data.aiQueries, l: 'AI Questions', fg: '#7C3AED' },
              { v: data.reportIntent, l: 'Report Intent', fg: '#15803D' },
            ].map(k => (
              <div key={k.l} style={{ textAlign: 'center', padding: '10px 6px', borderRadius: 8, background: '#F8F8FA' }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.4rem', fontWeight: 800, color: k.fg, lineHeight: 1 }}>{k.v}</div>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#94A3B8', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.l}</div>
              </div>
            ))}
          </div>
        </Panel>

        {/* ── Activity over time ── */}
        <Panel>
          <PanelHead title="Daily Activity" />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 100 }}>
            {data.daily.map((d, i) => {
              const total = d.views + d.opens;
              const h = Math.max(total / maxDaily * 100, 0);
              const isToday = i === data.daily.length - 1;
              return (
                <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }} title={`${d.date}: ${d.views} views, ${d.opens} section opens, ${d.searches} searches`}>
                  {total > 0 && data.daily.length <= 30 && <span style={{ fontSize: '0.42rem', fontWeight: 700, color: isToday ? '#C2410C' : '#94A3B8' }}>{total}</span>}
                  <div style={{ width: '100%', maxWidth: 20, display: 'flex', flexDirection: 'column', borderRadius: '2px 2px 0 0', overflow: 'hidden' }}>
                    {d.views > 0 && <div style={{ height: Math.max(h * (d.views / (total || 1)), 2), background: isToday ? '#C2410C' : '#D4A574' }} />}
                    {d.opens > 0 && <div style={{ height: Math.max(h * (d.opens / (total || 1)), 2), background: isToday ? '#2563EB' : '#7CA5D4' }} />}
                    {total === 0 && <div style={{ height: 2, background: '#F1F1F5' }} />}
                  </div>
                  {data.daily.length <= 30 && <span style={{ fontSize: '0.38rem', color: isToday ? '#C2410C' : '#CBD5E1' }}>{isToday ? '•' : d.day}</span>}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: '0.55rem', color: '#94A3B8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: 1, background: '#D4A574' }} /> Page views</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: 1, background: '#7CA5D4' }} /> Section opens</span>
          </div>
        </Panel>
      </div>

      {/* ── Panel 2: Chapter Drill-down ── */}
      <Panel>
        <PanelHead title="What Are People Reading?" right={`${data.chapters.filter(c => c.views > 0).length} of ${CHAPTERS.length} chapters viewed`} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {data.chapters.map(ch => {
            const isOpen = expandedChapter === ch.num;
            const hasConversions = ch.conversions > 0;
            return (
              <div key={ch.num}>
                <button onClick={() => setExpandedChapter(isOpen ? null : ch.num)} aria-expanded={isOpen} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem',
                  padding: '7px 10px', border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
                  background: isOpen ? '#F8F8FA' : 'transparent', transition: 'background 0.1s',
                }}>
                  <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: '0.75rem', color: '#C2410C', background: '#FFF7ED', padding: '1px 6px', borderRadius: 4, flexShrink: 0, width: 24, textAlign: 'center' }}>{ch.num}</span>
                  <span style={{ flex: 1, fontWeight: 600, color: 'var(--slate-900, #1A1A2E)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</span>
                  <div style={{ width: 120, flexShrink: 0 }}><Bar v={ch.views} max={maxChViews} color="#C2410C" h={8} /></div>
                  <span style={{ fontFamily: 'Fraunces, serif', width: 28, textAlign: 'right', fontWeight: 700, color: 'var(--slate-900, #1A1A2E)', flexShrink: 0 }}>{ch.views}</span>
                  {hasConversions && <Tag bg="#DCFCE7" fg="#15803D">{ch.conversions} report{ch.conversions > 1 ? 's' : ''}</Tag>}
                  <span style={{ fontSize: '0.65rem', color: '#CBD5E1', width: 10, textAlign: 'center', flexShrink: 0 }}>{isOpen ? '▴' : '▾'}</span>
                </button>
                {isOpen && (
                  <div style={{ marginLeft: 42, paddingLeft: 10, borderLeft: '2px solid #E2E8F0', marginTop: 2, marginBottom: 6, paddingBottom: 6 }}>
                    <div style={{ display: 'flex', gap: 12, fontSize: '0.65rem', color: '#64748B', marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid #F1F1F5' }}>
                      <span>Views: <strong>{ch.views}</strong></span>
                      <span>Section opens: <strong>{ch.sectionOpens.reduce((s, [, n]) => s + n, 0)}</strong></span>
                      <span>Report intent: <strong style={{ color: ch.conversions > 0 ? '#15803D' : '#94A3B8' }}>{ch.conversions}</strong></span>
                      {ch.views > 0 && <span>Conversion: <strong style={{ color: ch.convRate > 5 ? '#15803D' : '#94A3B8' }}>{ch.convRate}%</strong></span>}
                    </div>
                    {ch.sectionOpens.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Most opened sections</div>
                        {ch.sectionOpens.slice(0, 8).map(([name, count]) => {
                          const maxSec = ch.sectionOpens[0][1];
                          return (
                            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.68rem' }}>
                              <span style={{ flex: 1, color: 'var(--slate-900, #1A1A2E)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                              <div style={{ width: 80, flexShrink: 0 }}><Bar v={count} max={maxSec} color="#D4A574" h={6} /></div>
                              <span style={{ fontWeight: 700, color: 'var(--slate-900, #1A1A2E)', width: 20, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.68rem', color: '#CBD5E1', fontStyle: 'italic' }}>No section-level data yet — opens will appear as users interact</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      {/* ── Panel 3 & 4: Search Intelligence + Conversion ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Search Intelligence */}
        <Panel>
          <PanelHead title="Search Intelligence" right={`${data.searches} total searches`} />
          {data.searchThemes.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Search themes</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {data.searchThemes.map(([theme, count]) => (
                  <span key={theme} style={{ fontSize: '0.62rem', fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: theme === 'Other' ? '#F1F1F5' : '#FFF7ED', color: theme === 'Other' ? '#94A3B8' : '#C2410C', border: '1px solid ' + (theme === 'Other' ? '#E8E8EC' : '#FED7AA') }}>
                    {theme} <strong>{count}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Top queries</div>
          {data.topQueries.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {data.topQueries.map(([q, count], i) => (
                <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.68rem' }}>
                  <span style={{ width: 16, textAlign: 'right', fontWeight: 700, color: '#CBD5E1', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, position: 'relative', height: 24, background: '#F8F8FA', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: '0 auto 0 0', width: `${count / maxQuery * 100}%`, background: '#FED7AA', borderRadius: 4 }} />
                    <span style={{ position: 'relative', zIndex: 1, padding: '0 8px', lineHeight: '24px', color: 'var(--slate-900, #1A1A2E)', fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{q}"</span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--slate-900, #1A1A2E)', width: 24, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.72rem', color: '#CBD5E1', fontStyle: 'italic', padding: 12 }}>No search data yet</div>
          )}
        </Panel>

        {/* Conversion Funnel + Reading Level */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Panel>
            <PanelHead title="Guide → Report Funnel" />
            {(() => {
              const stages = [
                { l: 'Page Views', n: data.guideViews, c: '#94A3B8' },
                { l: 'Sections Opened', n: data.sectionOpens, c: '#D4A574' },
                { l: 'Report Intent', n: data.reportIntent, c: '#C2410C' },
              ];
              const maxN = stages[0].n || 1;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {stages.map((s, i) => {
                    const w = Math.max(s.n / maxN * 100, 3);
                    const prev = i > 0 ? stages[i - 1].n : null;
                    const conv = prev > 0 ? pct(s.n, prev) : null;
                    const bigDrop = conv !== null && conv < 20;
                    return (
                      <div key={s.l}>
                        {conv !== null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 90, marginBottom: 2 }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 700, color: bigDrop ? '#DC2626' : '#94A3B8' }}>↓ {conv}%</span>
                            {bigDrop && <span style={{ fontSize: '0.5rem', color: '#DC2626', fontWeight: 600 }}>⚠ major drop-off</span>}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 82, fontSize: '0.65rem', fontWeight: 600, color: 'var(--slate-900, #1A1A2E)', textAlign: 'right', flexShrink: 0 }}>{s.l}</span>
                          <div style={{ flex: 1, height: 18, background: '#F1F1F5', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${w}%`, height: '100%', background: s.c, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 5, minWidth: 20 }}>
                              {w > 15 && <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#FFF' }}>{s.n}</span>}
                            </div>
                          </div>
                          {w <= 15 && <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--slate-900, #1A1A2E)', flexShrink: 0 }}>{s.n}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <div style={{ marginTop: 10, padding: '6px 8px', background: '#FFF7ED', borderRadius: 6, fontSize: '0.62rem', color: '#9A3412', lineHeight: 1.5 }}>
              Overall conversion: <strong>{data.convRate}%</strong> of guide viewers express report intent
              {data.chapters.filter(c => c.convRate > 0).length > 0 && (
                <span> · Top converting: <strong>Ch. {data.chapters.filter(c => c.convRate > 0).sort((a, b) => b.convRate - a.convRate)[0]?.num}</strong> ({data.chapters.filter(c => c.convRate > 0).sort((a, b) => b.convRate - a.convRate)[0]?.convRate}%)</span>
              )}
            </div>
          </Panel>

          {/* Reading Level */}
          <Panel>
            <PanelHead title="Reading Level Usage" right={`${data.levelChanges} changes`} />
            {data.levelChanges > 0 ? (
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { key: 'simple', label: 'Simple', color: '#2563EB' },
                  { key: 'standard', label: 'Standard', color: '#64748B' },
                  { key: 'professional', label: 'Legal', color: '#9A3412' },
                ].map(r => {
                  const n = data.levelDist[r.key];
                  const p = data.levelChanges > 0 ? Math.round(n / data.levelChanges * 100) : 0;
                  return (
                    <div key={r.key} style={{ flex: 1, textAlign: 'center', padding: '10px 6px', borderRadius: 8, background: '#F8F8FA' }}>
                      <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 800, color: r.color, lineHeight: 1 }}>{n}</div>
                      <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#94A3B8', marginTop: 2 }}>{r.label}</div>
                      <div style={{ fontSize: '0.5rem', color: '#CBD5E1', marginTop: 1 }}>{p}%</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: '#CBD5E1', fontStyle: 'italic', padding: 8 }}>No reading level changes recorded yet — data will appear as users interact</div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
