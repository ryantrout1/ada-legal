/**
 * useAdminSpotReports — the data layer behind /admin/spot-review and its
 * detail page.
 *
 * Both pages need the same list, the same four write actions, and the same
 * delivery-failure wording, so all of it lives here rather than being
 * duplicated across two components. The list endpoint is the only source of
 * row metadata: /api/spot/admin/report returns the report body and nothing
 * about who paid or what state it is in, so the detail page loads the list
 * too and picks its row out of it.
 */

import { useCallback, useEffect, useState } from 'react';
import type { SpotReportContent } from '@/lib/spot/reportSchema';

export type SpotHitlStatus = 'pending_review' | 'released' | 'rejected';

export interface SpotReportRow {
  id: string;
  sessionId: string;
  slug: string;
  modelVersion: string | null;
  hitlStatus: string;
  sentAt: string | null;
  createdAt: string;
  buyerName: string | null;
  buyerEmail: string | null;
}

export interface SpotReportBody {
  content: SpotReportContent;
  photos: string[];
  photosPurged: boolean;
}

/**
 * Why a send did not happen, in words a reviewer can act on. no_buyer_email
 * is terminal — retrying will never fix it — so it says so rather than
 * inviting a loop.
 */
export const SPOT_DELIVERY_MESSAGE: Record<string, string> = {
  no_buyer_email:
    'Released, but there is no email address on file for this buyer. Resending will not help until an address is found.',
  send_failed: 'Released, but the email did not send. Use Send again to try again.',
};

export function useAdminSpotReports() {
  const [reports, setReports] = useState<SpotReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/spot/admin/reports', { credentials: 'include' });
      if (res.status === 401) {
        setUnauthenticated(true);
        setReports([]);
        return;
      }
      if (!res.ok) throw new Error('load failed');
      const data = (await res.json()) as { reports: SpotReportRow[] };
      setReports(data.reports ?? []);
      setUnauthenticated(false);
      setError(null);
    } catch {
      setError('Could not load reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const post = useCallback(
    async (path: string, body: Record<string, string>): Promise<unknown | null> => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(`/api/spot/admin/${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          setError(`${path} failed.`);
          return null;
        }
        const data: unknown = await res.json().catch(() => ({}));
        await load();
        return data;
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  const release = useCallback(
    async (slug: string) => {
      const data = (await post('release', { slug })) as
        | { released: boolean; sent: boolean; reason?: string }
        | null;
      // release matches only pending_review, so a second call returns
      // released:false without reaching any send. Never tell the reviewer to
      // press it again.
      if (data?.released && !data.sent) {
        setError(SPOT_DELIVERY_MESSAGE[data.reason ?? ''] ?? 'Released, but the email did not send.');
      }
    },
    [post],
  );

  const reject = useCallback(async (slug: string) => void (await post('reject', { slug })), [post]);

  const resend = useCallback(
    async (slug: string) => {
      const data = (await post('resend', { slug })) as { sent: boolean; reason?: string } | null;
      if (data && !data.sent) {
        setError(SPOT_DELIVERY_MESSAGE[data.reason ?? ''] ?? 'The email did not send.');
      }
    },
    [post],
  );

  const regenerate = useCallback(
    async (sessionId: string, model: string) => void (await post('regenerate', { sessionId, model })),
    [post],
  );

  return {
    reports,
    loading,
    unauthenticated,
    error,
    setError,
    busy,
    reload: load,
    release,
    reject,
    resend,
    regenerate,
  };
}

/** Fetches one report body. Returns null on any failure — the caller shows
 *  its own empty state rather than a thrown error. */
export async function fetchSpotReportBody(slug: string): Promise<SpotReportBody | null> {
  try {
    const res = await fetch(`/api/spot/admin/report?slug=${encodeURIComponent(slug)}`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      report: { content: SpotReportContent };
      photos?: string[];
      photosPurged?: boolean;
    };
    return {
      content: data.report.content,
      photos: data.photos ?? [],
      photosPurged: data.photosPurged ?? false,
    };
  } catch {
    return null;
  }
}
