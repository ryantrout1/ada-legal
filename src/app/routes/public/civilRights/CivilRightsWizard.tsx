/**
 * The state civil rights complaint wizard.
 *
 * Deterministic only: no Ada, no LLM, no links to Ada or Spot. One or two
 * questions per screen, a review screen where every answer can be changed,
 * two optional consents, then the agency's own PDF filled in the browser.
 *
 * Privacy posture:
 *   - The step lives in memory, never in the URL, so no answer reaches
 *     analytics or browser history.
 *   - Nothing is kept in browser storage. Leaving the page asks first.
 *   - The answers are saved once, when the person asks for their form.
 *     The PDF does not wait on that save: if it fails, they still get it.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Answers, FieldError, StateConfig } from '../../../../lib/civilRights/types.js';
import { validateAnswers } from '../../../../lib/civilRights/validate.js';
import { usDate } from '../../../../lib/civilRights/summary.js';
import { CONSENTS, UI, deadlineNote, disclaimer, type ConsentKind } from '../../../../lib/civilRights/copy.js';
import { FieldInput, fieldId } from './FieldInput.js';

type Screen =
  | { kind: 'step'; index: number }
  | { kind: 'review' }
  | { kind: 'done' };

export const BUTTON_PRIMARY =
  'inline-flex min-h-[44px] items-center justify-center rounded-md bg-accent-500 px-6 py-2 text-lg font-medium text-[color:var(--page-bg)] hover:bg-accent-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50 disabled:opacity-60';
export const BUTTON_SECONDARY =
  'inline-flex min-h-[44px] items-center justify-center rounded-md border-2 border-control-border px-6 py-2 text-lg font-medium text-ink-900 hover:bg-surface-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50';

interface Props {
  config: StateConfig;
  /** Admin preview: saved rows are tagged so they are easy to find and delete. */
  preview?: boolean;
  onExit?: () => void;
}

function emptyAnswers(config: StateConfig): Answers {
  return Object.fromEntries(config.fields.map((f) => [f.key, '']));
}

function readUtm(preview: boolean) {
  if (preview) return { source: 'admin-preview', medium: null, campaign: null };
  if (typeof window === 'undefined') return {};
  const q = new URLSearchParams(window.location.search);
  return { source: q.get('utm_source'), medium: q.get('utm_medium'), campaign: q.get('utm_campaign') };
}

function newId(): string {
  return globalThis.crypto.randomUUID();
}

export function CivilRightsWizard({ config, preview = false, onExit }: Props) {
  const [screen, setScreen] = useState<Screen>({ kind: 'step', index: 0 });
  const [answers, setAnswers] = useState<Answers>(() => emptyAnswers(config));
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [returnToReview, setReturnToReview] = useState(false);
  const [consents, setConsents] = useState<Record<ConsentKind, boolean>>({ updates: false, contact: false });
  const [website, setWebsite] = useState(''); // spam trap; real people never see it
  const [busy, setBusy] = useState(false);
  const [pdfFailed, setPdfFailed] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [handedOver, setHandedOver] = useState(false);
  const idRef = useRef<string>('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  const utm = useMemo(() => readUtm(preview), [preview]);
  const fieldsByKey = useMemo(() => new Map(config.fields.map((f) => [f.key, f])), [config]);
  const total = config.steps.length;

  // Move focus to the new screen's heading so screen readers announce it.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      headingRef.current?.focus();
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, [screen]);

  useEffect(() => {
    if (errors.length) summaryRef.current?.focus();
  }, [errors]);

  // Ask before leaving while there is something to lose.
  const dirty = Object.values(answers).some(Boolean) && !(screen.kind === 'done' && handedOver);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = UI.leaveWarning;
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  }, [pdfUrl]);

  const set = (key: string, value: string) => setAnswers((a) => ({ ...a, [key]: value }));

  function stepErrors(index: number): FieldError[] {
    const r = validateAnswers(config, answers);
    if (r.ok) return [];
    const keys = new Set(config.steps[index].fields);
    return r.errors.filter((e) => keys.has(e.field));
  }

  function goNext(index: number) {
    const errs = stepErrors(index);
    setErrors(errs);
    if (errs.length) return;
    if (returnToReview || index === total - 1) {
      setReturnToReview(false);
      setScreen({ kind: 'review' });
    } else {
      setScreen({ kind: 'step', index: index + 1 });
    }
  }

  function goBack(index: number) {
    setErrors([]);
    if (returnToReview) {
      setReturnToReview(false);
      setScreen({ kind: 'review' });
    } else if (index === 0) {
      onExit?.();
    } else {
      setScreen({ kind: 'step', index: index - 1 });
    }
  }

  function edit(index: number) {
    setErrors([]);
    setReturnToReview(true);
    setScreen({ kind: 'step', index });
  }

  async function getForm() {
    const r = validateAnswers(config, answers);
    if (!r.ok) {
      // Should not happen after per-step checks; send them to the first problem.
      const index = config.steps.findIndex((s) => s.fields.includes(r.errors[0].field));
      setReturnToReview(true);
      setScreen({ kind: 'step', index: Math.max(0, index) });
      setErrors(r.errors.filter((e) => config.steps[Math.max(0, index)].fields.includes(e.field)));
      return;
    }
    setBusy(true);
    setPdfFailed(false);
    if (!idRef.current) idRef.current = newId();

    // Save in the background; the form does not wait on it.
    void fetch('/api/public/civil-rights/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: idRef.current,
        state: config.slug,
        answers: r.value,
        consents: CONSENTS.map((c) => ({ kind: c.kind, granted: consents[c.kind], wordingVersion: c.version })),
        website,
        utm,
      }),
      keepalive: true,
    }).catch(() => undefined);

    try {
      const [{ fillPdf }, template] = await Promise.all([
        import('../../../../lib/civilRights/fillPdf.js'),
        fetch(config.pdf.path).then((resp) => {
          if (!resp.ok) throw new Error(`template ${resp.status}`);
          return resp.arrayBuffer();
        }),
      ]);
      const bytes = await fillPdf(config, r.value, new Uint8Array(template));
      const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' }));
      setPdfUrl(url);
      setScreen({ kind: 'done' });
    } catch (err) {
      console.error('[civil-rights] form build failed', err);
      setPdfFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const display = (key: string): string => {
    const f = fieldsByKey.get(key);
    const v = answers[key];
    if (!v) return UI.notGiven;
    if (f?.kind === 'yesno') return v === 'yes' ? UI.yes : UI.no;
    if (f?.kind === 'date') return usDate(v);
    return v;
  };

  const errorSummary = errors.length ? (
    <div
      ref={summaryRef}
      tabIndex={-1}
      role="alert"
      className="mb-6 rounded-md border-2 border-danger-500 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
    >
      <p className="text-lg font-medium text-ink-900">{UI.errorSummary}</p>
      <ul className="mt-2 list-disc pl-6">
        {errors.map((e) => (
          <li key={e.field} className="text-base">
            <a className="text-danger-500 underline" href={`#${fieldId(e.field)}`}>
              {fieldsByKey.get(e.field)?.label}: {e.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  // ── Steps ────────────────────────────────────────────────────────────────
  if (screen.kind === 'step') {
    const step = config.steps[screen.index];
    const errFor = (k: string) => errors.find((e) => e.field === k)?.message;
    return (
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          goNext(screen.index);
        }}
      >
        <p className="font-mono text-sm uppercase tracking-[0.14em] text-ink-700" aria-live="polite">
          {UI.stepOf(screen.index + 1, total)}
        </p>
        <div
          className="mt-2 mb-6 h-2 w-full rounded-full bg-surface-200"
          role="progressbar"
          aria-label={UI.stepOf(screen.index + 1, total)}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={screen.index + 1}
        >
          <div
            className="h-2 rounded-full bg-accent-500"
            style={{ width: `${((screen.index + 1) / total) * 100}%` }}
          />
        </div>
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl text-ink-900 mb-6 focus:outline-none">
          {step.title}
        </h2>
        {errorSummary}
        {step.fields.map((k) => {
          const f = fieldsByKey.get(k);
          if (!f) return null;
          if (f.requiredWhen && answers[f.requiredWhen.field] !== f.requiredWhen.equals) return null;
          return <FieldInput key={k} field={f} value={answers[k]} error={errFor(k)} onChange={(v) => set(k, v)} />;
        })}
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className={BUTTON_SECONDARY} onClick={() => goBack(screen.index)}>
            {returnToReview ? UI.backToReview : UI.back}
          </button>
          <button type="submit" className={BUTTON_PRIMARY}>
            {returnToReview ? UI.backToReview : UI.next}
          </button>
        </div>
      </form>
    );
  }

  // ── Review + consents ────────────────────────────────────────────────────
  if (screen.kind === 'review') {
    return (
      <div>
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl text-ink-900 mb-3 focus:outline-none">
          {UI.reviewTitle}
        </h2>
        <p className="text-lg text-ink-700 mb-4">{UI.reviewIntro}</p>
        <p className="text-base text-ink-700 mb-8">{UI.areaLine(config.areaLabel, config.basisLabel)}</p>

        {config.steps.map((step, i) => (
          <section key={step.id} aria-labelledby={`review-${step.id}`} className="mb-6 rounded-md border border-surface-200 p-4">
            <h3 id={`review-${step.id}`} className="font-display text-xl text-ink-900">
              {step.title}
            </h3>
            <dl className="mt-3">
              {step.fields
                .filter((k) => {
                  const f = fieldsByKey.get(k);
                  return !(f?.requiredWhen && answers[f.requiredWhen.field] !== f.requiredWhen.equals);
                })
                .map((k) => (
                  <div key={k} className="mb-3">
                    <dt className="text-base font-medium text-ink-900">{fieldsByKey.get(k)?.label}</dt>
                    <dd className="text-base text-ink-700 whitespace-pre-wrap break-words">{display(k)}</dd>
                  </div>
                ))}
            </dl>
            <button type="button" className={`${BUTTON_SECONDARY} mt-2`} onClick={() => edit(i)}>
              {UI.edit(step.title)}
            </button>
          </section>
        ))}

        <fieldset className="mt-10 mb-6">
          <legend className="font-display text-2xl text-ink-900">{UI.consentTitle}</legend>
          <p className="mt-2 text-base text-ink-700">{UI.consentIntro}</p>
          {CONSENTS.map((c) => (
            <label key={c.kind} className="mt-4 flex min-h-[44px] cursor-pointer items-start gap-3 text-lg text-ink-900">
              <input
                type="checkbox"
                checked={consents[c.kind]}
                onChange={(e) => setConsents((s) => ({ ...s, [c.kind]: e.target.checked }))}
                className="mt-1 h-6 w-6 shrink-0 accent-[var(--color-accent-500)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
              />
              <span>{c.wording}</span>
            </label>
          ))}
        </fieldset>

        {/* Spam trap: off-screen, hidden from screen readers, not tabbable, never autofilled. */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
          <label htmlFor="cr-website">Leave this empty</label>
          <input
            id="cr-website"
            name="cr-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        {pdfFailed ? (
          <div role="alert" className="mb-6 rounded-md border-2 border-danger-500 p-4">
            <p className="text-base text-ink-900">{UI.pdfFailed}</p>
            <a className="mt-2 inline-block text-base text-accent-500 underline" href={config.formUrl} target="_blank" rel="noopener noreferrer">
              {UI.blankForm}
            </a>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button type="button" className={BUTTON_SECONDARY} onClick={() => edit(total - 1)}>
            {UI.back}
          </button>
          <button type="button" className={BUTTON_PRIMARY} onClick={getForm} disabled={busy} aria-busy={busy}>
            {busy ? UI.working : pdfFailed ? UI.tryAgain : UI.getForm}
          </button>
        </div>
      </div>
    );
  }

  // ── Done ────────────────────────────────────────────────────────────────
  const fileName = `${config.slug}-civil-rights-intake-questionnaire.pdf`;
  return (
    <div>
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl text-ink-900 mb-4 focus:outline-none">
        {UI.doneTitle}
      </h2>
      <p className="mb-6 rounded-md border-2 border-warning-500 p-4 text-lg font-medium text-ink-900">{UI.doneWarning}</p>
      {pdfUrl ? (
        <div className="mb-8 flex flex-wrap gap-3">
          <a className={BUTTON_PRIMARY} href={pdfUrl} download={fileName} onClick={() => setHandedOver(true)}>
            {UI.download}
          </a>
          <a className={BUTTON_SECONDARY} href={pdfUrl} target="_blank" rel="noopener" onClick={() => setHandedOver(true)}>
            {UI.openToPrint}
          </a>
        </div>
      ) : null}

      <h3 className="font-display text-2xl text-ink-900 mb-3">{UI.nextStepsTitle}</h3>
      <ol className="mb-6 list-decimal pl-6 text-lg text-ink-700">
        {UI.nextSteps.map((s) => (
          <li key={s} className="mb-2">
            {s}
          </li>
        ))}
      </ol>
      <ul className="mb-8 space-y-3 text-lg text-ink-700">
        {config.channels.map((c) => (
          <li key={c.kind}>
            <span className="font-medium text-ink-900">{c.label}: </span>
            {c.kind === 'online' ? (
              <a className="text-accent-500 underline" href={c.value} target="_blank" rel="noopener noreferrer">
                {c.value.replace(/^https:\/\//, '')}
              </a>
            ) : c.kind === 'phone' ? (
              <a className="text-accent-500 underline" href={`tel:${c.value.replace(/\D/g, '')}`}>
                {c.value}
              </a>
            ) : (
              c.value
            )}
          </li>
        ))}
      </ul>
      <p className="mb-4 text-base text-ink-700">{deadlineNote(config)}</p>
      <p className="text-base text-ink-700">{disclaimer(config)}</p>
    </div>
  );
}
