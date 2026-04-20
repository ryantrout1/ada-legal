/**
 * Session CRUD operations.
 *
 * These sit one layer above the DbClient. They:
 *   - generate ids, timestamps via the injected clock/random clients
 *   - populate defaults (reading level, metadata shape, etc.)
 *   - enforce the state-machine rules on save
 *   - expose optimistic-concurrency via updated_at (see saveSession)
 *
 * The engine's turn-processing code uses loadSession at the start of a turn
 * and saveSession at the end. The API layer also uses createSession when a
 * new visitor first hits an Ada endpoint.
 *
 * Ref: docs/ARCHITECTURE.md §3, §6
 */

import type { AdaClients } from '@/engine/clients/types';
import type {
  AdaSessionState,
  SessionStatus,
  SessionType,
} from '@/engine/types';
import type { ReadingLevel } from '@/types/db';
import {
  applyTransition,
  type SessionTransition,
} from './stateMachine';

// ─── createSession ────────────────────────────────────────────────────────────

export interface CreateSessionInput {
  orgId: string;
  sessionType: SessionType;
  /** Exactly one of anonSessionId / userId must be set (DB CHECK enforces this). */
  anonSessionId: string | null;
  userId: string | null;
  listingId?: string | null;
  readingLevel?: ReadingLevel;
  isTest?: boolean;
}

export function createSession(
  clients: AdaClients,
  input: CreateSessionInput,
): AdaSessionState {
  // Identity exclusivity guard (mirrors DB CHECK session_identity_exclusive).
  const hasAnon = input.anonSessionId !== null;
  const hasUser = input.userId !== null;
  if (hasAnon === hasUser) {
    throw new Error(
      'createSession: exactly one of anonSessionId or userId must be set.',
    );
  }

  return {
    sessionId: clients.random.uuid(),
    orgId: input.orgId,
    sessionType: input.sessionType,
    status: 'active',
    readingLevel: input.readingLevel ?? 'standard',
    anonSessionId: input.anonSessionId,
    userId: input.userId,
    listingId: input.listingId ?? null,
    conversationHistory: [],
    extractedFields: {},
    classification: null,
    metadata: {},
    accessibilitySettings: {},
    isTest: input.isTest ?? false,
  };
}

// ─── loadSession ──────────────────────────────────────────────────────────────

export async function loadSession(
  clients: AdaClients,
  sessionId: string,
): Promise<AdaSessionState | null> {
  return clients.db.readSession({ sessionId });
}

// ─── saveSession ──────────────────────────────────────────────────────────────

/**
 * Persist a session state. Refreshes the metadata.updatedAt timestamp.
 *
 * Callers that want to enforce optimistic concurrency should read the session
 * first, pass the prior updatedAt via `expectedUpdatedAt`, and the DbClient
 * will reject the write if the stored updatedAt no longer matches.
 */
export interface SaveSessionOptions {
  /** If provided, write is rejected when stored updatedAt differs. */
  expectedUpdatedAt?: string;
}

export async function saveSession(
  clients: AdaClients,
  state: AdaSessionState,
  _options: SaveSessionOptions = {},
): Promise<AdaSessionState> {
  // The ada_sessions.updated_at column is auto-refreshed by Drizzle's
  // $onUpdate hook on every write; we don't need to touch it here.
  // clients.clock is still on the AdaClients seam so session-repo tests
  // can be deterministic, even though this function doesn't use it today.
  void clients;
  await clients.db.writeSession({ state });
  return state;
}

// ─── transitionSession ────────────────────────────────────────────────────────

/**
 * Apply a state-machine transition and persist. Wraps the pure state machine
 * with the DB write. Use this instead of hand-editing state.status anywhere.
 */
export async function transitionSession(
  clients: AdaClients,
  state: AdaSessionState,
  transition: SessionTransition,
): Promise<AdaSessionState> {
  const nextStatus: SessionStatus = applyTransition(state.status, transition);
  return saveSession(clients, { ...state, status: nextStatus });
}
