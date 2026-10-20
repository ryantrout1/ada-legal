#!/usr/bin/env node
/**
 * inspect-pdf-fields.mjs: list a PDF's form fields, pages and checksum.
 *
 * Used when adding a state to the civil rights complaint page: run it on
 * the agency's PDF, then write the field map in src/lib/civilRights/states/.
 * For words that have no field (e.g. "circle all that apply"), use
 * `pdftotext -bbox` to get positions (PDF y = page height - yMax).
 *
 * Usage: node scripts/inspect-pdf-fields.mjs path/to/form.pdf
 */

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PDFDocument } from 'pdf-lib';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/inspect-pdf-fields.mjs <file.pdf>');
  process.exit(1);
}

const bytes = readFileSync(file);
const doc = await PDFDocument.load(bytes);
const pages = doc.getPages();
console.log(`sha256 ${createHash('sha256').update(bytes).digest('hex')}`);
console.log(`pages  ${pages.length}`);

const fields = doc.getForm().getFields();
console.log(`fields ${fields.length}`);
for (const f of fields) {
  for (const w of f.acroField.getWidgets()) {
    const r = w.getRectangle();
    const pageIndex = pages.findIndex((p) => p.ref === w.P());
    console.log(
      [
        f.constructor.name.padEnd(14),
        `p${pageIndex}`,
        `x${Math.round(r.x)} y${Math.round(r.y)} w${Math.round(r.width)} h${Math.round(r.height)}`,
        JSON.stringify(f.getName()),
      ].join('  '),
    );
  }
}
