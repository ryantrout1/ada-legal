/**
 * PortalNewMatter — create a self-originated matter (/portal/cases/new).
 *
 * The attorney-facing form for a matter handled directly (no Ada intake, no
 * routing). Posts to POST /api/portal/cases and lands on the new matter's
 * detail page. A dedicated route — not a modal — so keyboard and assistive-tech
 * users get native back/forward and no focus trap.
 *
 * AAA: native <form> + labels, 44px controls, visible focus, role="alert"
 * errors, and the required field marked in text (not by colour alone).
 *
 * Ref: /plan "Add a matter" Phase 2.
 */

import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createMatter, PortalApiError } from '../../data/portalClient.js';

const INPUT =
  'w-full min-h-[44px] rounded-md border border-control-border bg-white px-3 text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
const BTN =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-md text-sm font-semibold border border-accent-500 bg-accent-500 text-white hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60';
const BTN_SECONDARY =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-md text-sm font-semibold border border-control-border bg-white text-ink-900 hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60';

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-700 mb-1">
        {label}
        {required && <span className="text-danger-500"> (required)</span>}
        {hint && <span className="font-normal text-ink-500"> · {hint}</span>}
      </label>
      {children}
    </div>
  );
}

export default function PortalNewMatter() {
  const navigate = useNavigate();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [barrier, setBarrier] = useState('');
  const [state, setState] = useState('');
  const [defendant, setDefendant] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    setError(null);
    if (!clientName.trim()) {
      setError("Add the client's name to create the matter.");
      nameRef.current?.focus();
      return;
    }
    setBusy(true);
    try {
      const { case_id } = await createMatter({
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        classificationTitle: barrier.trim() || undefined,
        jurisdictionState: state.trim() || undefined,
        defendantName: defendant.trim() || undefined,
        note: note.trim() || undefined,
      });
      navigate(`/portal/cases/${case_id}`);
    } catch (e) {
      setError(e instanceof PortalApiError ? e.message : 'Could not create the matter. Please try again.');
      setBusy(false);
    }
  };

  return (
    <section>
      <header className="mb-6">
        <Link
          to="/portal/board"
          className="text-sm font-medium text-accent-500 hover:text-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          ← My matters
        </Link>
        <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mt-2 mb-1">New matter</h1>
        <p className="text-ink-500 text-sm">
          Add a client you’re representing directly. It goes straight to your pipeline — no intake required.
        </p>
      </header>

      <form className="max-w-xl space-y-5" onSubmit={(e) => { e.preventDefault(); void submit(); }} noValidate>
        {error && (
          <div role="alert" className="rounded-md border border-danger-500 bg-danger-50 px-3 py-2 text-sm text-danger-500">
            {error}
          </div>
        )}

        <Field label="Client name" htmlFor="nm-client" required>
          <input
            ref={nameRef}
            id="nm-client"
            className={INPUT}
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Client email" htmlFor="nm-email" hint="optional">
            <input
              id="nm-email"
              type="email"
              className={INPUT}
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </Field>
          <Field label="Client phone" htmlFor="nm-phone" hint="optional">
            <input
              id="nm-phone"
              type="tel"
              className={INPUT}
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Barrier or matter type" htmlFor="nm-barrier" hint="optional, e.g. No accessible entrance">
          <input id="nm-barrier" className={INPUT} value={barrier} onChange={(e) => setBarrier(e.target.value)} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Jurisdiction" htmlFor="nm-state" hint="optional, e.g. AZ">
            <input id="nm-state" className={INPUT} value={state} onChange={(e) => setState(e.target.value)} maxLength={20} />
          </Field>
          <Field label="Defendant" htmlFor="nm-defendant" hint="optional, business or entity">
            <input id="nm-defendant" className={INPUT} value={defendant} onChange={(e) => setDefendant(e.target.value)} />
          </Field>
        </div>

        <Field label="Opening note" htmlFor="nm-note" hint="optional">
          <textarea
            id="nm-note"
            rows={3}
            className={`${INPUT} py-2 resize-y`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={busy} className={BTN}>
            {busy ? 'Creating…' : 'Create matter'}
          </button>
          <Link to="/portal/board" className={BTN_SECONDARY}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
