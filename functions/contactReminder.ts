import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const assignedCases = await base44.asServiceRole.entities.Case.filter({ status: 'assigned' }, '-assigned_at', 500);

    const now = Date.now();
    const TWENTY_TWO_HOURS = 22 * 60 * 60 * 1000;
    const TWENTY_FIVE_HOURS = 25 * 60 * 60 * 1000;

    const dueCases = assignedCases.filter(c => {
      if (!c.assigned_at || c.contact_logged_at) return false;
      const elapsed = now - new Date(c.assigned_at).getTime();
      return elapsed >= TWENTY_TWO_HOURS && elapsed < TWENTY_FIVE_HOURS;
    });

    if (dueCases.length === 0) {
      return Response.json({ ok: true, reminders_sent: 0 });
    }

    // Fetch template
    const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ template_key: 'contact_reminder' }, '-created_date', 1);
    const tpl = templates[0];
    if (!tpl || !tpl.is_active) {
      return Response.json({ ok: true, reminders_sent: 0, reason: 'template_inactive' });
    }

    const allLawyers = await base44.asServiceRole.entities.LawyerProfile.filter({}, '-created_date', 500);
    const lawyerMap = {};
    for (const l of allLawyers) {
      lawyerMap[l.id] = l;
    }

    let sent = 0;

    for (const c of dueCases) {
      const lawyer = lawyerMap[c.assigned_lawyer_id];
      if (!lawyer) continue;

      const variables = {
        attorney_name: lawyer.full_name || '',
        business_name: c.business_name || '',
        case_location: [c.city, c.state].filter(Boolean).join(', '),
        assigned_at: new Date(c.assigned_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
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

      sent++;
    }

    return Response.json({ ok: true, reminders_sent: sent });
  } catch (error) {
    console.error('contactReminder error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});