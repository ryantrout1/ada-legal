/**
 * /api/admin/listings/[id]/config
 *
 *   GET — fetch the listing_config for a listing (or null)
 *   PUT — upsert the listing_config (create if missing, replace if present)
 *
 * Admin-only. Validates the structured shapes: eligibility_criteria
 * (list of { description, kind }), required_fields (list of
 * { name, description, required, type }), disqualifying_conditions
 * (list of strings).
 *
 * Ref: Step 25, Commit 4.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../../../_admin.js';
import { makeClientsFromEnv } from '../../../_shared.js';
import type { ListingConfigRow } from '../../../../src/engine/clients/types.js';

const VALID_KINDS = new Set(['required', 'preferred', 'disqualifying']);
const VALID_FIELD_TYPES = new Set([
  'date',
  'string',
  'enum',
  'number',
  'yes_no',
  'free_text',
]);

interface EligibilityCriterionShape {
  description: string;
  kind: 'required' | 'preferred' | 'disqualifying';
}

interface RequiredFieldShape {
  name: string;
  description: string;
  required: boolean;
  type: 'date' | 'string' | 'enum' | 'number' | 'yes_no' | 'free_text';
  enum_values?: string[];
  validation_hint?: string;
}

function validateCriteria(raw: unknown): EligibilityCriterionShape[] | { error: string } {
  if (!Array.isArray(raw)) return { error: 'eligibility_criteria must be an array' };
  const out: EligibilityCriterionShape[] = [];
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (!c || typeof c !== 'object') {
      return { error: `eligibility_criteria[${i}] must be an object` };
    }
    const obj = c as Record<string, unknown>;
    if (typeof obj.description !== 'string' || !obj.description.trim()) {
      return {
        error: `eligibility_criteria[${i}].description is required`,
      };
    }
    if (typeof obj.kind !== 'string' || !VALID_KINDS.has(obj.kind)) {
      return {
        error: `eligibility_criteria[${i}].kind must be 'required', 'preferred', or 'disqualifying'`,
      };
    }
    out.push({
      description: obj.description.trim(),
      kind: obj.kind as EligibilityCriterionShape['kind'],
    });
  }
  return out;
}

function validateFields(raw: unknown): RequiredFieldShape[] | { error: string } {
  if (!Array.isArray(raw)) return { error: 'required_fields must be an array' };
  const out: RequiredFieldShape[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < raw.length; i++) {
    const f = raw[i];
    if (!f || typeof f !== 'object') {
      return { error: `required_fields[${i}] must be an object` };
    }
    const obj = f as Record<string, unknown>;
    if (typeof obj.name !== 'string' || !obj.name.trim()) {
      return { error: `required_fields[${i}].name is required` };
    }
    const name = obj.name.trim();
    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      return {
        error: `required_fields[${i}].name must be snake_case (letters, digits, underscores; start with a letter)`,
      };
    }
    if (seen.has(name)) {
      return { error: `required_fields: duplicate name '${name}'` };
    }
    seen.add(name);
    if (typeof obj.description !== 'string' || !obj.description.trim()) {
      return { error: `required_fields[${i}].description is required` };
    }
    if (typeof obj.required !== 'boolean') {
      return { error: `required_fields[${i}].required must be a boolean` };
    }
    if (typeof obj.type !== 'string' || !VALID_FIELD_TYPES.has(obj.type)) {
      return {
        error: `required_fields[${i}].type must be one of: date, string, enum, number, yes_no, free_text`,
      };
    }
    const field: RequiredFieldShape = {
      name,
      description: obj.description.trim(),
      required: obj.required,
      type: obj.type as RequiredFieldShape['type'],
    };
    if (field.type === 'enum') {
      if (
        !Array.isArray(obj.enum_values) ||
        obj.enum_values.length === 0 ||
        !obj.enum_values.every((v) => typeof v === 'string' && v.trim())
      ) {
        return {
          error: `required_fields[${i}].enum_values must be a non-empty array of strings when type is 'enum'`,
        };
      }
      field.enum_values = obj.enum_values as string[];
    }
    if (obj.validation_hint !== undefined) {
      if (typeof obj.validation_hint !== 'string') {
        return {
          error: `required_fields[${i}].validation_hint must be a string`,
        };
      }
      field.validation_hint = obj.validation_hint;
    }
    out.push(field);
  }
  return out;
}

function validateDisqualifying(raw: unknown): string[] | { error: string } {
  if (!Array.isArray(raw)) {
    return { error: 'disqualifying_conditions must be an array' };
  }
  const out: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const d = raw[i];
    if (typeof d !== 'string' || !d.trim()) {
      return {
        error: `disqualifying_conditions[${i}] must be a non-empty string`,
      };
    }
    out.push(d.trim());
  }
  return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  const clients = makeClientsFromEnv();
  const org = await clients.db.getOrgByCode('adall');
  if (!org) {
    return res.status(500).json({ error: 'Default organization not found' });
  }

  // Verify listing exists and belongs to this org
  const listing = await clients.db.readListingById(id);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }
  const firm = await clients.db.readLawFirmById(listing.lawFirmId);
  if (!firm || firm.orgId !== org.id) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  if (req.method === 'GET') {
    const existing = await clients.db.readListingConfigForListing(id);
    return res.status(200).json({ config: existing });
  }

  if (req.method === 'PUT') {
    const body = (req.body ?? {}) as Record<string, unknown>;

    if (typeof body.case_description !== 'string') {
      return res
        .status(400)
        .json({ error: 'case_description must be a string (empty is allowed)' });
    }

    const criteria = validateCriteria(body.eligibility_criteria ?? []);
    if ('error' in criteria) return res.status(400).json(criteria);

    const fields = validateFields(body.required_fields ?? []);
    if ('error' in fields) return res.status(400).json(fields);

    const disqualifying = validateDisqualifying(body.disqualifying_conditions ?? []);
    if ('error' in disqualifying) return res.status(400).json(disqualifying);

    let adaPromptOverride: string | null;
    if (body.ada_prompt_override === undefined || body.ada_prompt_override === null) {
      adaPromptOverride = null;
    } else if (typeof body.ada_prompt_override === 'string') {
      adaPromptOverride = body.ada_prompt_override.trim() || null;
    } else {
      return res
        .status(400)
        .json({ error: 'ada_prompt_override must be a string or null' });
    }

    const existing = await clients.db.readListingConfigForListing(id);
    const row: ListingConfigRow = {
      id: existing?.id ?? randomUUID(),
      listingId: id,
      caseDescription: body.case_description,
      eligibilityCriteria: criteria,
      requiredFields: fields,
      disqualifyingConditions: disqualifying,
      adaPromptOverride,
    };

    try {
      await clients.db.writeListingConfig(row);
      return res.status(200).json({ config: row });
    } catch (err) {
      console.error('[admin/listings/:id/config PUT] failed:', err);
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Method not allowed' });
}
