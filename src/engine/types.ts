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
  PhotoAnalysisOutput,
  PhotoFinding,
} from '../types/db.js';

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

  /**
   * Step 22: routing destinations available to the `route` tool this
   * turn. Populated by processAdaTurn from evaluateRoutingRules. Not
   * persisted to DB — this is an in-turn side channel so the route
   * tool executor can verify a target_org_id without re-querying
   * routing_rules. Safe to be undefined on persisted state loads.
   */
  routingMatches?: import('./routing/evaluate.js').RoutingMatch[];
}

// ─── Turn I/O ─────────────────────────────────────────────────────────────────

export interface AdaTurnInput {
  userMessage: string;
  photoBlobKeys?: string[];
  /**
   * Optional fire-and-forget callback invoked with each text delta as
   * the model streams. Used by the SSE-mode API handler to forward
   * tokens to the browser. Errors thrown inside the callback are
   * swallowed so a buggy listener cannot break the engine.
   *
   * Fires for text emitted alongside tool_use blocks too — that's the
   * conversational preamble the user should see before tool work starts.
   */
  onTextDelta?: (delta: string) => void;
}

export interface AdaTurnResult {
  nextState: AdaSessionState;
  assistantMessage: Message;
  photoFindings?: PhotoFinding[];
  /**
   * Full structured photo-analysis outputs from any analyze_photo
   * calls during this turn. Each entry covers up to 3 photos and
   * carries scene/summary/overall_risk/positive_findings alongside
   * its findings list. `photoFindings` is the flat aggregation
   * across all entries, kept for legacy callers. Step 30, Commit 8.
   */
  photoAnalyses?: PhotoAnalysisOutput[];
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
