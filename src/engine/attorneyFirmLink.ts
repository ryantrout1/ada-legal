/**
 * attorneyFirmLink — the sync-on-write rule for an attorney's firm.
 *
 * law_firm_id is the source of truth. When an attorney is linked to a firm,
 * their free-text firm_name mirrors that firm's name (so the directory label
 * can never drift from the routing FK). When an attorney is solo (no firm),
 * firm_name stays whatever free text was entered — a solo practitioner can
 * still carry a practice name.
 *
 * Resolved Open Decision #2 of /plan "Firms as a first-class admin surface".
 * Both admin write paths (create + patch) run through this so the rule lives
 * in exactly one, unit-tested place.
 */

export interface FirmLinkInput {
  /** The law_firm_id the admin chose, or null/undefined for "no firm / solo". */
  lawFirmId: string | null | undefined;
  /**
   * The resolved firm (its name) when lawFirmId points at a real, in-org firm;
   * null when solo. The caller resolves + org-checks the firm before calling —
   * if lawFirmId is set but firm is null, we treat it as solo (safe fallback),
   * but callers should 400 on an unresolved firm rather than rely on that.
   */
  firm: { name: string } | null;
  /** The free-text firm name from the form (used only when solo). */
  firmName: string | null | undefined;
}

export interface FirmLinkResult {
  lawFirmId: string | null;
  firmName: string | null;
}

export function resolveAttorneyFirmLink(input: FirmLinkInput): FirmLinkResult {
  if (input.lawFirmId && input.firm) {
    // Linked: firm_name is derived from the firm, not the form.
    return { lawFirmId: input.lawFirmId, firmName: input.firm.name };
  }
  // Solo / no firm: no link; preserve the free-text name (empty → null).
  const freeText = input.firmName?.trim();
  return { lawFirmId: null, firmName: freeText ? freeText : null };
}
