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

export type AdaTitle = 'I' | 'II' | 'III' | 'none';
export type ConfidenceTier = 'high' | 'medium' | 'low';

export interface Classification {
  title: AdaTitle;
  tier: ConfidenceTier;
  reasoning: string;
  standard: string; // cited section, e.g. '§404.2.3' or '28 CFR §35.130'
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
