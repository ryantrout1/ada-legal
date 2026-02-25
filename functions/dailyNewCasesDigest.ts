import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const availableCases = await base44.asServiceRole.entities.Case.filter({ status: 'available' }, '-approved_at', 500);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const newCases = availableCases.filter(c => c.approved_at && c.approved_at >= twentyFourHoursAgo);

    if (newCases.length === 0) {
      return Response.json({ ok: true, digest_sent: false, reason: 'no_new_cases' });
    }

    const allLawyers = await base44.asServiceRole.entities.LawyerProfile.filter({ subscription_status: 'active' }, '-created_date', 500);
    const activeLawyers = allLawyers.filter(l => l.account_status === 'approved');

    if (activeLawyers.length === 0) {
      return Response.json({ ok: true, digest_sent: false, reason: 'no_active_lawyers' });
    }

    // Fetch template
    const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ template_key: 'daily_digest' }, '-created_date', 1);
    const tpl = templates[0];
    if (!tpl || !tpl.is_active) {
      return Response.json({ ok: true, digest_sent: false, reason: 'template_inactive' });
    }

    const marketplaceUrl = 'https://app.base44.com/Marketplace';
    const physicalCount = newCases.filter(c => c.violation_type === 'physical_space').length;
    const digitalCount = newCases.filter(c => c.violation_type === 'digital_website').length;

    const caseRows = newCases.slice(0, 10).map(c => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;color:#1E293B;font-weight:600;">${c.business_name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;color:#64748B;">${c.violation_type === 'physical_space' ? 'Physical' : 'Digital'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;color:#64748B;">${[c.city, c.state].filter(Boolean).join(', ')}</td>
      </tr>
    `).join('');

    const caseTable = `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <thead><tr style="background-color:#F8FAFC;">
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748B;font-weight:700;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Business</th>
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748B;font-weight:700;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Type</th>
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748B;font-weight:700;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Location</th>
      </tr></thead><tbody>${caseRows}</tbody></table>`;

    const moreText = newCases.length > 10 ? `<p style="color:#64748B;font-style:italic;">…and ${newCases.length - 10} more. View all available cases.</p>` : '';

    const typeBadges = [
      physicalCount > 0 ? `<span style="display:inline-block;padding:4px 10px;background:#DBEAFE;color:#1D4ED8;border-radius:12px;margin:2px 4px 2px 0;font-weight:600;">${physicalCount} Physical</span>` : '',
      digitalCount > 0 ? `<span style="display:inline-block;padding:4px 10px;background:#F3E8FF;color:#7C3AED;border-radius:12px;margin:2px 4px 2px 0;font-weight:600;">${digitalCount} Digital</span>` : ''
    ].filter(Boolean).join('');

    let sent = 0;

    for (const lawyer of activeLawyers) {
      const lawyerStates = lawyer.states_of_practice || [];
      const matchingCases = newCases.filter(c => lawyerStates.includes(c.state));

      const stateMatchNote = matchingCases.length > 0
        ? `<p><strong>${matchingCases.length}</strong> of these cases are in your licensed states (${lawyerStates.join(', ')}).</p>`
        : `<p>None of today's new cases are in your licensed states, but you can still browse all available cases.</p>`;

      const variables = {
        attorney_name: lawyer.full_name || '',
        new_case_count: String(newCases.length),
        new_case_plural: newCases.length === 1 ? '' : 's',
        state_match_note: stateMatchNote,
        type_badges: typeBadges,
        case_table: caseTable,
        more_text: moreText,
        browse_url: marketplaceUrl
      };

      let subject = tpl.subject_line || '';
      let emailBody = tpl.body_html || '';
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        subject = subject.split(placeholder).join(value);
        emailBody = emailBody.split(placeholder).join(value);
      }

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: lawyer.email,
        subject,
        body: emailBody
      });

      sent++;
    }

    return Response.json({ ok: true, digest_sent: true, lawyers_notified: sent, new_cases: newCases.length });
  } catch (error) {
    console.error('dailyNewCasesDigest error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});