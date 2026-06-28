/**
 * newMatterInput — pure parse/validate for the "Add a matter" POST body.
 *
 * The attorney-facing create form (POST /api/portal/cases) sends a small,
 * flat body. Client name is the one required field — everything else is
 * optional and trimmed. Kept pure (no DB, no HTTP) so the validation is unit-
 * testable and the Vercel handler stays thin.
 *
 * Note on "no forms": ADALL's no-forms rule governs *claimant* intake (Ada is
 * the front door). An attorney creating their own matter is workspace CRUD —
 * a form is the right tool here and does not touch the claimant front door.
 *
 * Ref: /plan "Add a matter" Phase 1 (acceptance criterion 5).
 */

export interface NewMatterInput {
  client: { name: string; email: string | null; phone: string | null };
  classificationTitle: string | null;
  jurisdictionState: string | null;
  defendant: { name: string } | null;
  openingNote: string | null;
}

export type ParseNewMatterResult =
  | { ok: true; value: NewMatterInput }
  | { ok: false; error: string };

/** Trim a value to a non-empty string, or null. Non-strings become null. */
function cleanOptional(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t;
}

export function parseNewMatterInput(body: unknown): ParseNewMatterResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'A client name is required.' };
  }
  const b = body as Record<string, unknown>;

  const name = cleanOptional(b.clientName);
  if (name === null) {
    return { ok: false, error: 'A client name is required.' };
  }

  const defendantName = cleanOptional(b.defendantName);

  return {
    ok: true,
    value: {
      client: {
        name,
        email: cleanOptional(b.clientEmail),
        phone: cleanOptional(b.clientPhone),
      },
      classificationTitle: cleanOptional(b.classificationTitle),
      jurisdictionState: cleanOptional(b.jurisdictionState),
      defendant: defendantName === null ? null : { name: defendantName },
      openingNote: cleanOptional(b.note),
    },
  };
}
