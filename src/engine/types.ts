/**
 * Engine-level types.
 *
 * These describe Ada's state and I/O at the engine boundary. They are
 * independent of:
 *   - the database row shapes (see @/types/db)
 *   - the HTTP API shapes (those will live in src/api/)
 *   - the Anthropic SDK shapes
 *
 * The engine translates DB rows into AdaSessionState, runs a turn,
 * and hands back an AdaTurnResult. The API layer is responsible for
 * persisting the result and streaming to the user.
 */

import type {
  Message,
  ExtractedFields,
  Classification,
  SessionMetadata,
  AccessibilitySnapshot,
  ReadingLevel,
  PhotoFinding,
} from '@/types/db';

// ─── Session state ────────────────────────────────────────────────────────────

export type SessionStatus = 'active' | 'completed' | 'abandoned';
export type SessionType = 'public_ada' | 'class_action_intake' | 'gov_intake';

export interface AdaSessionState {
  sessionId: string;
  orgId: string;
  sessionType: SessionType;
  status: SessionStatus;
  readingLevel: ReadingLevel;

  // Identity (exactly one set; mirrors DB CHECK constraint)
  anonSessionId: string | null;
  userId: string | null;

  // Channel context (Ch1+)
  listingId: string | null;

  // Conversation state
  conversationHistory: Message[];
  extractedFields: ExtractedFields;
  classification: Classification | null;

  // Observability
  metadata: SessionMetadata;
  accessibilitySettings: AccessibilitySnapshot;
  isTest: boolean;
}

// ─── Turn I/O ─────────────────────────────────────────────────────────────────

export interface AdaTurnInput {
  userMessage: string;
  photoBlobKeys?: string[];
}

export interface AdaTurnResult {
  nextState: AdaSessionState;
  assistantMessage: Message;
  photoFindings?: PhotoFinding[];
  // Transcript of tool calls made during this turn, for logging.
  toolInvocations: ToolInvocation[];
}

export interface ToolInvocation {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
  isError: boolean;
  timestamp: string;
}
