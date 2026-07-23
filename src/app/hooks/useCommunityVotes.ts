/**
 * useCommunityVotes — tallies + one-shot voting for the CommunityVoices
 * poll.
 *
 * Reads /api/public/votes on mount and records a vote through the same
 * endpoint. Votes are optimistic: the tally bumps locally the moment
 * someone clicks, because waiting on a round-trip to acknowledge an
 * opinion feels broken. A failed write leaves the optimistic count in
 * place rather than snapping backwards — the alternative punishes the
 * voter for our outage.
 *
 * `hasVoted` is local-only (sessionStorage would be a nicer guarantee,
 * but browser storage is out of scope here and the server accepts
 * duplicates by design — this poll is a sentiment signal, not a ballot).
 */

import { useCallback, useEffect, useState } from 'react';

interface VotesResponse {
  tallies?: Record<string, number>;
}

export function useCommunityVotes() {
  const [tallies, setTallies] = useState<Record<string, number>>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch('/api/public/votes');
        if (!resp.ok) throw new Error(String(resp.status));
        const body = (await resp.json()) as VotesResponse;
        if (!cancelled) setTallies(body.tallies ?? {});
      } catch {
        if (!cancelled) setTallies({});
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const vote = useCallback(
    (optionId: string) => {
      if (!optionId || hasVoted) return;
      setHasVoted(true);
      setTallies((t) => ({ ...t, [optionId]: (t[optionId] ?? 0) + 1 }));
      void fetch('/api/public/votes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ option_id: optionId }),
        keepalive: true,
      }).catch(() => {});
    },
    [hasVoted],
  );

  return { tallies, hasVoted, loaded, vote };
}
