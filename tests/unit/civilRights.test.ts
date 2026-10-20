/**
 * Civil rights complaint page (state AG intake questionnaire) - pure rules.
 *
 * Encodes /plan "State civil rights complaint page" Phase 1:
 *   AC1 registry: /civil-rights/az and /civil-rights/arizona resolve to one state
 *   AC2 a new state is config only (exercised with a throwaway test state)
 *   AC3 no LLM anywhere in the flow
 *   AC6 the narrative is a fixed template of the person's own answers
 *   AC7 no date math against "today"; deadline note is the same for any date
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  resolveState,
  listStates,
  CANONICAL_PATH,
} from '../../src/lib/civilRights/states/index.js';
import { AZ } from '../../src/lib/civilRights/states/az.js';
import { validateAnswers } from '../../src/lib/civilRights/validate.js';
import { buildSummary } from '../../src/lib/civilRights/summary.js';
import { deadlineNote } from '../../src/lib/civilRights/copy.js';
import type { StateConfig } from '../../src/lib/civilRights/types.js';
import { validAz } from '../support/civilRightsFixture.js';

describe('state registry (AC1)', () => {
  it('resolves the code and the name to the same Arizona config', () => {
    expect(resolveState('az')).toBe(AZ);
    expect(resolveState('arizona')).toBe(AZ);
    expect(resolveState('Arizona')).toBe(AZ);
    expect(resolveState('AZ')).toBe(AZ);
  });

  it('canonical path is the readable name', () => {
    expect(CANONICAL_PATH(AZ)).toBe('/civil-rights/arizona');
  });

  it('returns null for unknown or empty input', () => {
    expect(resolveState('california')).toBeNull();
    expect(resolveState('')).toBeNull();
    expect(resolveState(undefined)).toBeNull();
  });

  it('lists Arizona as the only live state (no invented coming-soon list)', () => {
    expect(listStates().map((s) => s.code)).toEqual(['az']);
  });

  it('Arizona v1 is disability + public accommodation only', () => {
    expect(AZ.area).toBe('public_accommodation');
    expect(AZ.basis).toBe('disability');
  });

  it('Arizona deadline wording is the AG brochure text with its source', () => {
    expect(AZ.deadline.area).toBe('Public Accommodations');
    expect(AZ.deadline.limit).toBe('180 days');
    expect(AZ.deadline.from).toBe('From the last alleged discriminatory act');
    expect(AZ.deadline.sourceUrl).toMatch(/^https:\/\/(www\.)?azag\.gov\//);
  });
});

describe('validateAnswers (AC4 shape, required fields)', () => {
  it('accepts a complete answer set and normalizes it', () => {
    const r = validateAnswers(AZ, validAz());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.complainant_name).toBe('Jordan Rivera');
      expect(r.value.ongoing).toBe('yes');
    }
  });

  it('trims whitespace and drops keys the config does not know', () => {
    const r = validateAnswers(AZ, {
      ...validAz(),
      complainant_name: '  Jordan Rivera  ',
      injected: 'x',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.complainant_name).toBe('Jordan Rivera');
      expect('injected' in r.value).toBe(false);
    }
  });

  it.each([
    'complainant_name',
    'phone',
    'address1',
    'city',
    'state',
    'zip',
    'respondent_name',
    'respondent_city',
    'respondent_state',
    'what_happened',
    'last_incident_date',
    'ongoing',
    'has_attorney',
    'legal_action_pending',
  ])('requires %s', (field) => {
    const r = validateAnswers(AZ, { ...validAz(), [field]: '' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.field)).toContain(field);
  });

  it.each([
    'email',
    'address2',
    'alt_contact_name',
    'alt_contact_phone',
    'respondent_company',
    'respondent_address1',
    'respondent_zip',
    'witnesses',
    'first_incident_date',
    'other_agencies',
    'additional_comments',
  ])('%s is optional', (field) => {
    expect(validateAnswers(AZ, { ...validAz(), [field]: '' }).ok).toBe(true);
  });

  it('requires the attorney name/address only when they have an attorney', () => {
    const r = validateAnswers(AZ, { ...validAz(), has_attorney: 'yes', attorney_name_address: '' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0].field).toBe('attorney_name_address');
    expect(
      validateAnswers(AZ, {
        ...validAz(),
        has_attorney: 'yes',
        attorney_name_address: 'Pat Lee, 1 Law Way, Phoenix AZ',
      }).ok,
    ).toBe(true);
  });

  it('rejects malformed email, zip, state, yes/no and dates', () => {
    const bad = (patch: Record<string, string>) => {
      const r = validateAnswers(AZ, { ...validAz(), ...patch });
      return r.ok ? [] : r.errors.map((e) => e.field);
    };
    expect(bad({ email: 'not-an-email' })).toContain('email');
    expect(bad({ zip: '8520' })).toContain('zip');
    expect(bad({ state: 'ZZ' })).toContain('state');
    expect(bad({ ongoing: 'maybe' })).toContain('ongoing');
    expect(bad({ last_incident_date: '2026-02-30' })).toContain('last_incident_date');
    expect(bad({ last_incident_date: '09/14/2026' })).toContain('last_incident_date');
  });

  it('accepts ZIP+4', () => {
    expect(validateAnswers(AZ, { ...validAz(), zip: '85201-1234' }).ok).toBe(true);
  });

  it('rejects a first date after the last date (two answers, no "today")', () => {
    const r = validateAnswers(AZ, {
      ...validAz(),
      first_incident_date: '2026-10-01',
      last_incident_date: '2026-09-14',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0].field).toBe('first_incident_date');
  });

  it('rejects text over the field limit instead of cutting it off', () => {
    const r = validateAnswers(AZ, { ...validAz(), what_happened: 'x'.repeat(6001) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0].field).toBe('what_happened');
  });

  it('every field has a non-empty label and a step', () => {
    for (const f of AZ.fields) {
      expect(f.label.length, f.key).toBeGreaterThan(0);
      expect(AZ.steps.some((s) => s.fields.includes(f.key)), f.key).toBe(true);
    }
  });
});

describe('buildSummary (AC6)', () => {
  it('matches the fixed template exactly', () => {
    const r = validateAnswers(AZ, validAz());
    if (!r.ok) throw new Error('fixture invalid');
    expect(buildSummary(AZ, r.value)).toBe(
      [
        'Type of complaint: Public accommodation, disability.',
        'Business: Desert Grill (Desert Grill LLC), 22 E Center St, Mesa, AZ 85201.',
        '',
        'What happened, in my own words:',
        'The only entrance has three steps and no ramp. I could not get in.',
        '',
        'First time: 03/02/2026. Last time: 09/14/2026. Still happening: Yes.',
        'Witnesses: Sam Rivera',
      ].join('\n'),
    );
  });

  it('says "Not given" for empty optional parts', () => {
    const r = validateAnswers(AZ, {
      ...validAz(),
      respondent_company: '',
      respondent_address1: '',
      respondent_zip: '',
      first_incident_date: '',
      witnesses: '',
      ongoing: 'no',
    });
    if (!r.ok) throw new Error('fixture invalid');
    const s = buildSummary(AZ, r.value);
    expect(s).toContain('Business: Desert Grill, Mesa, AZ.');
    expect(s).toContain('First time: Not given. Last time: 09/14/2026. Still happening: No.');
    expect(s).toContain('Witnesses: None listed');
  });

  it('carries no ADA Legal Link analysis or legal conclusions', () => {
    const r = validateAnswers(AZ, validAz());
    if (!r.ok) throw new Error('fixture invalid');
    const s = buildSummary(AZ, r.value).toLowerCase();
    for (const banned of [
      'ada legal link',
      'violation',
      'violates',
      'likely',
      'we found',
      'our analysis',
      'non-compliant',
      'noncompliant',
      'deadline',
      'late',
    ]) {
      expect(s, banned).not.toContain(banned);
    }
  });
});

describe('deadline note never judges lateness (AC7)', () => {
  it('reads the same for any incident date', () => {
    expect(deadlineNote(AZ)).toBe(deadlineNote(AZ));
    expect(deadlineNote.length).toBe(1); // takes the config only, never a date
    expect(deadlineNote(AZ)).toContain('180 days');
  });

  it('a years-old incident still validates', () => {
    expect(validateAnswers(AZ, { ...validAz(), first_incident_date: '', last_incident_date: '2019-01-05' }).ok).toBe(true);
  });

  it('no civil rights module reads the clock', () => {
    for (const file of walk('src/lib/civilRights')) {
      const src = readFileSync(file, 'utf8');
      expect(src, file).not.toMatch(/Date\.now|new Date\(/);
    }
  });
});

describe('no LLM in the flow (AC3)', () => {
  it('civil rights code never touches Anthropic or Ada', () => {
    const files = [
      ...walk('src/lib/civilRights'),
      ...walk('api/public/civil-rights'),
    ];
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      expect(src, file).not.toMatch(/@anthropic-ai|processAdaTurn|\/api\/ada|engine\/prompt|claudeModels/);
    }
  });
});

describe('adding a state is config only (AC2)', () => {
  it('a throwaway state runs through validate + summary with no code change', () => {
    const TEST: StateConfig = {
      ...AZ,
      code: 'zz',
      slug: 'testland',
      name: 'Testland',
      agencyName: 'Testland Civil Rights Office',
    };
    const r = validateAnswers(TEST, validAz());
    expect(r.ok).toBe(true);
    if (r.ok) expect(buildSummary(TEST, r.value)).toContain('Desert Grill');
  });
});

function walk(dir: string): string[] {
  let out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out = out.concat(walk(p));
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}
