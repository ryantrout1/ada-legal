/**
 * Resolves whether a POST /api/ada/session request should mark the
 * created session as a field-capture test session (is_test=true).
 *
 * Why a gate exists at all: /photo (the field-test capture page) needs
 * to flag its sessions so they don't pollute production session
 * analytics. Random callers, including bots probing the API, must NOT
 * be able to opt their sessions out of analytics just by sending
 * `is_test: true` in the body. We require an opt-in header that the
 * /photo client sends explicitly. The header isn't real auth (anyone
 * inspecting the /photo page can copy it), but it documents intent
 * and prevents accidental tagging.
 *
 * Strictness:
 *   - is_test must be the boolean literal `true`. Any other shape
 *     (string "true", number 1, missing) is treated as not requested.
 *   - The header must be exactly "1". Any other value (including
 *     "true", "yes", empty string) is treated as absent.
 *   - VercelRequest.headers values can be string | string[] | undefined.
 *     If an array, we use the first element — matches how Node
 *     represents repeated request headers.
 *
 * Ref: /plan: /photo field-test capture page, Phase 1.
 */

export const FIELD_CAPTURE_HEADER = 'x-ada-field-capture';
export const FIELD_CAPTURE_HEADER_VALUE = '1';

export interface FieldCaptureFlagInput {
  body: { is_test?: unknown };
  header: string | string[] | null | undefined;
}

export function resolveFieldCaptureFlag(input: FieldCaptureFlagInput): boolean {
  if (input.body.is_test !== true) return false;
  const raw = input.header;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === FIELD_CAPTURE_HEADER_VALUE;
}
