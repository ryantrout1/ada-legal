/**
 * AdminEmailCopy — every email the site sends, in one place.
 *
 * Until now the only way to see what a claimant receives was to read four
 * renderer files, and the only way to change a sentence was a commit and
 * a deploy. The standing rule is that Gina reviews all claimant- and
 * attorney-facing copy; this is the first screen where that review can
 * actually happen.
 *
 * Read-only for now. Editing lands in Phase B.
 *
 * WHAT EACH CARD SAYS. Who receives it and what makes it send, in plain
 * words, because "claimant_handoff" tells you nothing about which of the
 * three claimant emails you are about to open.
 *
 * Ref: /plan the email editing screen, Phase A.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface TemplateSummary {
  key: string;
  recipient: 'claimant' | 'firm' | 'admin';
  trigger: string;
  slot_count: number;
  edited_count: number;
}

const RECIPIENT_LABEL: Record<TemplateSummary['recipient'], string> = {
  claimant: 'Goes to the person',
  firm: 'Goes to the firm',
  admin: 'Goes to us',
};

export default function AdminEmailCopy() {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [storageReady, setStorageReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const resp = await fetch('/api/admin/email-copy', { credentials: 'include' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = (await resp.json()) as {
          templates: TemplateSummary[];
          storage_ready: boolean;
        };
        setTemplates(data.templates);
        setStorageReady(data.storage_ready);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">Email</h1>
      <p className="text-ink-700 mb-6">
        Every email this site sends. Open one to read exactly what it says.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {error}
        </div>
      )}

      {!error && !storageReady && (
        // Honest state rather than a Save button that would fail. The
        // table lands with migration 0048.
        <div
          role="status"
          className="mb-4 rounded-md border border-control-border bg-surface-100 px-4 py-3 text-sm text-ink-700"
        >
          Showing the original wording. Saved changes can&rsquo;t be read yet, so nothing here has
          been edited.
        </div>
      )}

      {loading && <p className="text-ink-700">Loading…</p>}

      {!loading && !error && (
        <ul className="space-y-3">
          {templates.map((t) => (
            <li key={t.key}>
              <Link
                to={`/admin/email/${t.key}`}
                className="flex min-h-[44px] flex-col gap-1 rounded-lg border border-control-border bg-surface-0 px-4 py-3 hover:bg-surface-100"
              >
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-semibold text-ink-900">{RECIPIENT_LABEL[t.recipient]}</span>
                  <span className="text-xs text-ink-500">
                    {t.slot_count} {t.slot_count === 1 ? 'piece of wording' : 'pieces of wording'}
                  </span>
                  {t.edited_count > 0 && (
                    <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-semibold text-accent-600">
                      {t.edited_count} edited
                    </span>
                  )}
                </span>
                <span className="text-sm text-ink-700">{t.trigger}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
