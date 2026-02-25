import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data, old_data } = body;

    if (event?.type !== 'update' || event?.entity_name !== 'Case') {
      return Response.json({ ok: true, skipped: true });
    }

    const oldStatus = old_data?.status;
    const newStatus = data?.status;

    if (newStatus !== 'closed' || oldStatus === 'closed') {
      return Response.json({ ok: true, skipped: true });
    }

    const c = data;

    // Fetch template
    const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ template_key: 'case_closed' }, '-created_date', 1);
    const tpl = templates[0];
    if (!tpl || !tpl.is_active) {
      return Response.json({ ok: true, skipped: true, reason: 'template_inactive' });
    }

    const portalUrl = 'https://app.base44.com/MyCases';
    const variables = {
      reporter_name: c.contact_name || '',
      business_name: c.business_name || '',
      case_url: portalUrl
    };

    let subject = tpl.subject_line || '';
    let emailBody = tpl.body_html || '';
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      subject = subject.split(placeholder).join(value);
      emailBody = emailBody.split(placeholder).join(value);
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: c.contact_email,
      subject,
      body: emailBody
    });

    return Response.json({ ok: true, email_sent: true });
  } catch (error) {
    console.error('onCaseStatusChange error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});