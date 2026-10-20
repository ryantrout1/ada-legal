/**
 * Civil rights complaint page: filling the agency PDF.
 *
 * Encodes /plan "State civil rights complaint page" Phase 2 (AC5): the
 * output is the AG's 2024 form, filled, still fillable (not flattened),
 * with signature/declaration left blank and Public Accommodation +
 * Disability marked.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { AZ } from '../../src/lib/civilRights/states/az.js';
import { fillPdf, safeText, sha256Hex, wrap } from '../../src/lib/civilRights/fillPdf.js';
import { validateAnswers } from '../../src/lib/civilRights/validate.js';
import { validAz } from '../support/civilRightsFixture.js';

const TEMPLATE = new Uint8Array(readFileSync('public' + AZ.pdf.path));
const NARRATIVE = 'documents that will help explain what happened to you';

function answers(patch: Record<string, string> = {}) {
  const r = validateAnswers(AZ, { ...validAz(), ...patch });
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.value;
}

async function fillAndRead(patch: Record<string, string> = {}) {
  const out = await fillPdf(AZ, answers(patch), TEMPLATE);
  const doc = await PDFDocument.load(out);
  const form = doc.getForm();
  const get = (n: string) => form.getTextField(n).getText() ?? '';
  return { doc, form, get, out };
}

describe('AZ template', () => {
  it('is the pinned 2024 edition', async () => {
    expect(await sha256Hex(TEMPLATE)).toBe(AZ.pdf.sha256);
  });

  it('refuses a template that does not match the checksum', async () => {
    const changed = TEMPLATE.slice();
    changed[changed.length - 10] ^= 0xff;
    await expect(fillPdf(AZ, answers(), changed)).rejects.toThrow(/template has changed/);
  });

  it('every agency field the plan names exists on the form', async () => {
    const doc = await PDFDocument.load(TEMPLATE);
    const names = new Set(doc.getForm().getFields().map((f) => f.getName()));
    const plan = AZ.pdf.plan(answers(), 'x');
    for (const n of Object.keys(plan.fields)) expect(names.has(n), n).toBe(true);
    for (const g of plan.lineGroups) for (const n of g.fields) expect(names.has(n), n).toBe(true);
  });
});

describe('fillPdf (AC5)', () => {
  it('fills both columns of page 1', async () => {
    const { get } = await fillAndRead();
    expect(get('Name')).toBe('Jordan Rivera');
    expect(get('Address')).toBe('100 W Main St');
    expect(get('Address_3')).toBe('Apt 4');
    expect(get('City')).toBe('Mesa');
    expect(get('State')).toBe('AZ');
    expect(get('Zip')).toBe('85201');
    expect(get('Phone')).toBe('602-555-0142');
    expect(get('Business Name')).toBe('Desert Grill (Desert Grill LLC)');
    expect(get('Address_2')).toBe('22 E Center St');
    expect(get('City_2')).toBe('Mesa');
    expect(get('first time')).toBe('03/02/2026');
    expect(get('Last Time')).toBe('09/14/2026');
    expect(get('When')).toBe(''); // box sits on a table rule; left empty on purpose
  });

  it('the narrative starts with the fixed-template summary', async () => {
    const { get } = await fillAndRead();
    expect(get(`${NARRATIVE} 1`)).toBe('Type of complaint: Public accommodation, disability.');
  });

  it('stays fillable: agency fields plus added fields, nothing flattened', async () => {
    const { form, doc } = await fillAndRead();
    const names = form.getFields().map((f) => f.getName());
    expect(names.length).toBeGreaterThan(35);
    expect(names).toContain('extra_email');
    expect(names).toContain('signature');
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(3);
  });

  it('online-only answers land on the added page', async () => {
    const { get } = await fillAndRead({ legal_action_pending: 'yes' });
    expect(get('extra_email')).toBe('jordan@example.com');
    expect(get('extra_alt_name')).toBe('Sam Rivera');
    expect(get('extra_alt_phone')).toBe('602-555-0199');
    expect(get('extra_ongoing')).toBe('Yes');
    expect(get('extra_legal_action')).toBe('Yes');
  });

  it('signature and date are left blank for the person', async () => {
    const { get } = await fillAndRead();
    expect(get('signature')).toBe('');
    expect(get('signature_date')).toBe('');
  });

  it('attorney and agency lines say "No" when that is the answer', async () => {
    const { get } = await fillAndRead();
    expect(get('Do you have an attorney If the answer is yes please tell us the name and address of your attorney 1')).toBe('No');
    expect(get('crimination If the answer is yes please state the name and address of the agency 1')).toBe('No');
  });

  it('a long story continues on the added page and nothing is lost', async () => {
    const story = Array.from({ length: 80 }, (_, i) => `Sentence number ${i + 1} about the entrance.`).join(' ');
    const { get, form } = await fillAndRead({ what_happened: story });
    expect(get(`${NARRATIVE} 8`)).toBe('(continued on the Additional Information page)');
    const all = form
      .getFields()
      .filter((f) => f.getName().startsWith(NARRATIVE) || f.getName().includes('_cont'))
      .map((f) => form.getTextField(f.getName()).getText() ?? '')
      .join(' ')
      .replace(/\s+/g, ' ');
    expect(all).toContain('Sentence number 1 about');
    expect(all).toContain('Sentence number 80 about the entrance.');
  });

  it('marks Public Accommodations, Disability and the Continuous answer (3 circles)', async () => {
    const plan = AZ.pdf.plan(answers(), 'x');
    expect(plan.circles).toHaveLength(3);
    expect(plan.circles[2].x).toBe(395); // "Yes"
    expect(AZ.pdf.plan(answers({ ongoing: 'no' }), 'x').circles[2].x).toBe(431); // "No"
  });

  it('names Helvetica cannot draw still produce a PDF', async () => {
    const { get } = await fillAndRead({ complainant_name: 'Nguyễn Văn Anh 李' });
    expect(get('Name')).toMatch(/^Nguy.n V.n Anh \?$/);
  });
});

describe('text helpers', () => {
  it('safeText keeps what Helvetica can draw', async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    expect(safeText(font, 'José Peña')).toBe('José Peña');
    expect(safeText(font, '✓')).toBe('?');
  });

  it('wrap never exceeds the width', async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (const l of wrap(font, 'x'.repeat(400) + ' short words here', 200)) {
      expect(font.widthOfTextAtSize(l, 10)).toBeLessThanOrEqual(200);
    }
  });
});
