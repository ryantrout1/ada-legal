/**
 * Fill a state's agency PDF with the person's answers.
 *
 * Runs in the browser (and in tests on Node), so the PDF never travels
 * through our servers. The result stays a fillable form: nothing is
 * flattened, every value can still be edited in a PDF reader, and the
 * signature and date are left blank for the person.
 *
 * Steps:
 *   1. Check the template's SHA-256 against the config, so a changed
 *      agency edition fails loudly instead of filling the wrong boxes.
 *   2. Set the agency's own fields.
 *   3. Flow long answers across the agency's single-line fields; anything
 *      that does not fit continues on the added page.
 *   4. Draw "circle all that apply" marks.
 *   5. Add one fillable "Additional information" page (more pages only if
 *      a long answer needs them) ending with the declaration and blank
 *      signature/date fields.
 *
 * Font: the agency fields use Helvetica, which cannot draw every
 * character. Letters it lacks fall back to the plain letter (é -> e only
 * when é itself is missing), then to "?". Values stay editable in the PDF.
 */

import {
  PDFBool,
  PDFDict,
  PDFDocument,
  PDFName,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFForm,
  type PDFPage,
} from 'pdf-lib';
import { buildSummary } from './summary.js';
import type { Answers, StateConfig } from './types.js';

const FIELD_SIZE = 10;
const LINE = 12;
const MARGIN = 54;
const PAGE: [number, number] = [612, 792];

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Make text drawable in a standard font without throwing. */
export function safeText(font: PDFFont, text: string): string {
  let out = '';
  for (const ch of text.normalize('NFC')) {
    if (ch === '\n') {
      out += ch;
      continue;
    }
    if (canDraw(font, ch)) {
      out += ch;
      continue;
    }
    const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    out += base && canDraw(font, base) ? base : '?';
  }
  return out;
}

function canDraw(font: PDFFont, ch: string): boolean {
  try {
    font.widthOfTextAtSize(ch, FIELD_SIZE);
    return true;
  } catch {
    return false;
  }
}

/** A wrapped line, and whether it ends a paragraph of the source text. */
export interface WrappedLine {
  text: string;
  end: boolean;
}

/** Word-wrap to a width, by real font metrics, remembering paragraph ends. */
export function wrapLines(font: PDFFont, text: string, width: number, size = FIELD_SIZE): WrappedLine[] {
  const out: WrappedLine[] = [];
  for (const para of text.split('\n')) {
    if (!para.trim()) {
      out.push({ text: '', end: true });
      continue;
    }
    const lines: string[] = [];
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      // A single word wider than the line is broken by characters.
      let rest = word;
      while (font.widthOfTextAtSize(rest, size) > width) {
        let i = rest.length - 1;
        while (i > 1 && font.widthOfTextAtSize(rest.slice(0, i), size) > width) i--;
        lines.push(rest.slice(0, i));
        rest = rest.slice(i);
      }
      line = rest;
    }
    if (line) lines.push(line);
    lines.forEach((t, i) => out.push({ text: t, end: i === lines.length - 1 }));
  }
  return out;
}

export function wrap(font: PDFFont, text: string, width: number, size = FIELD_SIZE): string[] {
  return wrapLines(font, text, width, size).map((l) => l.text);
}

/**
 * Turn wrapped lines back into text for a multiline field: paragraph ends
 * stay line breaks, soft wraps become spaces so the PDF reader wraps them
 * to its own metrics (no ragged double wrapping).
 */
export function unwrap(lines: WrappedLine[]): string {
  return lines.map((l, i) => l.text + (i === lines.length - 1 ? '' : l.end ? '\n' : ' ')).join('');
}

function fieldWidth(form: PDFForm, name: string): number {
  const w = form.getTextField(name).acroField.getWidgets()[0];
  return w.getRectangle().width - 4;
}

interface ExtraBlock {
  name: string;
  label: string;
  value: string;
  multiline: boolean;
}

export async function fillPdf(
  config: StateConfig,
  answers: Answers,
  templateBytes: Uint8Array,
): Promise<Uint8Array> {
  const actual = await sha256Hex(templateBytes);
  if (actual !== config.pdf.sha256) {
    throw new Error(`The ${config.name} form template has changed (checksum ${actual}).`);
  }

  const doc = await PDFDocument.load(templateBytes);
  const form = doc.getForm();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const plan = config.pdf.plan(answers, buildSummary(config, answers));

  // 2. The agency's own fields. A name that is not on the form is a
  // mapping bug, so it throws rather than quietly dropping the answer.
  for (const [name, value] of Object.entries(plan.fields)) {
    const f = form.getTextField(name);
    f.setFontSize(FIELD_SIZE);
    f.setText(safeText(font, value ?? ''));
  }

  // 3. Long answers across single-line fields, overflow to the added page.
  const extras: ExtraBlock[] = [];
  for (const g of plan.lineGroups) {
    const width = Math.min(...g.fields.map((n) => fieldWidth(form, n)));
    // Blank lines are dropped here: the agency gives few lines, so they go to words.
    const wrapped = wrapLines(font, safeText(font, g.text), width).filter((l) => l.text);
    const n = g.fields.length;
    let fits = wrapped.map((l) => l.text);
    let rest: WrappedLine[] = [];
    if (wrapped.length > n) {
      // Last line becomes the pointer; everything from there continues.
      fits = [...fits.slice(0, n - 1), '(continued on the Additional Information page)'];
      rest = wrapped.slice(n - 1);
    }
    g.fields.forEach((name, i) => {
      const f = form.getTextField(name);
      f.setFontSize(FIELD_SIZE);
      f.setText(fits[i] ?? '');
    });
    if (rest.length) {
      extras.push({
        name: `extra_${g.fields[0].slice(0, 12).replace(/\W+/g, '_')}_cont`,
        label: g.overflowLabel,
        value: unwrap(rest),
        multiline: true,
      });
    }
  }

  // 4. Circles.
  const pages = doc.getPages();
  for (const c of plan.circles) {
    pages[c.page].drawEllipse({
      x: c.x + c.width / 2,
      y: c.y + c.height / 2,
      xScale: c.width / 2,
      yScale: c.height / 2,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.25,
    });
  }

  // 5. The added page(s).
  const blocks: ExtraBlock[] = [
    ...plan.extraPage.items.map((i) => ({ ...i, multiline: !!i.multiline })),
    ...extras,
  ];
  writeExtraPages(doc, form, font, bold, plan.extraPage, blocks);

  form.updateFieldAppearances(font);
  // Field defaults now say "/Helvetica"; register it in the form's shared
  // resources so a reader redrawing a field finds the font.
  registerFormFont(doc, form, font);
  // Ask PDF readers to redraw field appearances themselves, so edits made
  // later in any reader render correctly.
  form.acroForm.dict.set(PDFName.of('NeedAppearances'), PDFBool.True);

  return doc.save({ updateFieldAppearances: false });
}

function registerFormFont(doc: PDFDocument, form: PDFForm, font: PDFFont): void {
  const acro = form.acroForm.dict;
  let dr = acro.lookupMaybe(PDFName.of('DR'), PDFDict);
  if (!dr) {
    dr = doc.context.obj({});
    acro.set(PDFName.of('DR'), dr);
  }
  let fonts = dr.lookupMaybe(PDFName.of('Font'), PDFDict);
  if (!fonts) {
    fonts = doc.context.obj({});
    dr.set(PDFName.of('Font'), fonts);
  }
  fonts.set(PDFName.of(font.name), font.ref);
}

function writeExtraPages(
  doc: PDFDocument,
  form: PDFForm,
  font: PDFFont,
  bold: PDFFont,
  extra: { title: string; intro: string; declaration: string },
  blocks: ExtraBlock[],
): void {
  const width = PAGE[0] - MARGIN * 2;
  let page: PDFPage = doc.addPage(PAGE);
  let y = PAGE[1] - MARGIN;

  const newPage = () => {
    page = doc.addPage(PAGE);
    y = PAGE[1] - MARGIN;
  };
  const text = (s: string, f: PDFFont, size: number) => {
    for (const l of wrap(f, safeText(f, s), width, size)) {
      if (y - size < MARGIN) newPage();
      y -= size + 2;
      page.drawText(l, { x: MARGIN, y, size, font: f });
    }
  };
  const field = (name: string, value: string, height: number, w = width, multiline = false) => {
    const f = form.createTextField(name);
    if (multiline) f.enableMultiline();
    // addToPage first: it writes the field's default appearance (font),
    // which setFontSize needs.
    f.addToPage(page, { x: MARGIN, y: y - height, width: w, height, font, borderWidth: 0.75 });
    f.setFontSize(FIELD_SIZE);
    f.setText(value);
    y -= height + 10;
  };

  text(extra.title, bold, 16);
  y -= 4;
  text(extra.intro, font, 10);
  y -= 8;

  for (const b of blocks) {
    const value = safeText(font, b.value ?? '');
    if (!b.multiline) {
      if (y - 40 < MARGIN) newPage();
      text(b.label, bold, 10);
      y -= 2;
      field(b.name, value, 20);
      continue;
    }
    // Multiline: size the box to the text, splitting across pages if needed.
    // Sized with a narrower width than the box, so the estimate is generous.
    const lines = wrapLines(font, value, width - 24);
    let part = 1;
    let start = 0;
    do {
      if (y - 60 < MARGIN) newPage();
      text(part === 1 ? b.label : `${b.label} (part ${part})`, bold, 10);
      y -= 2;
      const room = Math.floor((y - MARGIN - 8) / LINE);
      const take = Math.max(1, Math.min(lines.length - start, room));
      const chunk = unwrap(lines.slice(start, start + take));
      field(part === 1 ? b.name : `${b.name}_${part}`, chunk, Math.max(48, take * LINE + 8), width, true);
      start += take;
      part++;
    } while (start < lines.length);
  }

  if (y - 110 < MARGIN) newPage();
  y -= 6;
  text(extra.declaration, font, 10);
  y -= 10;
  text('Signature', bold, 10);
  y -= 2;
  field('signature', '', 24, 300);
  text('Date', bold, 10);
  y -= 2;
  field('signature_date', '', 22, 150);
}
