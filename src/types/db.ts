/**
 * Typed shapes for every jsonb column in the schema.
 *
 * These interfaces are the contract between the application code and the
 * Postgres row. Drizzle uses them via $type<...>() to give us type-safe
 * reads and writes.
 *
 * When a shape evolves, update here first, then either:
 *   - back-compat read (new fields optional): no migration needed
 *   - breaking change: add a migration that updates existing rows
 *
 * See docs/ARCHITECTURE.md §3 for the schema source of truth.
 */

// ─── conversation + session state ─────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'tool';

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  timestamp: string;
}

export interface ToolResult {
  id: string;
  name: string;
  result: unknown;
  is_error?: boolean;
  timestamp: string;
}

export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result' | 'image';
  [key: string]: unknown;
}

export interface Message {
  role: MessageRole;
  content: string | ContentBlock[];
  timestamp: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ExtractedField {
  value: unknown;
  confidence: number; // 0..1
  extracted_at: string;
}

export type ExtractedFields = Record<string, ExtractedField>;

export type AdaTitle =
  | 'I'             // Employment — EEOC jurisdiction
  | 'II'            // State / local government
  | 'III'           // Public accommodation (private business)
  | 'class_action'  // Matches pattern of an active class action (Phase D populates candidate registry)
  | 'out_of_scope'  // Not ADA-covered, but Ada still documents and refers out
  | 'none';         // Legacy value: no ADA issue identified (prefer 'out_of_scope' going forward)

export type ConfidenceTier = 'high' | 'medium' | 'low';

export interface Classification {
  title: AdaTitle;
  tier: ConfidenceTier;
  reasoning: string;
  standard: string; // cited section, e.g. '§404.2.3' or '28 CFR §35.130'
  /**
   * When title === 'class_action', the slug of the matched class action
   * in the class_actions registry (Phase D, Step 26). Always null in
   * Step 18 — the registry does not yet exist. Reserved now so the
   * schema is stable when the registry ships.
   */
  class_action_candidate?: string | null;
}

// ─── observability ────────────────────────────────────────────────────────────

export interface InvokedTool {
  name: string;
  args: Record<string, unknown>;
  timestamp: string;
  result_kind?: 'ok' | 'rejected' | 'error';
}

export interface IntentChange {
  from: string;
  to: string;
  timestamp: string;
}

export interface ConfidenceHistoryEntry {
  tier: ConfidenceTier;
  timestamp: string;
}

export interface SessionMetadata {
  tools_invoked?: InvokedTool[];
  intent_changes?: IntentChange[];
  confidence_history?: ConfidenceHistoryEntry[];
  outcome?: string;
  abandoned_at_step?: string;
  duration_ms?: number;
  message_count?: number;
  input_tokens_total?: number;
  output_tokens_total?: number;
  /**
   * Photos the user attached during the session. Persisted so the
   * attorney-routing package (Phase C/D) can include the actual
   * images, not just Ada's text description of them. URLs are
   * public blob URLs from Vercel Blob with unguessable random paths.
   */
  photos?: AttachedPhoto[];
  /**
   * If the session was opened via a Talk-to-Ada CTA from a Standards
   * Guide chapter or deep-dive guide page, we record which page the
   * user came from. This lets Ada open the conversation by
   * acknowledging the topic they were reading about, and (Commit 6)
   * reference the same page back in her replies.
   *
   * Step 29, Commit 5.
   */
  page_context?: PageContext;
}

export interface AttachedPhoto {
  url: string;
  uploadedAt: string;
}

/**
 * Where the user came from when they hit the Talk-to-Ada CTA.
 *
 *   - kind 'chapter': Standards Guide chapter page. `ref` is the
 *     chapter number as a string ('1'..'10'). `title` is the chapter
 *     title (e.g. "Accessible Routes").
 *   - kind 'guide':   Deep-dive guide page under /standards-guide/guide/.
 *     `ref` is the URL slug ('ramps', 'hotels-lodging', etc.).
 *     `title` is the human-readable title.
 *
 * Kept deliberately small and stable: only the three fields Ada needs
 * to reference the source in her replies. Additional fields (e.g.
 * section anchor, reading level at click time) can be added later
 * without a migration since this rides in jsonb.
 */
export interface PageContext {
  kind: 'chapter' | 'guide';
  ref: string;
  title: string;
}

// Matches docs/DO_NOT_TOUCH.md rule 12: reading levels are exactly these three.
export type ReadingLevel = 'simple' | 'standard' | 'professional';

export type DisplayMode = 'default' | 'dark' | 'warm' | 'low-vision' | 'high-contrast';
export type FontSize = 'default' | 'large' | 'xlarge';

export interface AccessibilityChange {
  setting: string;
  from: string;
  to: string;
  timestamp: string;
}

export interface AccessibilitySnapshot {
  display_mode?: DisplayMode;
  font_size?: FontSize;
  font_family?: string;
  line_spacing?: string;
  screen_reader_detected?: boolean;
  reading_level?: ReadingLevel;
  changes?: AccessibilityChange[];
}

// ─── photo analysis ───────────────────────────────────────────────────────────

export type PhotoFindingSeverity = 'critical' | 'major' | 'minor' | 'advisory';

export interface PhotoBoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PhotoFinding {
  finding: string;
  severity: PhotoFindingSeverity;
  standard: string; // cited ADA / ADAAG section
  confidence: number; // 0..1
  bounding_box?: PhotoBoundingBox;
  /**
   * URL path into the Standards Guide covering the cited section. Set
   * by the analyze_photo tool after the LLM returns its findings;
   * resolved via topicsForSection() in src/lib/standardsIndex.ts.
   *
   * When the cited section maps to a topic with a deep-dive guide
   * (e.g. §405.2 -> /standards-guide/guide/ramps), that URL is used.
   * When only a chapter exists (e.g. §304 -> Ch. 3), the chapter URL
   * is used. When no match, the field is omitted.
   *
   * Step 29, Commit 7.
   */
  guide_url?: string;
}

// ─── audit log ────────────────────────────────────────────────────────────────

export type AuditActorType = 'user' | 'ada' | 'staff' | 'system' | 'webhook';

export interface AuditMetadata {
  [key: string]: unknown;
}

// ─── quality checks ───────────────────────────────────────────────────────────

export interface QualityCheckFailure {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface QualityCheckWarning {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ─── Ch1: listings + routing ──────────────────────────────────────────────────

export type FieldType = 'date' | 'string' | 'enum' | 'number' | 'yes_no' | 'free_text';

export interface FieldSpec {
  name: string;
  description: string;
  required: boolean;
  type: FieldType;
  enum_values?: string[];
  validation_hint?: string;
}

export type EligibilityCriterionKind = 'required' | 'preferred' | 'disqualifying';

export interface EligibilityCriterion {
  description: string;
  kind: EligibilityCriterionKind;
}

export interface RoutingJurisdiction {
  state: string; // e.g. 'AZ'
  city?: string; // optional narrower match
}
