/**
 * AdminPhotoReviewDetail — the labeling surface.
 *
 * Shows the photo + the engine's findings, and lets the expert reviewer
 * label each finding (correct / over-flagged / partial / wrong-cite +
 * reason), add findings the engine MISSED, set an overall verdict + notes,
 * and mark the item reviewed or addressed. Seeds from any existing review.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useAdminPhotoReviewDetail,
  type FindingSeverity,
  type FindingVerdict,
  type ReviewOverallVerdict,
  type MissedFinding,
} from '../../hooks/useAdminPhotoReview.js';

const SEV: Record<FindingSeverity, { bg: string; text: string }> = {
  critical: { bg: 'bg-danger-50', text: 'text-danger-500' },
  major: { bg: 'bg-danger-50', text: 'text-danger-500' },
  minor: { bg: 'bg-amber-50', text: 'text-amber-700' },
  advisory: { bg: 'bg-surface-100', text: 'text-ink-500' },
};

const VERDICTS: { value: FindingVerdict; label: string }[] = [
  { value: 'correct', label: 'Correct' },
  { value: 'over_flagged', label: 'Over-flagged' },
  { value: 'partial', label: 'Partial' },
  { value: 'wrong_cite', label: 'Wrong cite' },
];

const OVERALL: ReviewOverallVerdict[] = ['accurate', 'missed', 'over_flagged', 'wrong', 'mixed'];

type LabelState = Record<number, { verdict: FindingVerdict | ''; reason: string }>;

export default function AdminPhotoReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { detail, loading, error, unauthenticated, saving, deleting, submit, remove } =
    useAdminPhotoReviewDetail(id);

  const [labels, setLabels] = useState<LabelState>({});
  const [missed, setMissed] = useState<MissedFinding[]>([]);
  const [overallVerdict, setOverallVerdict] = useState<ReviewOverallVerdict | ''>('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'reviewed' | 'addressed'>('reviewed');
  const [savedFlash, setSavedFlash] = useState(false);

  // Seed local state from this admin's own existing review when detail loads.
  const ownReview =
    detail?.reviews.find((r) => r.reviewer === detail.viewerReviewer) ?? null;
  useEffect(() => {
    if (!detail) return;
    const mine = detail.reviews.find((r) => r.reviewer === detail.viewerReviewer) ?? null;
    const seed: LabelState = {};
    for (const l of mine?.findingLabels ?? []) {
      seed[l.finding_index] = { verdict: l.verdict, reason: l.reason };
    }
    setLabels(seed);
    setMissed(mine?.missedFindings ?? []);
    setOverallVerdict(mine?.overallVerdict ?? '');
    setNotes(mine?.reviewerNotes ?? '');
    setStatus(mine?.status ?? 'reviewed');
  }, [detail]);

  if (unauthenticated) {
    return (
      <div
        role="alert"
        className="rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
      >
        Your session is not authenticated.{' '}
        <Link to="/admin/sign-in" className="underline">
          Sign in
        </Link>
        .
      </div>
    );
  }

  if (loading) return <p className="text-sm text-ink-500">Loading…</p>;
  if (error && !detail)
    return (
      <div className="rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500">
        {error}
      </div>
    );
  if (!detail) return <p className="text-sm text-ink-500">Not found.</p>;

  const setLabel = (idx: number, patch: Partial<{ verdict: FindingVerdict | ''; reason: string }>) =>
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

  const handleDelete = async () => {
    if (
      !window.confirm(
        'Delete this analysis and its review? This cannot be undone.',
      )
    ) {
      return;
    }
    const ok = await remove();
    if (ok) navigate('/admin/photo-review');
  };

  return (
    <section className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/photo-review" className="text-sm text-accent-600 hover:underline">
            ← Back to queue
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-danger-500 hover:underline disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
        <Link
          to={`/admin/sessions/${detail.sessionId}`}
          className="text-sm text-ink-500 hover:underline"
        >
          Full session context →
        </Link>
      </div>

      <img
        src={detail.photoUrl}
        alt="Submitted field-test photo under review"
        className="mb-4 w-full rounded-md border border-surface-200 object-contain"
      />

      {detail.summary && (
        <p className="mb-4 text-sm leading-relaxed text-ink-700">
          {detail.summary.professional ?? detail.summary.standard}
        </p>
      )}

      {detail.testerComment && (
        <div className="mb-4 rounded-md border border-accent-500 bg-accent-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">
            Tester note
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink-900">{detail.testerComment}</p>
        </div>
      )}

      {detail.reviews.length > 0 && (
        <div className="mb-4 rounded-md border border-surface-200 bg-surface-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Reviews so far ({detail.reviews.length})
          </p>
          <ul className="space-y-2">
            {detail.reviews.map((rv) => (
              <li key={rv.reviewer} className="text-sm text-ink-700">
                <span className="font-semibold text-ink-900">{rv.reviewer}</span>
                {rv.overallVerdict && (
                  <span className="ml-2 rounded bg-surface-100 px-1.5 py-0.5 text-xs text-ink-700">
                    {rv.overallVerdict}
                  </span>
                )}
                {rv.status === 'addressed' && (
                  <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700">
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

      <h2 className="mb-2 font-display text-lg text-ink-900">
        Engine findings <span className="text-ink-500">({detail.findings.length})</span>
      </h2>

      <ul className="space-y-3">
        {detail.findings.map((f, idx) => {
          const sev = SEV[f.severity] ?? SEV.advisory;
          const cur = labels[idx] ?? { verdict: '', reason: '' };
          return (
            <li key={idx} className="rounded-md border border-surface-200 bg-surface-50 p-3">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${sev.bg} ${sev.text}`}>
                  {f.severity}
                </span>
                <span className="font-mono text-xs text-ink-500">{f.standard}</span>
                {!f.confirmable && (
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                    needs on-site check
                  </span>
                )}
                {f.guide_url && (
                  <a href={f.guide_url} className="text-xs text-accent-600 hover:underline">
                    standard ↗
                  </a>
                )}
              </div>
              <p className="text-sm font-semibold text-ink-900">
                {f.title_professional ?? f.title_standard}
              </p>
              <p className="mt-0.5 text-sm text-ink-700">
                {f.finding_professional ?? f.finding_standard}
              </p>

              {/* Verdict controls */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {VERDICTS.map((v) => {
                  const active = cur.verdict === v.value;
                  return (
                    <button
                      key={v.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setLabel(idx, { verdict: active ? '' : v.value })}
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
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
                  placeholder="Why? (this is the training signal)"
                  className="mt-2 w-full rounded-md border border-surface-200 bg-surface-50 px-2 py-1.5 text-sm text-ink-900"
                />
              )}
            </li>
          );
        })}
      </ul>

      {/* Missed findings */}
      <h2 className="mb-2 mt-6 font-display text-lg text-ink-900">What the engine missed</h2>
      {missed.map((m, i) => (
        <div key={i} className="mb-2 flex gap-2">
          <input
            type="text"
            value={m.description}
            onChange={(e) =>
              setMissed((prev) => prev.map((x, xi) => (xi === i ? { ...x, description: e.target.value } : x)))
            }
            placeholder="A concern the engine should have caught"
            className="flex-1 rounded-md border border-surface-200 bg-surface-50 px-2 py-1.5 text-sm text-ink-900"
          />
          <input
            type="text"
            value={m.standard ?? ''}
            onChange={(e) =>
              setMissed((prev) =>
                prev.map((x, xi) => (xi === i ? { ...x, standard: e.target.value || undefined } : x)),
              )
            }
            placeholder="§ cite"
            className="w-28 rounded-md border border-surface-200 bg-surface-50 px-2 py-1.5 text-sm text-ink-900"
          />
          <button
            type="button"
            onClick={() => setMissed((prev) => prev.filter((_, xi) => xi !== i))}
            className="rounded-md border border-surface-200 px-2 text-sm text-ink-500 hover:text-danger-500"
            aria-label="Remove missed finding"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setMissed((prev) => [...prev, { description: '' }])}
        className="rounded-md border border-surface-200 px-3 py-1.5 text-sm text-ink-700 hover:border-accent-500"
      >
        + Add missed finding
      </button>

      {/* Overall + notes + status */}
      <div className="mt-6 space-y-4 rounded-md border border-surface-200 bg-surface-100 p-4">
        <label className="flex flex-col text-sm text-ink-700">
          Overall verdict
          <select
            value={overallVerdict}
            onChange={(e) => setOverallVerdict(e.target.value as ReviewOverallVerdict | '')}
            className="mt-1 w-48 rounded-md border border-surface-200 bg-surface-50 px-2 py-1.5 text-sm text-ink-900"
          >
            <option value="">—</option>
            {OVERALL.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm text-ink-700">
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-surface-200 bg-surface-50 px-2 py-1.5 text-sm text-ink-900"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={status === 'addressed'}
            onChange={(e) => setStatus(e.target.checked ? 'addressed' : 'reviewed')}
          />
          Mark as addressed (I've acted on this)
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
          >
            {saving ? 'Saving…' : ownReview ? 'Update my review' : 'Save my review'}
          </button>
          {savedFlash && <span className="text-sm text-emerald-700">Saved.</span>}
          {error && <span className="text-sm text-danger-500">{error}</span>}
          {detail.viewerReviewer && (
            <span className="text-xs text-ink-500">
              Reviewing as {detail.viewerReviewer}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
