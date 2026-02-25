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
    const oldLawyerId = old_data?.assigned_lawyer_id;

    const wasAssigned = (oldStatus === 'assigned' || oldStatus === 'in_progress');
    const nowAvailable = newStatus === 'available';

    if (!wasAssigned || !nowAvailable || !oldLawyerId) {
      return Response.json({ ok: true, skipped: true });
    }

    const allLawyers = await base44.asServiceRole.entities.LawyerProfile.filter({}, '-created_date', 500);
    const lawyer = allLawyers.find(l => l.id === oldLawyerId);

    if (!lawyer) {
      return Response.json({ ok: true, skipped: true, reason: 'lawyer_not_found' });
    }

    // Fetch template
    const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ template_key: 'case_reclaimed' }, '-created_date', 1);
    const tpl = templates[0];
    if (!tpl || !tpl.is_active) {
      return Response.json({ ok: true, skipped: true, reason: 'template_inactive' });
    }

    const c = data;
    const variables = {
      attorney_name: lawyer.full_name || '',
      business_name: c.business_name || '',
      case_location: [c.city, c.state].filter(Boolean).join(', '),
      violation_type: c.violation_type === 'physical_space' ? 'Physical Space' : 'Digital / Website',
      dashboard_url: 'https://app.base44.com/LawyerDashboard'
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

    return Response.json({ ok: true, email_sent: true });
  } catch (error) {
    console.error('onCaseReclaimed error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});