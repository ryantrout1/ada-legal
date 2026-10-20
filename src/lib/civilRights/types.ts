/**
 * State civil rights complaint page: shared types.
 *
 * Each state is one `StateConfig`. The wizard, the validator, the narrative
 * template, the save endpoint and (Phase 2) the PDF filler all read from it,
 * so adding a state is a new config file plus a registry line, not a
 * rebuild. Nothing in this module family calls an LLM or reads the clock.
 */

/** How a field is entered and checked. */
export type FieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'usState'
  | 'zip'
  | 'date'
  | 'yesno';

export interface FieldSpec {
  /** Stable key; also the answers-object key and (snake_case) the column. */
  key: string;
  label: string;
  kind: FieldKind;
  /** Always required. */
  required?: boolean;
  /** Required only when another answer equals a value. */
  requiredWhen?: { field: string; equals: string };
  /** Hard limit; longer input is rejected, never silently cut. */
  maxLength: number;
  /** Short help shown under the label. Draft copy until Gina approves. */
  hint?: string;
  /** HTML autocomplete token, so phones can fill the person's own details. */
  autocomplete?: string;
}

/** One wizard screen. One or two questions each. */
export interface StepSpec {
  id: string;
  title: string;
  fields: string[];
}

export interface DeadlineWording {
  /** The agency's own words, kept verbatim. */
  area: string;
  limit: string;
  from: string;
  sourceUrl: string;
}

export interface SubmissionChannel {
  kind: 'online' | 'mail' | 'phone';
  label: string;
  /** URL, mailing address or phone number, exactly as the agency lists it. */
  value: string;
}

export interface StateConfig {
  /** Two-letter code, lower case. Stored on every row. */
  code: string;
  /** Canonical URL segment: /civil-rights/<slug>. */
  slug: string;
  name: string;
  agencyName: string;
  formName: string;
  /** The agency form edition this config maps (e.g. "2024"). */
  formVersion: string;
  formUrl: string;
  /** v1 scope, pre-selected on the form. */
  area: 'public_accommodation';
  basis: 'disability';
  areaLabel: string;
  basisLabel: string;
  deadline: DeadlineWording;
  channels: SubmissionChannel[];
  fields: FieldSpec[];
  steps: StepSpec[];
  pdf: PdfTemplate;
}

/**
 * How one state's agency PDF gets filled. The template is the agency's own
 * file, served from /public; the checksum pins the exact edition mapped.
 */
export interface PdfTemplate {
  /** Public URL path, e.g. /forms/az/civil_rights_intake_form-2024.pdf */
  path: string;
  sha256: string;
  plan: (answers: Answers, summary: string) => PdfFillPlan;
}

/** A group of single-line agency fields that one long answer flows across. */
export interface LineGroup {
  fields: string[];
  text: string;
  /** Label for the continuation on the added page if it does not fit. */
  overflowLabel: string;
}

/** A circle drawn on the agency page (paper forms say "circle all that apply"). */
export interface CircleMark {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtraPageItem {
  /** Field name for the new fillable field. */
  name: string;
  label: string;
  value: string;
  multiline?: boolean;
}

export interface PdfFillPlan {
  /** Agency field name -> value. */
  fields: Record<string, string>;
  lineGroups: LineGroup[];
  circles: CircleMark[];
  /** One added page, fully fillable, for answers the paper form has no room for. */
  extraPage: {
    title: string;
    intro: string;
    items: ExtraPageItem[];
    /** Declaration text shown above blank signature and date fields. */
    declaration: string;
  };
}

/** Clean answers: every configured key present, trimmed, '' when blank. */
export type Answers = Record<string, string>;

export interface FieldError {
  field: string;
  message: string;
}

export type ValidationResult =
  | { ok: true; value: Answers }
  | { ok: false; errors: FieldError[] };
