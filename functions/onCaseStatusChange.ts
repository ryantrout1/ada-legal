import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data, old_data } = body;

    // Only handle update events on Case entity
    if (event?.type !== 'update' || event?.entity_name !== 'Case') {
      return Response.json({ ok: true, skipped: true });
    }

    // Only fire when status changed to 'closed'
    const oldStatus = old_data?.status;
    const newStatus = data?.status;

    if (newStatus !== 'closed' || oldStatus === 'closed') {
      return Response.json({ ok: true, skipped: true });
    }

    const c = data;
    const portalUrl = 'https://app.base44.com/MyCases'; // fallback

    // Build branded email HTML inline (can't import frontend modules in Deno)
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: Manrope, Arial, sans-serif; color: #334155;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="background-color: #1E293B; padding: 24px 32px; text-align: center;">
      <span style="font-family: Georgia, serif; font-size: 22px; font-weight: 700; color: #ffffff;">⚖️ ADA Legal</span>
    </div>
    <div style="background-color: #ffffff; padding: 40px 32px; border-left: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0;">
      <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: #1E293B; margin: 0 0 24px 0;">Your Case Has Been Closed</h1>
      <div style="font-size: 15px; line-height: 1.7;">
        <p>Dear ${c.contact_name},</p>
        <p>Your ADA violation case regarding <strong>${c.business_name}</strong> has been closed.</p>
        <p>If you have any questions about the outcome or need further assistance, please don't hesitate to reach out by replying to this email.</p>
        <p>Thank you for using ADA Legal Link.</p>
      </div>
      <div style="text-align: center; margin: 32px 0 16px 0;">
        <a href="${portalUrl}" style="display: inline-block; padding: 14px 32px; background-color: #C2410C; color: #ffffff; font-family: Manrope, Arial, sans-serif; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 8px;">View Case Summary</a>
      </div>
    </div>
    <div style="background-color: #1E293B; padding: 20px 32px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #94A3B8;">© 2026 ADA Legal Link. All rights reserved.</p>
      <p style="margin: 6px 0 0 0; font-size: 12px; color: #94A3B8;">Connecting people with experienced ADA attorneys.</p>
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #64748B; font-style: italic;">This platform is not a law firm and does not provide legal advice.</p>
    </div>
  </div>
</body>
</html>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: c.contact_email,
      subject: 'ADA Legal Link — Case Closed',
      body: emailHtml
    });

    return Response.json({ ok: true, email_sent: true });
  } catch (error) {
    console.error('onCaseStatusChange error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});