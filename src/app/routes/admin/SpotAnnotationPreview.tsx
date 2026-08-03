/**
 * SpotAnnotationPreview — internal Phase 1 preview at /admin/spot/annotation-preview.
 *
 * Enter a session id; the endpoint re-places that session's stored findings one
 * at a time and returns pins. Each photo shows one pin at a time (or all), so
 * Peter and Ryan can judge whether focused placement lands the small objects —
 * the curb, the bench — that the all-at-once analyzer misses. Nothing here is
 * buyer-facing; it exists to answer whether the feature is worth building.
 */

import { useState } from 'react';
import type { PhotoAnnotation } from '@/lib/spot/annotationTypes.js';

interface PreviewResponse {
  model: string;
  minConfidence: number;
  annotations: PhotoAnnotation[];
}

const MODELS = ['claude-opus-4-8', 'claude-sonnet-5'];

export default function SpotAnnotationPreview() {
  const [sessionId, setSessionId] = useState('');
  const [model, setModel] = useState(MODELS[0]);
  const [minConfidence, setMinConfidence] = useState(0.5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreviewResponse | null>(null);

  async function run() {
    const id = sessionId.trim();
    if (!id) {
      setError('Enter a session id.');
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/spot/admin/annotation-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId: id, model, minConfidence }),
      });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Preview failed.');
        return;
      }
      setResult(data as PreviewResponse);
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-ink-900">Annotation preview</h1>
      <p className="mt-1 text-sm text-ink-500">
        Internal only. Re-places a session&rsquo;s stored findings one at a time and shows the pins.
        Spends per finding; nothing is saved.
      </p>

      <div className="mt-6 space-y-4 rounded-md border border-surface-200 bg-surface-50 p-4">
        <div>
          <label htmlFor="sessionId" className="block text-sm font-medium text-ink-900">
            Session id
          </label>
          <input
            id="sessionId"
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="uuid of the Spot session"
            className="mt-1 block min-h-[44px] w-full rounded-md border border-control-border px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-ink-900">
              Model
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-1 block min-h-[44px] rounded-md border border-control-border px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="minConfidence" className="block text-sm font-medium text-ink-900">
              Min confidence: {minConfidence.toFixed(2)}
            </label>
            <input
              id="minConfidence"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="mt-3 block w-48"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="inline-flex min-h-[44px] items-center rounded-md bg-accent-500 px-4 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {busy ? 'Placing findings…' : 'Run preview'}
        </button>

        {error ? (
          <p role="alert" className="text-sm text-danger-500">
            {error}
          </p>
        ) : null}
      </div>

      {result ? (
        <div className="mt-8 space-y-10">
          <p className="text-sm text-ink-500">
            {result.model} · pins shown at confidence ≥ {result.minConfidence.toFixed(2)}
          </p>
          {result.annotations.map((ann, i) => (
            <PhotoCard key={`${ann.photoUrl}-${i}`} ann={ann} index={i} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

type Selection = number | 'all' | null;

function PhotoCard({ ann, index }: { ann: PhotoAnnotation; index: number }) {
  const [selected, setSelected] = useState<Selection>(ann.pins.length > 0 ? 0 : null);

  return (
    <section aria-label={`Photo ${index + 1}`}>
      <div className="relative overflow-hidden rounded-md border border-surface-200">
        <img src={ann.photoUrl} alt={`Screened photo ${index + 1}`} className="block w-full" />
        {ann.pins.map((p, i) => {
          const show = selected === 'all' || selected === i;
          if (!show) return null;
          const critical = p.severity === 'critical';
          return (
            <span
              key={i}
              aria-hidden="true"
              style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
              className={`absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${
                critical ? 'bg-danger-500 ring-2 ring-danger-500 ring-offset-1' : 'bg-accent-500'
              }`}
            />
          );
        })}
      </div>

      {ann.pins.length === 0 ? (
        <p className="mt-2 text-sm text-ink-500">No pins placed on this photo.</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <PinButton active={selected === 'all'} onClick={() => setSelected('all')}>
            Show all
          </PinButton>
          {ann.pins.map((p, i) => (
            <PinButton key={i} active={selected === i} onClick={() => setSelected(i)}>
              <span
                aria-hidden="true"
                className={`mr-2 inline-block h-3 w-3 rounded-full ${
                  p.severity === 'critical' ? 'bg-danger-500' : 'bg-accent-500'
                }`}
              />
              {p.label}
              <span className="ml-2 text-ink-500">{Math.round(p.confidence * 100)}%</span>
            </PinButton>
          ))}
        </div>
      )}
    </section>
  );
}

function PinButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-[44px] items-center rounded-md border px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 ${
        active ? 'border-accent-500 bg-accent-50 text-ink-900' : 'border-surface-200 text-ink-900'
      }`}
    >
      {children}
    </button>
  );
}
