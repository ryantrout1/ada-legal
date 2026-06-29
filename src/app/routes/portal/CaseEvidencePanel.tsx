/**
 * Evidence tab (build-list #3) — the photos a claimant shared during intake and
 * the full structured accessibility analysis for each, for the attorney.
 *
 * The claimant saw a soft, conversational read of their photo. The attorney
 * gets everything the analyzer produces: scene, overall risk, every potential
 * barrier with its cited ADA section, confidence, and the on-site-verification
 * hedge, plus compliant features observed — at the professional reading level.
 *
 * SCREENING, NOT CERTIFICATION. The footer says so on every analysis; a clean
 * photo reads "no barriers detected," never "compliant."
 */

import { useCallback, useEffect, useState } from 'react';
import { ScanSearch } from 'lucide-react';
import {
  fetchCaseEvidence,
  analyzeCasePhoto,
  type PortalEvidencePhoto,
} from '../../data/portalClient.js';
import type {
  PhotoAnalysisOutput,
  ReadingLevelText,
  ReadingLevelStringList,
} from '../../../types/db.js';

const txt = (t: ReadingLevelText): string => t.professional ?? t.standard;
const list = (t: ReadingLevelStringList): string[] => t.professional ?? t.standard;

const RISK_LABEL: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'None',
};

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CaseEvidencePanel({ caseId }: { caseId: string }) {
  const [photos, setPhotos] = useState<PortalEvidencePhoto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPhotos(await fetchCaseEvidence(caseId));
    } catch {
      setError('Could not load evidence. Refresh to try again.');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const analyze = async (url: string) => {
    setAnalyzing(url);
    setError(null);
    try {
      const analysis = await analyzeCasePhoto(caseId, url);
      setPhotos(
        (prev) =>
          prev?.map((p) =>
            p.url === url ? { ...p, analysis, analyzed_at: new Date().toISOString() } : p,
          ) ?? null,
      );
    } catch {
      setError('The analysis did not finish. Run it again.');
    } finally {
      setAnalyzing(null);
    }
  };

  if (loading) return <p className="text-ink-500 text-sm">Loading evidence…</p>;

  return (
    <section aria-label="Evidence">
      <div className="mb-4">
        <h2 className="font-display text-lg text-ink-900">Evidence</h2>
        <p className="text-ink-500 text-sm mt-0.5">
          Photos the claimant shared during intake. Run the accessibility analyzer to see the
          full barrier read for each one.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-danger-500 text-xs mb-3">
          {error}
        </p>
      )}

      {!photos || photos.length === 0 ? (
        <p className="text-ink-500 text-sm">No photos on this matter.</p>
      ) : (
        <ul className="flex flex-col gap-5">
          {photos.map((p) => (
            <li
              key={p.url}
              className="rounded-lg border border-surface-200 bg-white overflow-hidden"
            >
              <img
                src={p.url}
                alt={p.analysis ? `Site photo — ${txt(p.analysis.scene)}` : 'Site photo shared during intake'}
                loading="lazy"
                className="w-full max-h-80 object-contain bg-surface-50 border-b border-surface-200"
              />
              <div className="p-4">
                {p.analysis ? (
                  <AnalysisView analysis={p.analysis} analyzedAt={p.analyzed_at} />
                ) : (
                  <div className="flex flex-col items-start gap-2">
                    <p className="text-ink-500 text-sm">Not analyzed yet.</p>
                    <button
                      type="button"
                      onClick={() => void analyze(p.url)}
                      disabled={analyzing === p.url}
                      className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-lg bg-accent-500 text-white text-sm font-semibold hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
                    >
                      <ScanSearch size={15} aria-hidden="true" />
                      {analyzing === p.url ? 'Analyzing… (~15s)' : 'Run accessibility analysis'}
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AnalysisView({
  analysis,
  analyzedAt,
}: {
  analysis: PhotoAnalysisOutput;
  analyzedAt: string | null;
}) {
  const riskLabel = RISK_LABEL[analysis.overall_risk] ?? 'None';
  const summary = txt(analysis.summary);
  const positives = list(analysis.positive_findings);
  const noConcern = analysis.findings.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-accent-500">
            Accessibility screening
          </span>
          <span className="text-ink-500 text-xs" aria-hidden="true">
            ·
          </span>
          <span className="text-ink-700 text-xs font-semibold">Overall risk: {riskLabel}</span>
          {analyzedAt && (
            <span className="text-ink-500 text-xs">Analyzed {fmtDate(analyzedAt)}</span>
          )}
        </div>
        <p className="text-ink-700 text-sm">{txt(analysis.scene)}</p>
      </div>

      {summary && <p className="text-ink-900 text-sm">{summary}</p>}

      {noConcern ? (
        <p className="text-ink-700 text-sm">No barriers detected in this photo.</p>
      ) : (
        <div>
          <h3 className="text-ink-900 text-sm font-semibold mb-2">
            Potential barriers ({analysis.findings.length})
          </h3>
          <ul className="flex flex-col gap-3">
            {analysis.findings.map((f, i) => (
              <li key={i} className="rounded-md border border-surface-200 bg-surface-50 p-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <span className="text-ink-900 text-sm font-semibold">
                    {f.title_professional ?? f.title_standard}
                  </span>
                  {!f.confirmable && (
                    <span className="text-[11px] font-semibold text-accent-600 border border-accent-500/40 rounded px-1.5 py-0.5 whitespace-nowrap">
                      Needs on-site verification
                    </span>
                  )}
                </div>
                <p className="text-ink-700 text-sm mt-1">
                  {f.finding_professional ?? f.finding_standard}
                </p>
                <div className="flex items-center gap-2 mt-2 text-ink-500 text-xs flex-wrap">
                  <span className="font-mono text-ink-700">{f.standard}</span>
                  <span aria-hidden="true">·</span>
                  <span>Confidence {Math.round(f.confidence * 100)}%</span>
                  {f.guide_url && (
                    <>
                      <span aria-hidden="true">·</span>
                      <a
                        href={f.guide_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm"
                      >
                        Standards guide
                      </a>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {positives.length > 0 && (
        <div>
          <h3 className="text-ink-900 text-sm font-semibold mb-1">Compliant features observed</h3>
          <ul className="list-disc pl-5 text-ink-700 text-sm flex flex-col gap-0.5">
            {positives.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-ink-500 text-xs border-t border-surface-200 pt-3">
        Screening analysis — a starting point for review, not a compliance certification. Confirm
        every barrier on site before relying on it.
      </p>
    </div>
  );
}
