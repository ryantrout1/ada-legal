// Shared documentation score logic
export function calculateDocScore(c) {
  const criteria = [
    { key: 'narrative', label: 'Detailed Narrative', description: 'The claimant provided a description of 50 or more characters explaining what happened.', met: !!(c.narrative && c.narrative.trim().length >= 50) },
    { key: 'address', label: 'Location Identified', description: 'A street address for the business or location was provided.', met: !!(c.street_address && c.street_address.trim()) },
    { key: 'date', label: 'Incident Date Recorded', description: 'The claimant specified when the violation occurred.', met: !!c.incident_date },
    { key: 'visited', label: 'Visit History', description: 'The claimant indicated whether they had visited the location before.', met: !!c.visited_before },
    { key: 'specifics', label: 'Violation Specifics', description: c.violation_type === 'digital_website' ? 'For digital violations: the assistive technologies affected were specified.' : 'For physical violations: the specific subtype (parking, entrance, restroom, etc.) was identified.', met: c.violation_type === 'digital_website' ? !!(c.assistive_tech && c.assistive_tech.length > 0) : !!c.violation_subtype },
    { key: 'contact', label: 'Contact Preference Stated', description: 'The claimant indicated their preferred method of contact (phone, email, etc.).', met: !!c.contact_preference },
  ];
  const score = criteria.filter(cr => cr.met).length;
  let label, color;
  if (score >= 5) { label = 'Well Documented'; color = '#15803D'; }
  else if (score >= 3) { label = 'Moderate Detail'; color = 'var(--slate-600)'; }
  else { label = 'Limited Detail'; color = '#B45309'; }
  return { criteria, score, label, color };
}

export function getFreshness(c) {
  const approvedDate = c.approved_at ? new Date(c.approved_at) : null;
  if (!approvedDate) return { type: 'normal', daysAgo: 0 };
  const daysAgo = Math.floor((Date.now() - approvedDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysAgo <= 7) return { type: 'new', daysAgo };
  if (daysAgo <= 30) return { type: 'normal', daysAgo };
  return { type: 'old', daysAgo };
}