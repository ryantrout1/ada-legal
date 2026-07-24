/**
 * LitigationRoutingPanel — firm assignment, opt-in, and lead firm.
 *
 * THIS IS THE CONTROL THAT MAKES LANE A WORK, and until M6 there was no
 * UI for it anywhere. The endpoint existed; nothing called it.
 *
 * resolveEligibleRoutingFirm() decides the exclusive handoff like this:
 *   - a firm qualifies only if it is opted in to THIS litigation
 *     (receives_matches) AND clears the eligibility floor
 *   - if the litigation names a lead firm, it routes there, and only
 *     there — never to another firm behind the lead
 *   - with no lead, it routes to the SOLE qualifying firm; zero or more
 *     than one is ambiguous and falls to sourcing rather than guessing
 *
 * So assignment alone routes nothing. Before this panel, every firm the
 * admin assigned defaulted to receives_matches = false, which meant
 * every matched case fell to the sourcing queue no matter how the
 * litigation was configured. The opt-in checkbox is the actual fix; the
 * rest is scaffolding around it.
 *
 * Opt-in is deliberately separate from assignment: recording that a firm
 * is involved in a litigation is not the same as consenting to be handed
 * live claimants, and conflating them would route real people to a firm
 * that never agreed to take them.
 */

import { useCallback, useEffect, useState } from 'react';

interface FirmOption {
  id: string;
  name: string;
}

interface Assignment {
  law_firm_id: string;
  receives_matches: boolean;
}

interface Props {
  litigationId: string;
  leadFirmId: string | null;
  onLeadFirmChange: (firmId: string | null) => void;
}

export default function LitigationRoutingPanel({
  litigationId,
  leadFirmId,
  onLeadFirmChange,
}: Props) {
  const [firms, setFirms] = useState<FirmOption[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading');
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [firmsResp, assignResp] = await Promise.all([
        fetch('/api/admin/firms?page_size=200', { credentials: 'include' }),
        fetch(`/api/admin/litigation/${litigationId}/firms`, { credentials: 'include' }),
      ]);
      if (!firmsResp.ok || !assignResp.ok) throw new Error('load failed');
      const firmsBody = (await firmsResp.json()) as { firms?: FirmOption[] };
      const assignBody = (await assignResp.json()) as {
        assignments?: Assignment[];
        law_firm_ids?: string[];
      };
      setFirms(firmsBody.firms ?? []);
      // Prefer the richer shape; fall back to the legacy id list so this
      // panel still works against an older deployment of the endpoint.
      setAssignments(
        assignBody.assignments ??
          (assignBody.law_firm_ids ?? []).map((id) => ({
            law_firm_id: id,
            receives_matches: false,
          })),
      );
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [litigationId]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleAssigned(firmId: string) {
    setAssignments((prev) =>
      prev.some((a) => a.law_firm_id === firmId)
        ? prev.filter((a) => a.law_firm_id !== firmId)
        : [...prev, { law_firm_id: firmId, receives_matches: false }],
    );
  }

  function toggleOptIn(firmId: string) {
    setAssignments((prev) =>
      prev.map((a) =>
        a.law_firm_id === firmId ? { ...a, receives_matches: !a.receives_matches } : a,
      ),
    );
  }

  async function save() {
    setStatus('saving');
    setMessage(null);
    try {
      const resp = await fetch(`/api/admin/litigation/${litigationId}/firms`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ assignments }),
      });
      if (!resp.ok) throw new Error(String(resp.status));
      setStatus('ready');
      setMessage('Saved.');
    } catch {
      setStatus('error');
      setMessage('Could not save. Nothing was changed.');
    }
  }

  const optedIn = assignments.filter((a) => a.receives_matches);
  const leadIsOptedIn = leadFirmId
    ? optedIn.some((a) => a.law_firm_id === leadFirmId)
    : true;

  // Mirrors resolveEligibleRoutingFirm's decision, minus the eligibility
  // floor (which needs firm records this panel does not load). Shown so
  // the admin can see the routing outcome before saving rather than
  // discovering it when a claimant lands in the wrong queue.
  let routingSummary: string;
  if (optedIn.length === 0) {
    routingSummary = 'No firm is opted in — matched cases will go to the sourcing queue.';
  } else if (leadFirmId && !leadIsOptedIn) {
    routingSummary =
      'The lead firm is not opted in — matched cases will go to sourcing rather than to another firm.';
  } else if (leadFirmId) {
    routingSummary = 'Matched cases route exclusively to the lead firm.';
  } else if (optedIn.length === 1) {
    routingSummary = 'Matched cases route exclusively to the single opted-in firm.';
  } else {
    routingSummary = `${optedIn.length} firms are opted in with no lead named — this is ambiguous, so matched cases will go to sourcing.`;
  }

  if (status === 'loading') {
    return <p className="text-sm text-ink-500">Loading routing…</p>;
  }

  return (
    <section className="rounded-lg border border-surface-200 bg-white p-4">
      <h2 className="font-display text-lg text-ink-900 mb-1">Routing</h2>
      <p className="text-sm text-ink-700 mb-4">
        Which firms are on this litigation, and which of them receive matched
        claimants.
      </p>

      <table className="w-full text-sm border-collapse">
        <caption className="sr-only">Firm assignment and match opt-in</caption>
        <thead>
          <tr className="text-left">
            <th scope="col" className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-500 pb-2">Firm</th>
            <th scope="col" className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-500 pb-2 w-24">Assigned</th>
            <th scope="col" className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-500 pb-2 w-32">Receives matches</th>
            <th scope="col" className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-500 pb-2 w-24">Lead</th>
          </tr>
        </thead>
        <tbody>
          {firms.map((firm) => {
            const assigned = assignments.find((a) => a.law_firm_id === firm.id);
            return (
              <tr key={firm.id} className="border-t border-surface-200">
                <td className="py-2 text-ink-900">{firm.name}</td>
                <td className="py-2">
                  <input
                    type="checkbox"
                    className="w-[22px] h-[22px]"
                    checked={Boolean(assigned)}
                    onChange={() => toggleAssigned(firm.id)}
                    aria-label={`Assign ${firm.name} to this litigation`}
                  />
                </td>
                <td className="py-2">
                  <input
                    type="checkbox"
                    className="w-[22px] h-[22px]"
                    checked={assigned?.receives_matches ?? false}
                    disabled={!assigned}
                    onChange={() => toggleOptIn(firm.id)}
                    aria-label={`${firm.name} receives matched claimants`}
                  />
                </td>
                <td className="py-2">
                  <input
                    type="radio"
                    name="lead-firm"
                    className="w-[22px] h-[22px]"
                    checked={leadFirmId === firm.id}
                    disabled={!assigned}
                    onChange={() => onLeadFirmChange(firm.id)}
                    aria-label={`${firm.name} is lead counsel`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p role="status" className="text-sm text-ink-700 mt-4 mb-3">
        {routingSummary}
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={status === 'saving'}
          className="min-h-[44px] px-4 rounded-md bg-accent-600 text-white text-sm font-medium disabled:opacity-60"
        >
          {status === 'saving' ? 'Saving…' : 'Save routing'}
        </button>
        {leadFirmId && (
          <button
            type="button"
            onClick={() => onLeadFirmChange(null)}
            className="min-h-[44px] px-4 rounded-md border border-surface-300 text-ink-700 text-sm"
          >
            Clear lead
          </button>
        )}
        {message && <span className="text-sm text-ink-700">{message}</span>}
      </div>
    </section>
  );
}
