/**
 * AdminEmailCopyDetail — what one email actually says.
 *
 * Read-only in Phase A. The boxes are here, and the Save and Revert
 * controls that go beside them arrive in Phase B.
 *
 * WHY BOTH VALUES ARE SHOWN. Each variant renders the wording that will
 * go out, and — when it differs — the original underneath it. Otherwise
 * "someone changed this" and "this is how it shipped" look identical, and
 * the reviewer cannot tell which she is approving.
 *
 * VARIABLES ARE SHOWN, NOT TYPED. The chips under each box are the only
 * placeholders that slot accepts. Phase B refuses anything else by name.
 *
 * Ref: /plan the email editing screen, Phase A.
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

interface Variant {
  reading_level: 'simple' | 'standard' | 'professional';
  value: string;
  default: string;
  is_edited: boolean;
  updated_by: string | null;
}

interface Slot {
  key: string;
  varied: boolean;
  variables: string[];
  variants: Variant[];
}

interface Detail {
  key: string;
  recipient: string;
  trigger: string;
  slots: Slot[];
  storage_ready: boolean;
}

const LEVEL_LABEL: Record<Variant['reading_level'], string> = {
  simple: 'Simple',
  standard: 'Standard',
  professional: 'Professional',
};

/** `next_steps_qualified` reads as nothing; "Next steps qualified" reads as something. */
function slotLabel(key: string): string {
  const s = key.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function AdminEmailCopyDetail() {
  const { key = '' } = useParams();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const resp = await fetch(`/api/admin/email-copy/${encodeURIComponent(key)}`, {
          credentials: 'include',
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        setDetail((await resp.json()) as Detail);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [key]);

  const boxClass =
    'w-full rounded-md border border-control-border bg-surface-50 px-3 py-2 text-ink-900 whitespace-pre-wrap';

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link
        to="/admin/email"
        className="inline-flex min-h-[44px] items-center text-accent-600 underline underline-offset-2"
      >
        ← All emails
      </Link>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {error}
        </div>
      )}

      {loading && <p className="mt-4 text-ink-700">Loading…</p>}

      {detail && (
        <>
          <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mt-4 mb-1">
            {detail.trigger}
          </h1>
          <p className="text-sm text-ink-500 mb-6">
            Reading only. Changing these comes next.
          </p>

          {detail.slots.map((slot) => (
            <section key={slot.key} className="mb-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-700 mb-2">
                {slotLabel(slot.key)}
              </h2>

              {slot.variants.map((v) => (
                <div key={v.reading_level} className="mb-3">
                  {slot.varied && (
                    <p className="text-xs font-semibold text-ink-500 mb-1">
                      {LEVEL_LABEL[v.reading_level]}
                    </p>
                  )}
                  <p className={boxClass}>{v.value}</p>
                  {v.is_edited && (
                    <p className="mt-1 text-xs text-ink-500">
                      Edited{v.updated_by ? ` by ${v.updated_by}` : ''}. Originally: “{v.default}”
                    </p>
                  )}
                </div>
              ))}

              {slot.variables.length > 0 && (
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                  <span>Fills in automatically:</span>
                  {slot.variables.map((name) => (
                    <code
                      key={name}
                      className="rounded bg-surface-100 px-2 py-0.5 font-mono text-ink-700"
                    >
                      {`{{${name}}}`}
                    </code>
                  ))}
                </p>
              )}
            </section>
          ))}
        </>
      )}
    </div>
  );
}
