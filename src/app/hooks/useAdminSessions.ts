/**
 * useAdminSessions — fetches the paginated session list for admin.
 *
 * Always sends the Clerk session token via credentials:'include' so
 * the server can authenticate via the cookie. If the response is
 * 401, `unauthenticated` flips true and the UI can prompt sign-in.
 */

import { useCallback, useEffect, useState } from 'react';

export type SessionStatus = 'active' | 'completed' | 'abandoned';
export type ReadingLevel = 'simple' | 'standard' | 'professional';

export interface AdminSessionSummary {
  session_id: string;
  status: SessionStatus;
  reading_level: ReadingLevel;
  classification_title: string | null;
  message_count: number;
  extracted_field_count: number;
  created_at: string;
  updated_at: string;
  is_test: boolean;
}

export interface SessionsFilters {
  status: SessionStatus | '';
  includeTest: boolean;
  page: number;
}

const DEFAULT_FILTERS: SessionsFilters = {
  status: '',
  includeTest: false,
  page: 1,
};

const PAGE_SIZE = 25;

export function useAdminSessions() {
  const [sessions, setSessions] = useState<AdminSessionSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<SessionsFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthenticated, setUnauthenticated] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.includeTest) params.set('include_test', 'true');
      params.set('page', String(filters.page));
      params.set('page_size', String(PAGE_SIZE));

      const resp = await fetch(`/api/admin/sessions?${params.toString()}`, {
        credentials: 'include',
      });
      if (resp.status === 401) {
        setUnauthenticated(true);
        return;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as {
        sessions: AdminSessionSummary[];
        total_count: number;
      };
      setSessions(data.sessions);
      setTotalCount(data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return {
    sessions,
    totalCount,
    filters,
    setFilters,
    loading,
    error,
    unauthenticated,
    totalPages,
    pageSize: PAGE_SIZE,
    reload: load,
  };
}
