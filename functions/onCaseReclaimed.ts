import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data, old_data } = body;

    if (event?.type !== 'update' || event?.entity_name !== 'Case') {
      return Response.json({ ok: true, skipped: true });
    }

    // Detect reclaim: status went from assigned/in_progress → available, and had a lawyer
    const oldStatus = old_data?.status;
    const newStatus = data?.status;
    const oldLawyerId = old_data?.assigned_lawyer_id;

    const wasAssigned = (oldStatus === 'assigned' || oldStatus === 'in_progress');
    const nowAvailable = newStatus === 'available';

    if (!wasAssigned || !nowAvailable || !oldLawyerId) {
      return Response.json({ ok: true, skipped: true });
    }

    // Get the lawyer profile
    const allLawyers = await base44.asServiceRole.entities.LawyerProfile.filter({}, '-created_date', 500);
    const lawyer = allLawyers.find(l => l.id === oldLawyerId);

    if (!lawyer) {
      return Response.json({ ok: true, skipped: true, reason: 'lawyer_not_found' });
    }

    const c = data;
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
    <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#B91C1C;margin:0 0 24px 0;">Case Reclaimed</h1>
    <div style="font-size:15px;line-height:1.7;">
      <p>Dear ${lawyer.full_name},</p>
      <p>The following case has been <strong>reclaimed</strong> by an administrator due to no contact being logged within the required 24-hour window:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;background-color:#FEF2F2;border-radius:8px;">
        <tr><td style="padding:12px 16px;color:#64748B;font-weight:600;">Business</td><td style="padding:12px 16px;color:#1E293B;font-weight:600;">${c.business_name}</td></tr>
        <tr><td style="padding:12px 16px;color:#64748B;font-weight:600;">Location</td><td style="padding:12px 16px;color:#1E293B;">${[c.city, c.state].filter(Boolean).join(', ')}</td></tr>
        <tr><td style="padding:12px 16px;color:#64748B;font-weight:600;">Type</td><td style="padding:12px 16px;color:#1E293B;">${c.violation_type === 'physical_space' ? 'Physical Space' : 'Digital / Website'}</td></tr>
      </table>
      <p>This case has been returned to the marketplace and is now available for other attorneys to claim.</p>
      <p>Repeated failures to contact claimants within 24 hours may result in account review.</p>
    </div>
    <div style="text-align:center;margin:32px 0 16px 0;">
      <a href="${dashboardUrl}" style="display:inline-block;padding:14px 32px;background-color:#C2410C;color:#fff;font-family:Manrope,Arial,sans-serif;font-size:16px;font-weight:700;text-decoration:none;border-radius:8px;">View My Cases</a>
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
      subject: 'Case Reclaimed — ADA Legal Marketplace',
      body: emailHtml
    });

    return Response.json({ ok: true, email_sent: true });
  } catch (error) {
    console.error('onCaseReclaimed error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});