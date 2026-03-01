import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Panel, PanelHead, Bar, pct } from './IntelShared';

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

export default function IntelGuide() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30');
  const [expandedChapter, setExpandedChapter] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const all = await base44.entities.AnalyticsEvent.list('-created_date', 5000);
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

  const guideEvents = useMemo(() => {
    const views = filtered.filter(e => e.event_name === 'guide_section_viewed');
    const opens = filtered.filter(e => e.event_name === 'guide_section_opened');
    const searches = filtered.filter(e => e.event_name === 'guide_search');
    const conversions = filtered.filter(e => e.event_name === 'guide_to_report_conversion');
    const levelChanges = filtered.filter(e => e.event_name === 'guide_reading_level_changed');
    const aiQueries = filtered.filter(e => e.event_name === 'ada_ai_helper_query');
    return { views, opens, searches, conversions, levelChanges, aiQueries };
  }, [filtered]);

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
      totalViews: views.length,
      sectionOpens: opens.length,
      uniqueSectionsOpened: uniqueSections.size,
      searches: searches.length,
      conversions: conversions.length,
      aiQueries: aiQueries.length,
      viewDelta,
      conversionRate: views.length > 0 ? pct(conversions.length, views.length) : 0,
    };
  }, [guideEvents, events, range]);

  const chapterData = useMemo(() => {
    const { views, opens, conversions } = guideEvents;
    const chapters = ALL_CHAPTERS.map(ch => {
      const chViews = views.filter(e => {
        const name = (e.properties?.section_name || '').toLowerCase();
        return name.includes(`chapter ${ch.num}`) || name.includes(`ch. ${ch.num}`) || name.includes(ch.name.toLowerCase());
      }).length;
      const chOpens = opens.filter(e => {
        const c = e.properties?.chapter;
        return c === ch.num || c === String(ch.num);
      });
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
        ...ch,
        views: chViews,
        opens: chOpens.length,
        conversions: chConversions,
        convRate: chViews > 0 ? pct(chConversions, chViews) : 0,
        sections: Object.values(sectionMap).sort((a, b) => b.opens - a.opens),
      };
    });
    return chapters.sort((a, b) => (b.views + b.opens) - (a.views + a.opens));
  }, [guideEvents]);

  const searchData = useMemo(() => {
    const { searches } = guideEvents;
    const queryMap = {};
    searches.forEach(e => {
      const q = (e.properties?.query || e.properties?.search_query || '').trim().toLowerCase();
      if (q) queryMap[q] = (queryMap[q] || 0) + 1;
    });
    const ranked = Object.entries(queryMap).sort((a, b) => b[1] - a[1]);

    const themes = {};
    const keywords = {
      'parking': ['parking', 'lot', 'garage', 'van accessible', 'handicap parking'],
      'restroom': ['restroom', 'bathroom', 'toilet', 'water closet', 'lavatory', 'grab bar'],
      'entrance': ['entrance', 'door', 'entry', 'exit', 'doorway', 'threshold'],
      'ramp': ['ramp', 'slope', 'curb ramp', 'grade', 'incline'],
      'elevator': ['elevator', 'lift', 'platform lift'],
      'signage': ['sign', 'signage', 'braille', 'tactile'],
      'seating': ['seating', 'seat', 'wheelchair space', 'assembly'],
      'service animal': ['service animal', 'dog', 'service dog'],
      'website': ['website', 'screen reader', 'keyboard', 'digital', 'caption', 'alt text'],
    };
    ranked.forEach(([query, count]) => {
      let matched = false;
      for (const [theme, words] of Object.entries(keywords)) {
        if (words.some(w => query.includes(w))) {
          if (!themes[theme]) themes[theme] = { theme, count: 0, queries: [] };
          themes[theme].count += count;
          themes[theme].queries.push([query, count]);
          matched = true;
          break;
        }
      }
      if (!matched) {
        if (!themes['other']) themes['other'] = { theme: 'other', count: 0, queries: [] };
        themes['other'].count += count;
        themes['other'].queries.push([query, count]);
      }
    });

    return {
      topQueries: ranked.slice(0, 15),
      themes: Object.values(themes).sort((a, b) => b.count - a.count),
      totalSearches: searches.length,
      uniqueQueries: ranked.length,
    };
  }, [guideEvents]);

  const readingLevelData = useMemo(() => {
    const { levelChanges, opens } = guideEvents;
    const levels = { simple: 0, standard: 0, professional: 0 };
    levelChanges.forEach(e => {
      const to = e.properties?.to || e.properties?.level;
      if (to && levels[to] !== undefined) levels[to]++;
    });
    const openLevels = { simple: 0, standard: 0, professional: 0 };
    opens.forEach(e => {
      const rl = e.properties?.reading_level;
      if (rl && openLevels[rl] !== undefined) openLevels[rl]++;
    });
    return { switches: levels, usage: openLevels };
  }, [guideEvents]);

  const dailyActivity = useMemo(() => {
    const days = [];
    const numDays = Math.min(parseInt(range) || 30, 30);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days.push({ date: key, day: d.getDate(), views: 0, opens: 0, searches: 0, conversions: 0 });
    }
    filtered.forEach(e => {
      const d = new Date(e.created_date).toISOString().split('T')[0];
      const slot = days.find(x => x.date === d);
      if (!slot) return;
      if (e.event_name === 'guide_section_viewed') slot.views++;
      else if (e.event_name === 'guide_section_opened') slot.opens++;
      else if (e.event_name === 'guide_search') slot.searches++;
      else if (e.event_name === 'guide_to_report_conversion') slot.conversions++;
    });
    return days;
  }, [filtered, range]);

  if (loading) {
    return (
      <Panel><div style={{ textAlign: 'center', padding: 40 }}><div className="a11y-spinner" style={{ margin: '0 auto' }} /><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: '#94A3B8', marginTop: 10 }}>Loading guide analytics…</p></div></Panel>
    );
  }

  const maxDaily = Math.max(...dailyActivity.map(d => d.views + d.opens), 1);
  const maxChapter = Math.max(...chapterData.map(c => c.views + c.opens), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <select value={range} onChange={e => setRange(e.target.value)} aria-label="Date range"
          style={{ padding: '6px 10px', fontSize: '0.72rem', fontFamily: 'Manrope, sans-serif', border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer', minHeight: 32 }}>
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Engagement Pulse */}
      <Panel>
        <PanelHead title="Engagement Pulse" right={pulse.viewDelta !== 0 ? `${pulse.viewDelta > 0 ? '+' : ''}${pulse.viewDelta}% vs prior period` : ''} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 14 }}>
          {[
            { v: pulse.totalViews, l: 'Chapter Views', accent: true },
            { v: pulse.sectionOpens, l: 'Section Opens' },
            { v: pulse.uniqueSectionsOpened, l: 'Unique Sections' },
            { v: pulse.searches, l: 'Searches' },
            { v: pulse.aiQueries, l: 'AI Helper Queries' },
            { v: pulse.conversions, l: 'Report Intent', accent: pulse.conversions > 0 },
            { v: `${pulse.conversionRate}%`, l: 'Conversion Rate', accent: pulse.conversionRate > 5 },
          ].map((k, i) => (
            <div key={i} style={{ padding: '10px 10px', borderRadius: 8, textAlign: 'center', background: k.accent ? '#FFF7ED' : '#F8F8FA', border: `1px solid ${k.accent ? '#FED7AA' : '#E8E8EC'}` }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.3rem', fontWeight: 800, color: k.accent ? '#C2410C' : 'var(--slate-900, #1A1A2E)', lineHeight: 1 }}>{k.v}</div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, color: k.accent ? '#C2410C' : '#94A3B8', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.l}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 64 }}>
          {dailyActivity.map((d, i) => {
            const h = Math.max((d.views + d.opens) / maxDaily * 100, 0);
            const isToday = i === dailyActivity.length - 1;
            const has = d.views + d.opens > 0;
            return (
              <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }} title={`${d.date}: ${d.views} views, ${d.opens} opens`}>
                {has && <span style={{ fontSize: '0.42rem', fontWeight: 700, color: isToday ? '#C2410C' : '#64748B' }}>{d.views + d.opens}</span>}
                <div style={{ width: '100%', maxWidth: 24, borderRadius: '3px 3px 0 0', overflow: 'hidden', height: h > 0 ? `${h}%` : '2px', minHeight: has ? 4 : 2, background: !has ? '#F1F1F5' : undefined }}>
                  {has && <div style={{ width: '100%', height: `${pct(d.views, d.views + d.opens)}%`, background: isToday ? '#C2410C' : '#D4A574', minHeight: d.views ? 2 : 0 }} />}
                  {has && <div style={{ width: '100%', height: `${pct(d.opens, d.views + d.opens)}%`, background: isToday ? '#2563EB' : '#7CA5D4', minHeight: d.opens ? 2 : 0 }} />}
                </div>
                <span style={{ fontSize: '0.4rem', color: isToday ? '#C2410C' : '#CBD5E1' }}>{isToday ? 'Today' : d.day}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: '0.56rem', color: '#94A3B8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: 1, background: '#D4A574' }} /> Chapter views</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: 1, background: '#7CA5D4' }} /> Section opens</span>
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Content Heatmap */}
        <Panel style={{ gridRow: 'span 2' }}>
          <PanelHead title="Content Heatmap" right={`${chapterData.filter(c => c.views + c.opens > 0).length}/10 active`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {chapterData.map(ch => {
              const isOpen = expandedChapter === ch.num;
              const total = ch.views + ch.opens;
              const hasData = total > 0;
              const maxSection = ch.sections[0]?.opens || 1;
              return (
                <div key={ch.num}>
                  <button onClick={() => setExpandedChapter(isOpen ? null : ch.num)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem',
                    padding: '7px 8px', border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
                    background: isOpen ? '#F8F8FA' : 'transparent', opacity: hasData ? 1 : 0.5, transition: 'background 0.1s',
                  }}>
                    <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: '0.72rem', color: '#C2410C', width: 20, flexShrink: 0, textAlign: 'center' }}>{ch.num}</span>
                    <span style={{ flex: 1, fontWeight: 600, color: 'var(--slate-900, #1A1A2E)', fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</span>
                    <div style={{ width: 55 }}><Bar v={total} max={maxChapter} color="#C2410C" h={8} /></div>
                    <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '0.72rem', color: 'var(--slate-900, #1A1A2E)', width: 22, textAlign: 'right', flexShrink: 0 }}>{total}</span>
                    {ch.conversions > 0 && <span style={{ fontSize: '0.48rem', fontWeight: 700, padding: '1px 4px', borderRadius: 99, background: '#DCFCE7', color: '#15803D' }}>{ch.conversions} rpt</span>}
                    <span style={{ fontSize: '0.6rem', color: '#CBD5E1', width: 10 }}>{isOpen ? '▴' : '▾'}</span>
                  </button>
                  {isOpen && (
                    <div style={{ marginLeft: 26, paddingLeft: 10, borderLeft: '2px solid #E2E8F0', marginTop: 2, marginBottom: 6 }}>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '4px 0 6px', fontSize: '0.6rem', color: '#64748B', borderBottom: '1px solid #F1F1F5', marginBottom: 4 }}>
                        <span>Views: <strong>{ch.views}</strong></span>
                        <span>Opens: <strong>{ch.opens}</strong></span>
                        <span>Report: <strong style={{ color: ch.conversions ? '#15803D' : '#94A3B8' }}>{ch.conversions}</strong></span>
                        {ch.views > 0 && <span>Conv: <strong style={{ color: ch.convRate > 5 ? '#15803D' : '#94A3B8' }}>{ch.convRate}%</strong></span>}
                      </div>
                      {ch.sections.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {ch.sections.slice(0, 8).map(s => (
                            <div key={s.title} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.62rem', padding: '2px 4px' }}>
                              <span style={{ flex: 1, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                              <div style={{ width: 45 }}><Bar v={s.opens} max={maxSection} color="#7CA5D4" h={6} /></div>
                              <span style={{ fontWeight: 700, color: 'var(--slate-900, #1A1A2E)', width: 16, textAlign: 'right', flexShrink: 0 }}>{s.opens}</span>
                            </div>
                          ))}
                          {ch.sections.length > 8 && <span style={{ fontSize: '0.55rem', color: '#94A3B8', paddingLeft: 4 }}>+{ch.sections.length - 8} more</span>}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.6rem', color: '#CBD5E1', fontStyle: 'italic', margin: 0 }}>No section-level data yet</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Search Intelligence */}
        <Panel>
          <PanelHead title="Search Intelligence" right={`${searchData.uniqueQueries} unique`} />
          {searchData.themes.length > 0 ? (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                {searchData.themes.slice(0, 8).map(t => (
                  <span key={t.theme} style={{
                    fontSize: '0.58rem', fontWeight: 700, padding: '3px 7px', borderRadius: 99,
                    background: t.theme === 'other' ? '#F1F1F5' : '#FFF7ED',
                    color: t.theme === 'other' ? '#94A3B8' : '#C2410C', textTransform: 'capitalize',
                  }}>{t.theme} ({t.count})</span>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {searchData.topQueries.slice(0, 10).map(([q, n], i) => {
                  const maxQ = searchData.topQueries[0][1];
                  return (
                    <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem' }}>
                      <span style={{ width: 14, textAlign: 'right', fontWeight: 700, color: '#CBD5E1', flexShrink: 0 }}>{i + 1}</span>
                      <div style={{ flex: 1, position: 'relative', height: 22, background: '#F8F8FA', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${pct(n, maxQ)}%`, background: '#FED7AA', borderRadius: '4px 0 0 4px', minWidth: 4 }} />
                        <span style={{ position: 'relative', zIndex: 1, padding: '0 8px', lineHeight: '22px', color: '#475569', fontSize: '0.65rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{q}"</span>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--slate-900, #1A1A2E)', width: 18, textAlign: 'right', flexShrink: 0 }}>{n}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p style={{ fontSize: '0.72rem', color: '#CBD5E1', fontStyle: 'italic', textAlign: 'center', padding: 20 }}>No search data in this period</p>
          )}
        </Panel>

        {/* Conversion Funnel + Reading Level */}
        <Panel>
          <PanelHead title="Guide → Report Funnel" />
          {(() => {
            const stages = [
              { l: 'Chapter Views', n: pulse.totalViews, c: '#94A3B8' },
              { l: 'Section Opens', n: pulse.sectionOpens, c: '#64748B' },
              { l: 'Report Intent', n: pulse.conversions, c: '#15803D' },
            ];
            const maxN = stages[0].n || 1;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {stages.map((s, i) => {
                  const w = Math.max(pct(s.n, maxN), 3);
                  const prev = i > 0 ? stages[i - 1].n : null;
                  const conv = prev > 0 ? pct(s.n, prev) : null;
                  const bigDrop = conv !== null && conv < 20;
                  return (
                    <div key={s.l}>
                      {conv !== null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 78, marginBottom: 2 }}>
                          <span style={{ fontSize: '0.5rem', fontWeight: 700, color: bigDrop ? '#DC2626' : '#94A3B8' }}>↓ {conv}%</span>
                          {bigDrop && <span style={{ fontSize: '0.46rem', color: '#DC2626', fontWeight: 600 }}>⚠ drop-off</span>}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 70, fontSize: '0.6rem', fontWeight: 600, color: 'var(--slate-900, #1A1A2E)', textAlign: 'right', flexShrink: 0 }}>{s.l}</span>
                        <div style={{ flex: 1, height: 16, background: '#F1F1F5', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${w}%`, height: '100%', background: s.c, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 4, minWidth: 20 }}>
                            {w > 15 && <span style={{ fontSize: '0.52rem', fontWeight: 700, color: '#FFF' }}>{s.n}</span>}
                          </div>
                        </div>
                        {w <= 15 && <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--slate-900, #1A1A2E)', flexShrink: 0 }}>{s.n}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {pulse.totalViews > 0 && (
            <div style={{ padding: '8px 10px', background: '#FFF7ED', borderRadius: 6, fontSize: '0.6rem', color: '#9A3412', lineHeight: 1.5, marginBottom: 14 }}>
              {pulse.conversionRate === 0
                ? 'No report conversions from the guide yet. Consider making the "Report a Violation" CTA more prominent within chapter content.'
                : pulse.conversionRate < 3
                  ? `${pulse.conversionRate}% conversion rate. The guide generates awareness but few reports. Consider adding violation examples in the most-viewed sections.`
                  : `${pulse.conversionRate}% conversion — the guide is effectively driving report intent.`}
            </div>
          )}

          <div style={{ borderTop: '1px solid #F1F1F5', paddingTop: 10 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Reading Level Usage</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { key: 'simple', label: 'Simple', color: '#2563EB' },
                { key: 'standard', label: 'Standard', color: '#64748B' },
                { key: 'professional', label: 'Legal', color: '#7C3AED' },
              ].map(r => {
                const usage = readingLevelData.usage[r.key] || 0;
                const switches = readingLevelData.switches[r.key] || 0;
                return (
                  <div key={r.key} style={{ flex: 1, padding: '8px 6px', borderRadius: 6, background: '#F8F8FA', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 800, color: r.color, lineHeight: 1 }}>{usage}</div>
                    <div style={{ fontSize: '0.5rem', fontWeight: 700, color: '#94A3B8', marginTop: 2 }}>{r.label}</div>
                    {switches > 0 && <div style={{ fontSize: '0.46rem', color: '#CBD5E1', marginTop: 1 }}>{switches} switches</div>}
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: '0.52rem', color: '#94A3B8', marginTop: 6 }}>Section opens by reading level active at time of open</div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
