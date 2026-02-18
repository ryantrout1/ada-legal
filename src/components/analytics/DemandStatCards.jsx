import React from 'react';
import CompactStatCard from './CompactStatCard';
import { Clock, TrendingDown, Eye, MapPin } from 'lucide-react';

const STATE_NAME_TO_ABBR = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA','Colorado':'CO',
  'Connecticut':'CT','Delaware':'DE','District of Columbia':'DC','Florida':'FL','Georgia':'GA',
  'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS','Kentucky':'KY',
  'Louisiana':'LA','Maine':'ME','Maryland':'MD','Massachusetts':'MA','Michigan':'MI','Minnesota':'MN',
  'Mississippi':'MS','Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH',
  'New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND',
  'Ohio':'OH','Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC',
  'South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA',
  'Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY'
};

function normalizeState(s) {
  if (!s) return '';
  const trimmed = s.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return STATE_NAME_TO_ABBR[trimmed] || trimmed;
}

export default function DemandStatCards({ cases, lawyers }) {
  const matchedStatuses = ['assigned', 'in_progress', 'closed'];

  // Avg Days to Match
  const matchedCases = cases.filter(c => matchedStatuses.includes(c.status) && c.assigned_at);
  let avgDaysToMatch = '—';
  if (matchedCases.length > 0) {
    const totalDays = matchedCases.reduce((sum, c) => {
      const availableDate = new Date(c.approved_at || c.created_date);
      const assignedDate = new Date(c.assigned_at);
      return sum + (assignedDate - availableDate) / (1000 * 60 * 60 * 24);
    }, 0);
    const avg = totalDays / matchedCases.length;
    avgDaysToMatch = avg < 1 ? '<1d' : `${Math.round(avg)}d`;
  }

  // Unmatched Rate
  const reachedAvailable = cases.filter(c =>
    ['available', 'expired', ...matchedStatuses].includes(c.status)
  );
  const expiredCount = cases.filter(c => c.status === 'expired').length;
  let unmatchedRate = '—';
  let unmatchedColor = 'var(--slate-700)';
  let unmatchedBg = 'var(--surface)';
  if (reachedAvailable.length > 0) {
    const rate = Math.round((expiredCount / reachedAvailable.length) * 100);
    unmatchedRate = `${rate}%`;
    if (rate > 40) { unmatchedColor = '#B91C1C'; unmatchedBg = '#FEE2E2'; }
    else if (rate >= 20) { unmatchedColor = '#92400E'; unmatchedBg = '#FEF3C7'; }
    else { unmatchedColor = '#15803D'; unmatchedBg = '#DCFCE7'; }
  }

  // Avg Views Before Claim
  const claimedCases = cases.filter(c => matchedStatuses.includes(c.status));
  let avgViews = '—';
  if (claimedCases.length > 0) {
    const totalViews = claimedCases.reduce((sum, c) => sum + (c.marketplace_views || 0), 0);
    avgViews = (totalViews / claimedCases.length).toFixed(1);
  }

  // Supply Gaps
  const approvedLawyers = lawyers.filter(l => l.account_status === 'approved');
  const lawyerStateSet = new Set();
  approvedLawyers.forEach(l => (l.states_of_practice || []).forEach(s => lawyerStateSet.add(s)));

  const availableByState = {};
  cases.filter(c => c.status === 'available').forEach(c => {
    const st = normalizeState(c.state);
    if (st) availableByState[st] = (availableByState[st] || 0) + 1;
  });
  const gapCount = Object.entries(availableByState).filter(([st, count]) =>
    count >= 2 && !lawyerStateSet.has(st)
  ).length;
  const gapColor = gapCount === 0 ? '#15803D' : '#B91C1C';
  const gapBg = gapCount === 0 ? '#DCFCE7' : '#FEE2E2';

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <CompactStatCard label="Avg Days to Match" count={avgDaysToMatch} bgColor="var(--surface)" borderColor="var(--slate-200)" icon={Clock} />
      <CompactStatCard label="Unmatched Rate" count={unmatchedRate} bgColor={unmatchedBg} textColor={unmatchedColor} icon={TrendingDown} />
      <CompactStatCard label="Avg Views Before Claim" count={avgViews} bgColor="var(--surface)" borderColor="var(--slate-200)" icon={Eye} />
      <CompactStatCard label="Supply Gaps" count={gapCount} bgColor={gapBg} textColor={gapColor} icon={MapPin} />
    </div>
  );
}