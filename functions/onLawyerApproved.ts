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

    // Fetch template
    const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ template_key: 'lawyer_approved' }, '-created_date', 1);
    const tpl = templates[0];
    if (!tpl || !tpl.is_active) {
      return Response.json({ ok: true, skipped: true, reason: 'template_inactive' });
    }

    const subscribeUrl = 'https://app.base44.com/LawyerSubscription';
    const variables = {
      attorney_name: data.full_name || '',
      subscribe_url: subscribeUrl
    };

    let subject = tpl.subject_line || '';
    let emailBody = tpl.body_html || '';
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      subject = subject.split(placeholder).join(value);
      emailBody = emailBody.split(placeholder).join(value);
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: data.email,
      subject,
      body: emailBody
    });

    return Response.json({ ok: true, email_sent: true });
  } catch (error) {
    console.error('onLawyerApproved error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});