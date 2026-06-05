/**
 * PhotoReviewLabel — /review/:id
 *
 * The public labeling surface. Shows the photo + Ada's findings and lets the
 * self-identified reviewer (Peter / Gina / Ryan) say whether each finding is
 * right, flag what Ada missed, set an overall verdict, leave a note, and mark
 * the photo addressed. Seeds from the reviewer's OWN prior review; everyone
 * else's reviews are shown read-only below so you can see who said what.
 *
 * Accessibility: every control is a large tap target (min 48–56px) so a
 * whole review can be done by tapping — no typing required. Verdict and
 * "addressed" are big buttons, not a dropdown and a tiny checkbox.
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePhotoReviewDetail } from './usePhotoReview.js';
import { useReviewContext } from './ReviewLayout.js';
import type {
  FindingSeverity,
  FindingVerdict,
  ReviewOverallVerdict,
  MissedFinding,
} from '../../hooks/useAdminPhotoReview.js';

const SEV: Record<FindingSeverity, string> = {
  critical: 'bg-danger-50 text-danger-500',
  major: 'bg-danger-50 text-danger-500',
  minor: 'bg-amber-50 text-amber-700',
  advisory: 'bg-surface-100 text-ink-500',
};

const VERDICTS: { value: FindingVerdict; label: string }[] = [
  { value: 'correct', label: 'Correct' },
  { value: 'over_flagged', label: 'Over-flagged' },
  { value: 'partial', label: 'Partly right' },
  { value: 'wrong_cite', label: 'Wrong cite' },
];

const OVERALL: { value: ReviewOverallVerdict; label: string }[] = [
  { value: 'accurate', label: 'Accurate' },
  { value: 'missed', label: 'Missed things' },
  { value: 'over_flagged', label: 'Over-flagged' },
  { value: 'wrong', label: 'Wrong' },
  { value: 'mixed', label: 'Mixed' },
];

type LabelState = Record<number, { verdict: FindingVerdict | ''; reason: string }>;

export default function PhotoReviewLabel() {
  const { id } = useParams<{ id: string }>();
  const { reviewer } = useReviewContext();
  const { detail, loading, error, saving, submit } = usePhotoReviewDetail(id, reviewer);

  const [labels, setLabels] = useState<LabelState>({});
  const [missed, setMissed] = useState<MissedFinding[]>([]);
  const [overallVerdict, setOverallVerdict] = useState<ReviewOverallVerdict | ''>('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'reviewed' | 'addressed'>('reviewed');
  const [savedFlash, setSavedFlash] = useState(false);

  const ownReview = detail?.reviews.find((r) => r.reviewer === reviewer) ?? null;
  const otherReviews = detail?.reviews.filter((r) => r.reviewer !== reviewer) ?? [];

  // Seed from this reviewer's own prior review when the detail loads.
  useEffect(() => {
    if (!detail) return;
    const mine = detail.reviews.find((r) => r.reviewer === reviewer) ?? null;
    const seed: LabelState = {};
    for (const l of mine?.findingLabels ?? []) {
      seed[l.finding_index] = { verdict: l.verdict, reason: l.reason };
    }
    setLabels(seed);
    setMissed(mine?.missedFindings ?? []);
    setOverallVerdict(mine?.overallVerdict ?? '');
    setNotes(mine?.reviewerNotes ?? '');
    setStatus(mine?.status ?? 'reviewed');
  }, [detail, reviewer]);

  if (loading) return <p className="text-base text-ink-500">Loading…</p>;
  if (error && !detail)
    return (
      <p className="rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-base text-danger-500">
        {error}
      </p>
    );
  if (!detail) return <p className="text-base text-ink-500">Not found.</p>;

  const setLabel = (
    idx: number,
    patch: Partial<{ verdict: FindingVerdict | ''; reason: string }>,
  ) =>
    setLabels((prev) => ({
      ...prev,
      [idx]: { verdict: prev[idx]?.verdict ?? '', reason: prev[idx]?.reason ?? '', ...patch },
    }));

  const handleSave = async () => {
    const findingLabels = Object.entries(labels)
      .filter(([, v]) => v.verdict !== '')
      .map(([idx, v]) => ({
        finding_index: Number(idx),
        verdict: v.verdict as FindingVerdict,
        reason: v.reason,
      }));
    const ok = await submit({
      status,
      overallVerdict: overallVerdict || null,
      findingLabels,
      missedFindings: missed.filter((m) => m.description.trim() !== ''),
      reviewerNotes: notes.trim() || null,
      modelVersion: detail.modelVersion,
    });
    if (ok) {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    }
  };

  return (
    <section>
      <Link
        to="/review"
        className="mb-4 inline-block min-h-[44px] text-base text-accent-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        ← Back to photos
      </Link>

      <img
        src={detail.photoUrl}
        alt="Submitted field-test photo under review"
        className="mb-4 w-full rounded-md border border-surface-200 object-contain"
      />

      {detail.summary && (
        <p className="mb-4 text-base leading-relaxed text-ink-700">
          {detail.summary.standard}
        </p>
      )}

      {otherReviews.length > 0 && (
        <div className="mb-4 rounded-md border border-surface-200 bg-surface-100 p-3">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
            Already reviewed by
          </p>
          <ul className="space-y-2">
            {otherReviews.map((rv) => (
              <li key={rv.reviewer} className="text-base text-ink-700">
                <span className="font-semibold text-ink-900">{rv.reviewer}</span>
                {rv.overallVerdict && (
                  <span className="ml-2 rounded bg-surface-200 px-1.5 py-0.5 text-sm text-ink-700">
                    {OVERALL.find((o) => o.value === rv.overallVerdict)?.label ??
                      rv.overallVerdict}
                  </span>
                )}
                {rv.status === 'addressed' && (
                  <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-sm text-emerald-700">
                    addressed
                  </span>
                )}
                {rv.reviewerNotes && (
                  <span className="ml-2 text-ink-500">— {rv.reviewerNotes}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="mb-2 font-display text-xl text-ink-900">
        Ada's findings <span className="text-ink-500">({detail.findings.length})</span>
      </h2>

      <ul className="space-y-3">
        {detail.findings.map((f, idx) => {
          const cur = labels[idx] ?? { verdict: '', reason: '' };
          return (
            <li key={idx} className="rounded-md border border-surface-200 bg-surface-100 p-3">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-sm font-bold uppercase ${SEV[f.severity] ?? SEV.advisory}`}
                >
                  {f.severity}
                </span>
                {!f.confirmable && (
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-sm text-amber-700">
                    needs on-site check
                  </span>
                )}
              </div>
              <p className="text-base font-semibold text-ink-900">{f.title_standard}</p>
              <p className="mt-0.5 text-base text-ink-700">{f.finding_standard}</p>

              <p className="mt-3 text-sm font-medium text-ink-500">Is this right?</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {VERDICTS.map((v) => {
                  const active = cur.verdict === v.value;
                  return (
                    <button
                      key={v.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setLabel(idx, { verdict: active ? '' : v.value })}
                      className={`min-h-[48px] rounded-md border px-4 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                        active
                          ? 'border-accent-500 bg-accent-50 text-accent-600'
                          : 'border-surface-200 text-ink-700 hover:border-accent-500'
                      }`}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
              {cur.verdict !== '' && (
                <input
                  type="text"
                  value={cur.reason}
                  onChange={(e) => setLabel(idx, { reason: e.target.value })}
                  placeholder="Why? (optional)"
                  className="mt-2 w-full rounded-md border border-surface-200 bg-surface-50 px-3 py-2 text-base text-ink-900 focus-visible:border-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                />
              )}
            </li>
          );
        })}
      </ul>

      <h2 className="mb-2 mt-6 font-display text-xl text-ink-900">Did Ada miss anything?</h2>
      {missed.map((m, i) => (
        <div key={i} className="mb-2 flex gap-2">
          <input
            type="text"
            value={m.description}
            onChange={(e) =>
              setMissed((prev) =>
                prev.map((x, xi) => (xi === i ? { ...x, description: e.target.value } : x)),
              )
            }
            placeholder="Something Ada should have caught"
            className="flex-1 rounded-md border border-surface-200 bg-surface-50 px-3 py-2 text-base text-ink-900 focus-visible:border-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          />
          <button
            type="button"
            onClick={() => setMissed((prev) => prev.filter((_, xi) => xi !== i))}
            className="min-h-[48px] rounded-md border border-surface-200 px-4 text-base text-ink-500 hover:text-danger-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            aria-label="Remove"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setMissed((prev) => [...prev, { description: '' }])}
        className="min-h-[48px] rounded-md border border-surface-200 px-4 text-base text-ink-700 hover:border-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        + Add something Ada missed
      </button>

      <div className="mt-6 space-y-5 rounded-md border border-surface-200 bg-surface-100 p-4">
        <div>
          <p className="mb-2 text-base font-medium text-ink-900">Overall, how did Ada do?</p>
          <div className="flex flex-wrap gap-2">
            {OVERALL.map((v) => {
              const active = overallVerdict === v.value;
              return (
                <button
                  key={v.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setOverallVerdict(active ? '' : v.value)}
                  className={`min-h-[56px] rounded-md border px-5 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                    active
                      ? 'border-accent-500 bg-accent-50 text-accent-600'
                      : 'border-surface-200 bg-surface-50 text-ink-700 hover:border-accent-500'
                  }`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="mb-2 block text-base font-medium text-ink-900">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-surface-200 bg-surface-50 px-3 py-2 text-base text-ink-900 focus-visible:border-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          />
        </div>

        <button
          type="button"
          aria-pressed={status === 'addressed'}
          onClick={() => setStatus(status === 'addressed' ? 'reviewed' : 'addressed')}
          className={`block w-full min-h-[56px] rounded-md border px-4 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
            status === 'addressed'
              ? 'border-emerald-700 bg-emerald-50 text-emerald-700'
              : 'border-surface-200 bg-surface-50 text-ink-700 hover:border-accent-500'
          }`}
        >
          {status === 'addressed' ? '✓ Marked as addressed' : 'Mark as addressed'}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="block w-full min-h-[56px] rounded-md bg-accent-500 px-4 text-lg font-display text-surface-50 transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50 disabled:cursor-not-allowed disabled:bg-surface-300"
        >
          {saving ? 'Saving…' : ownReview ? 'Update my review' : 'Save my review'}
        </button>
        <div aria-live="polite" className="min-h-[24px] text-center text-base">
          {savedFlash && <span className="text-emerald-700">Saved. Thank you!</span>}
          {error && <span className="text-danger-500">{error}</span>}
        </div>
      </div>
    </section>
  );
}
