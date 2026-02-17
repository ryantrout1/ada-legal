import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get cases approved in the last ~24 hours that are still available
    const availableCases = await base44.asServiceRole.entities.Case.filter({ status: 'available' }, '-approved_at', 500);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const newCases = availableCases.filter(c => c.approved_at && c.approved_at >= twentyFourHoursAgo);

    if (newCases.length === 0) {
      return Response.json({ ok: true, digest_sent: false, reason: 'no_new_cases' });
    }

    // Get active lawyers
    const allLawyers = await base44.asServiceRole.entities.LawyerProfile.filter({ subscription_status: 'active' }, '-created_date', 500);
    const activeLawyers = allLawyers.filter(l => l.account_status === 'approved');

    if (activeLawyers.length === 0) {
      return Response.json({ ok: true, digest_sent: false, reason: 'no_active_lawyers' });
    }

    const marketplaceUrl = 'https://app.base44.com/Marketplace';

    // Build case summary rows
    const statesInvolved = [...new Set(newCases.map(c => c.state).filter(Boolean))];
    const physicalCount = newCases.filter(c => c.violation_type === 'physical_space').length;
    const digitalCount = newCases.filter(c => c.violation_type === 'digital_website').length;

    const caseRows = newCases.slice(0, 10).map(c => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;color:#1E293B;font-weight:600;">${c.business_name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;color:#64748B;">${c.violation_type === 'physical_space' ? 'Physical' : 'Digital'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;color:#64748B;">${[c.city, c.state].filter(Boolean).join(', ')}</td>
      </tr>
    `).join('');

    const moreText = newCases.length > 10 ? `<p style="color:#64748B;font-style:italic;">…and ${newCases.length - 10} more. View all in the marketplace.</p>` : '';

    let sent = 0;

    for (const lawyer of activeLawyers) {
      // Filter to cases matching lawyer's states
      const lawyerStates = lawyer.states_of_practice || [];
      const matchingCases = newCases.filter(c => lawyerStates.includes(c.state));

      // Send even if no state match — they can still see all cases; but highlight match count
      const matchNote = matchingCases.length > 0
        ? `<p><strong>${matchingCases.length}</strong> of these cases are in your licensed states (${lawyerStates.join(', ')}).</p>`
        : `<p>None of today's new cases are in your licensed states, but you can still browse all available cases.</p>`;

      const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#FAF7F2;font-family:Manrope,Arial,sans-serif;color:#334155;">
<div style="max-width:600px;margin:0 auto;">
  <div style="background-color:#1E293B;padding:24px 32px;text-align:center;">
    <span style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#fff;">⚖️ ADA Legal</span>
  </div>
  <div style="background-color:#fff;padding:40px 32px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
    <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#1E293B;margin:0 0 24px 0;">Daily New Cases Digest</h1>
    <div style="font-size:15px;line-height:1.7;">
      <p>Dear ${lawyer.full_name},</p>
      <p><strong>${newCases.length} new case${newCases.length === 1 ? '' : 's'}</strong> became available in the last 24 hours.</p>
      ${matchNote}
      <div style="margin:8px 0;font-size:13px;color:#64748B;">
        ${physicalCount > 0 ? `<span style="display:inline-block;padding:4px 10px;background:#DBEAFE;color:#1D4ED8;border-radius:12px;margin:2px 4px 2px 0;font-weight:600;">${physicalCount} Physical</span>` : ''}
        ${digitalCount > 0 ? `<span style="display:inline-block;padding:4px 10px;background:#F3E8FF;color:#7C3AED;border-radius:12px;margin:2px 4px 2px 0;font-weight:600;">${digitalCount} Digital</span>` : ''}
      </div>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr style="background-color:#F8FAFC;">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748B;font-weight:700;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Business</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748B;font-weight:700;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Type</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748B;font-weight:700;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Location</th>
          </tr>
        </thead>
        <tbody>
          ${caseRows}
        </tbody>
      </table>
      ${moreText}
    </div>
    <div style="text-align:center;margin:32px 0 16px 0;">
      <a href="${marketplaceUrl}" style="display:inline-block;padding:14px 32px;background-color:#C2410C;color:#fff;font-family:Manrope,Arial,sans-serif;font-size:16px;font-weight:700;text-decoration:none;border-radius:8px;">Browse Available Cases</a>
    </div>
  </div>
  <div style="background-color:#1E293B;padding:20px 32px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#94A3B8;">© 2026 ADA Legal Marketplace. All rights reserved.</p>
    <p style="margin:6px 0 0 0;font-size:12px;color:#94A3B8;">Connecting people with experienced ADA attorneys.</p>
    <p style="margin:10px 0 0 0;font-size:11px;color:#64748B;font-style:italic;">This platform is not a law firm and does not provide legal advice.</p>
  </div>
</div>
</body>
</html>`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: lawyer.email,
        subject: 'New Cases Available — ADA Legal Marketplace',
        body: emailHtml
      });

      sent++;
    }

    return Response.json({ ok: true, digest_sent: true, lawyers_notified: sent, new_cases: newCases.length });
  } catch (error) {
    console.error('dailyNewCasesDigest error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});