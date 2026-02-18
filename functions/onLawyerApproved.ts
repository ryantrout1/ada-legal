import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data, old_data } = body;

    if (event?.type !== 'update' || event?.entity_name !== 'LawyerProfile') {
      return Response.json({ ok: true, skipped: true });
    }

    const oldStatus = old_data?.account_status;
    const newStatus = data?.account_status;

    if (newStatus !== 'approved' || oldStatus === 'approved') {
      return Response.json({ ok: true, skipped: true });
    }

    const subscribeUrl = 'https://app.base44.com/LawyerSubscription';

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
    <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#15803D;margin:0 0 24px 0;">Welcome to ADA Legal Connect</h1>
    <div style="font-size:15px;line-height:1.7;">
      <p>Dear ${data.full_name},</p>
      <p>Congratulations — your attorney account has been <strong>approved</strong>! You are now eligible to access ADA Legal Connect and initiate support for ADA violation cases in your licensed states.</p>
      <p><strong>Next step:</strong> Activate your subscription to start browsing and claiming cases.</p>
    </div>
    <div style="text-align:center;margin:32px 0 16px 0;">
      <a href="${subscribeUrl}" style="display:inline-block;padding:14px 32px;background-color:#C2410C;color:#fff;font-family:Manrope,Arial,sans-serif;font-size:16px;font-weight:700;text-decoration:none;border-radius:8px;">Activate Subscription</a>
    </div>
    <div style="font-size:14px;line-height:1.7;">
      <p><strong>What you can expect:</strong></p>
      <ul style="padding-left:20px;">
        <li>Browse ADA violation cases filtered to your licensed states</li>
        <li>Initiate support and receive full claimant details</li>
        <li>Log contacts and track case progress from your dashboard</li>
      </ul>
    </div>
  </div>
  <div style="background-color:#1E293B;padding:20px 32px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#94A3B8;">© 2026 ADA Legal Connect. All rights reserved.</p>
    <p style="margin:6px 0 0 0;font-size:12px;color:#94A3B8;">Connecting people with experienced ADA attorneys.</p>
    <p style="margin:10px 0 0 0;font-size:11px;color:#64748B;font-style:italic;">This platform is not a law firm and does not provide legal advice.</p>
  </div>
</div>
</body>
</html>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: data.email,
      subject: 'Welcome to ADA Legal Connect',
      body: emailHtml
    });

    return Response.json({ ok: true, email_sent: true });
  } catch (error) {
    console.error('onLawyerApproved error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});