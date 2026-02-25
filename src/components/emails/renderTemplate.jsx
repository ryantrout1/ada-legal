import { base44 } from '@/api/base44Client';

/**
 * Fetches an EmailTemplate by key, replaces merge variables, and returns { subject, body } or null if inactive/not found.
 * @param {string} templateKey - e.g. "report_submitted"
 * @param {Record<string, string>} variables - merge variables like { reporter_name: "John" }
 * @returns {Promise<{ subject: string, body: string } | null>}
 */
export async function renderEmailTemplate(templateKey, variables = {}) {
  const templates = await base44.entities.EmailTemplate.filter({ template_key: templateKey }, '-created_date', 1);
  const tpl = templates[0];
  if (!tpl || !tpl.is_active) return null;

  let subject = tpl.subject_line || '';
  let body = tpl.body_html || '';

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const safeValue = value ?? '';
    subject = subject.split(placeholder).join(safeValue);
    body = body.split(placeholder).join(safeValue);
  }

  return { subject, body };
}