/**
 * Routing notification orchestrators (Phase 1c).
 *
 * Two send points:
 *   - sendConsentNotifications — firm + claimant emails, fired on first consent
 *     for a routed_firm case (from the consent endpoint).
 *   - sendAdminRoutingNotification — admin email, fired when a sourcing /
 *     general_queue case is created (from createCaseForSession).
 *
 * Both are best-effort: every send is soft-failed (a Resend outage or missing
 * config never throws), and the outcome is recorded as a NOTIFIED case_activity
 * receipt so deliverability is auditable. Dedupe is structural — the callers
 * fire these only on first-consent / fresh-create, so there is no outbox.
 *
 * Ref: /plan Phase 1c.
 */

import type { EmailClient, DbClient, CaseRow, LawFirmRow } from '../clients/types.js';
import type { ExtractedFields } from '../../types/db.js';
import type { RenderedEmail } from '../handoff/emailTemplates.js';
import { extractContactEmail } from '../handoff/selfHelpEmail.js';
import {
  renderFirmMatchedEmail,
  renderUserConnectedEmail,
  renderAdminRoutingEmail,
} from './routingEmailTemplates.js';

interface ConsentNotifyDeps {
  email: EmailClient;
  db: DbClient;
}
interface AdminNotifyDeps {
  email: EmailClient;
  db: DbClient;
  adminEmail: string | null | undefined;
}

function fieldStr(fields: ExtractedFields, key: string): string | null {
  const v = fields[key]?.value;
  return v == null ? null : typeof v === 'string' ? v : String(v);
}

/** Send one email, swallowing transport errors. Returns true on success. */
async function softSend(email: EmailClient, to: string, r: RenderedEmail): Promise<boolean> {
  try {
    await email.send({ to, subject: r.subject, html: r.html, text: r.text });
    return true;
  } catch (err) {
    console.error('routing notification send failed', err);
    return false;
  }
}

/**
 * Firm + claimant notifications for a consented routed_firm case. Each
 * recipient is independent: a missing address or a failed send skips that one
 * and is noted in the receipt; the other still goes out.
 */
export async function sendConsentNotifications(
  deps: ConsentNotifyDeps,
  caseRow: CaseRow,
  readoutUrl: string,
): Promise<void> {
  const recipients: string[] = [];
  const skipped: string[] = [];

  // Firm.
  let firm: LawFirmRow | null = null;
  if (caseRow.firmId) firm = await deps.db.readLawFirmById(caseRow.firmId);
  const firmName = firm?.name ?? null;

  // Claimant (loaded once, also used for the firm email's name line).
  const session = caseRow.adaSessionId
    ? await deps.db.readSession({ sessionId: caseRow.adaSessionId })
    : null;
  const claimantName = session ? fieldStr(session.extractedFields, 'claimant_name') : null;
  const userEmail = session ? extractContactEmail(session.extractedFields) : null;

  const firmEmail = firm?.email ?? null;
  if (firmEmail && firmName) {
    const ok = await softSend(
      deps.email,
      firmEmail,
      renderFirmMatchedEmail({ caseRow, firmName, claimantName }),
    );
    if (ok) recipients.push(`firm:${firmEmail}`);
    else skipped.push('firm:send_failed');
  } else {
    skipped.push('firm:no_email');
  }

  if (userEmail) {
    const ok = await softSend(
      deps.email,
      userEmail,
      renderUserConnectedEmail({ caseRow, firmName, readoutUrl }),
    );
    if (ok) recipients.push(`user:${userEmail}`);
    else skipped.push('user:send_failed');
  } else {
    skipped.push('user:no_email');
  }

  await deps.db.appendCaseActivity({
    caseId: caseRow.id,
    actorType: 'system',
    eventType: 'NOTIFIED',
    summary: `consent notifications (${recipients.length} sent, ${skipped.length} skipped)`,
    metadata: { recipients, skipped },
  });
}

/**
 * Admin notification for a sourcing / general_queue case at routing time.
 * Lane-guarded; skips (with a receipt) when no admin recipient is configured.
 */
export async function sendAdminRoutingNotification(
  deps: AdminNotifyDeps,
  caseRow: CaseRow,
): Promise<void> {
  if (caseRow.lane !== 'sourcing' && caseRow.lane !== 'general_queue') return;

  if (!deps.adminEmail) {
    await deps.db.appendCaseActivity({
      caseId: caseRow.id,
      actorType: 'system',
      eventType: 'NOTIFIED',
      summary: 'admin notification skipped (no recipient configured)',
      metadata: { skipped: ['admin:no_recipient'] },
    });
    return;
  }

  const ok = await softSend(deps.email, deps.adminEmail, renderAdminRoutingEmail({ caseRow }));
  await deps.db.appendCaseActivity({
    caseId: caseRow.id,
    actorType: 'system',
    eventType: 'NOTIFIED',
    summary: ok ? 'admin notified' : 'admin notification failed',
    metadata: ok ? { recipients: [`admin:${deps.adminEmail}`] } : { skipped: ['admin:send_failed'] },
  });
}
