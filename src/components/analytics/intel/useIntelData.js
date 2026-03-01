import { useMemo } from 'react';
import { pct, isDigital, getCategory, getSeverity, getDate, getViews } from './IntelShared';

export default function useIntelData(cases, lawyers, filter) {
  return useMemo(() => {
    let list = [...cases];

    // Apply global filters
    if (filter.sev !== 'all') list = list.filter(c => getSeverity(c) === filter.sev);
    if (filter.type !== 'all') {
      const cat = c => getCategory(c);
      list = filter.type === 'physical'
        ? list.filter(c => !isDigital(cat(c)))
        : list.filter(c => isDigital(cat(c)));
    }

    const total = list.length;
    const high = list.filter(c => getSeverity(c) === 'high').length;
    const med = list.filter(c => getSeverity(c) === 'medium').length;
    const low = list.filter(c => getSeverity(c) === 'low').length;
    const unclaimed = list.filter(c => c.status === 'available').length;
    const assigned = list.filter(c => ['assigned', 'in_progress', 'closed'].includes(c.status)).length;
    const zeroView = list.filter(c => c.status === 'available' && !getViews(c)).length;
    const physical = list.filter(c => !isDigital(getCategory(c))).length;
    const digital = list.filter(c => isDigital(getCategory(c))).length;

    // Active / pending lawyers
    const activeLawyers = (lawyers || []).filter(l => l.account_status === 'approved');
    const pendingLawyers = (lawyers || []).filter(l => l.account_status === 'pending');

    // Lawyers by state
    const lawyersByState = {};
    activeLawyers.forEach(l => {
      (l.states_of_practice || []).forEach(s => {
        lawyersByState[s] = (lawyersByState[s] || 0) + 1;
      });
    });

    // ── Daily trend (last 14 days) ──
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days14 = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days14.push({ date: key, day: d.getDate(), dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()], n: 0, phys: 0, dig: 0 });
    }
    list.forEach(c => {
      const cd = getDate(c).split('T')[0];
      const slot = days14.find(d => d.date === cd);
      if (slot) { slot.n++; if (isDigital(getCategory(c))) slot.dig++; else slot.phys++; }
    });

    // Pulse
    const todayKey = today.toISOString().split('T')[0];
    const d7 = new Date(today); d7.setDate(d7.getDate() - 6);
    const d30 = new Date(today); d30.setDate(d30.getDate() - 29);
    const todayN = list.filter(c => getDate(c).split('T')[0] === todayKey).length;
    const week7 = list.filter(c => getDate(c).split('T')[0] >= d7.toISOString().split('T')[0]).length;
    const month30 = list.filter(c => getDate(c).split('T')[0] >= d30.toISOString().split('T')[0]).length;

    // Trailing comparison
    const d14 = new Date(today); d14.setDate(d14.getDate() - 13);
    const prior7 = list.filter(c => {
      const cd = getDate(c).split('T')[0];
      return cd >= d14.toISOString().split('T')[0] && cd < d7.toISOString().split('T')[0];
    }).length;
    const weekDelta = prior7 > 0 ? Math.round((week7 - prior7) / prior7 * 100) : week7 > 0 ? 100 : 0;

    // Streak + velocity
    let streak = 0;
    for (let i = days14.length - 1; i >= 0; i--) {
      if (days14[i].n > 0) streak++;
      else if (streak > 0) break;
      else if (i === days14.length - 1) continue;
      else break;
    }
    const velocity = Math.round(week7 / 7 * 10) / 10;
    const trend = { days14, todayN, week7, month30, prior7, weekDelta, streak, velocity };

    // ── City aggregation ──
    const byCity = {};
    list.forEach(c => {
      const k = (c.city || '').trim();
      const st = (c.state || '').trim().toUpperCase();
      if (!k) return;
      if (!byCity[k]) byCity[k] = { name: k, st, n: 0, h: 0, m: 0, l: 0, cats: {}, atty: false };
      byCity[k].n++;
      byCity[k][getSeverity(c)[0]]++;
      const cat = getCategory(c);
      byCity[k].cats[cat] = (byCity[k].cats[cat] || 0) + 1;
      if (['assigned', 'in_progress', 'closed'].includes(c.status)) byCity[k].atty = true;
    });
    const cities = Object.values(byCity).sort((a, b) => b.n - a.n);

    // ── State aggregation (two-level: state → cities) ──
    const byState = {};
    list.forEach(c => {
      const st = (c.state || '').trim().toUpperCase();
      if (!st) return;
      if (!byState[st]) byState[st] = { st, n: 0, h: 0, m: 0, l: 0, cats: {}, atty: false, cities: {}, lawyers: lawyersByState[st] || 0, newThisMonth: 0 };
      byState[st].n++;
      byState[st][getSeverity(c)[0]]++;
      const cat = getCategory(c);
      byState[st].cats[cat] = (byState[st].cats[cat] || 0) + 1;
      if (['assigned', 'in_progress', 'closed'].includes(c.status)) byState[st].atty = true;
      // Per-city within state
      const ck = (c.city || '').trim();
      if (ck) {
        if (!byState[st].cities[ck]) byState[st].cities[ck] = { name: ck, st, n: 0, h: 0, m: 0, l: 0, cats: {}, atty: false };
        byState[st].cities[ck].n++;
        byState[st].cities[ck][getSeverity(c)[0]]++;
        byState[st].cities[ck].cats[cat] = (byState[st].cities[ck].cats[cat] || 0) + 1;
        if (['assigned', 'in_progress', 'closed'].includes(c.status)) byState[st].cities[ck].atty = true;
      }
      // New this month
      const d = new Date(getDate(c));
      const now = new Date();
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) byState[st].newThisMonth++;
    });
    const states = Object.values(byState).map(s => ({
      ...s,
      cities: Object.values(s.cities).sort((a, b) => b.n - a.n),
      topCat: Object.entries(s.cats).sort((a, b) => b[1] - a[1])[0],
      ratio: s.lawyers > 0 ? Math.round(s.n / s.lawyers * 10) / 10 : s.n > 0 ? Infinity : 0,
    })).sort((a, b) => b.n - a.n);

    // ── Category aggregation ──
    const byCat = {};
    list.forEach(c => {
      const k = getCategory(c);
      if (!byCat[k]) byCat[k] = { cat: k, n: 0, h: 0, m: 0, l: 0 };
      byCat[k].n++;
      byCat[k][getSeverity(c)[0]]++;
    });
    const cats = Object.values(byCat).sort((a, b) => b.n - a.n);

    // ── Business aggregation ──
    const byBiz = {};
    list.forEach(c => {
      const name = (c.business_name || '').trim() || 'Unknown';
      if (!byBiz[name]) byBiz[name] = { name, city: c.city || '', st: c.state || '', cases: [], h: 0, m: 0, l: 0, atty: false, views: 0 };
      byBiz[name].cases.push(c);
      byBiz[name][getSeverity(c)[0]]++;
      byBiz[name].views += getViews(c);
      if (['assigned', 'in_progress', 'closed'].includes(c.status)) byBiz[name].atty = true;
    });
    const bizzes = Object.values(byBiz).sort((a, b) => b.cases.length - a.cases.length);

    // Stale
    const now = Date.now();
    const stale = list.filter(c => c.status === 'available' && (now - new Date(getDate(c)).getTime()) > 72 * 3600000).length;

    return {
      list, total, high, med, low, unclaimed, assigned, zeroView, physical, digital,
      trend, cities, states, cats, bizzes, stale,
      activeLawyers: activeLawyers.length, pendingLawyers: pendingLawyers.length, lawyersByState,
    };
  }, [cases, lawyers, filter]);
}
