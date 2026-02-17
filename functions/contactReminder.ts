import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Find cases that are assigned, no contact logged, and assigned ~22 hours ago
    const assignedCases = await base44.asServiceRole.entities.Case.filter({ status: 'assigned' }, '-assigned_at', 500);

    const now = Date.now();
    const TWENTY_TWO_HOURS = 22 * 60 * 60 * 1000;
    const TWENTY_FIVE_HOURS = 25 * 60 * 60 * 1000;

    // Filter to cases assigned 22-25 hours ago with no contact logged
    const dueCases = assignedCases.filter(c => {
      if (!c.assigned_at || c.contact_logged_at) return false;
      const elapsed = now - new Date(c.assigned_at).getTime();
      return elapsed >= TWENTY_TWO_HOURS && elapsed < TWENTY_FIVE_HOURS;
    });

    if (dueCases.length === 0) {
      return Response.json({ ok: true, reminders_sent: 0 });
    }

    // Get all lawyer profiles for the assigned cases
    const lawyerIds = [...new Set(dueCases.map(c => c.assigned_lawyer_id).filter(Boolean))];
    const allLawyers = await base44.asServiceRole.entities.LawyerProfile.filter({}, '-created_date', 500);
    const lawyerMap = {};
    for (const l of allLawyers) {
      lawyerMap[l.id] = l;
    }

    let sent = 0;

    for (const c of dueCases) {
      const lawyer = lawyerMap[c.assigned_lawyer_id];
      if (!lawyer) continue;

      const dashboardUrl = 'https://app.base44.com/LawyerDashboard';

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
    <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#D97706;margin:0 0 24px 0;">24-Hour Contact Reminder</h1>
    <div style="font-size:15px;line-height:1.7;">
      <p>Dear ${lawyer.full_name},</p>
      <p>This is a reminder that you have not yet logged contact for the following case:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;background-color:#FEF3C7;border-radius:8px;">
        <tr><td style="padding:12px 16px;color:#64748B;font-weight:600;">Business</td><td style="padding:12px 16px;color:#1E293B;font-weight:600;">${c.business_name}</td></tr>
        <tr><td style="padding:12px 16px;color:#64748B;font-weight:600;">Location</td><td style="padding:12px 16px;color:#1E293B;">${[c.city, c.state].filter(Boolean).join(', ')}</td></tr>
        <tr><td style="padding:12px 16px;color:#64748B;font-weight:600;">Assigned</td><td style="padding:12px 16px;color:#1E293B;">${new Date(c.assigned_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</td></tr>
      </table>
      <div style="background-color:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;font-weight:600;color:#991B1B;">⚠️ Action Required</p>
        <p style="margin:8px 0 0 0;color:#7F1D1D;">You are required to contact the claimant within <strong>24 hours</strong> of initiation. Failure to do so may result in the case being reclaimed and reassigned.</p>
      </div>
    </div>
    <div style="text-align:center;margin:32px 0 16px 0;">
      <a href="${dashboardUrl}" style="display:inline-block;padding:14px 32px;background-color:#C2410C;color:#fff;font-family:Manrope,Arial,sans-serif;font-size:16px;font-weight:700;text-decoration:none;border-radius:8px;">Log Contact Now</a>
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
        subject: '24-Hour Contact Reminder — ADA Legal Marketplace',
        body: emailHtml
      });

      sent++;
    }

    return Response.json({ ok: true, reminders_sent: sent });
  } catch (error) {
    console.error('contactReminder error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});