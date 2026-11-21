// Browser-only PDF helpers. Nothing here sends the PDF anywhere.
import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFRadioGroup,
  PDFTextField,
  StandardFonts,
  rgb,
} from "pdf-lib";
import type { AcroKind, ExtractedField, Field, Placement } from "./types";

type TextItem = { str: string; x: number; y: number; w: number; size: number };
export type TextLine = { id: string; page: number; text: string; items: TextItem[]; x: number; y: number; size: number };
export type AcroInfo = { name: string; kind: AcroKind; options: string[] | null; nearby: string };
export type ParsedPdf = { acro: AcroInfo[]; lines: TextLine[]; text: string };

const MAX_PAGES = 6;

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  if (!pdfjs.GlobalWorkerOptions.workerSrc)
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  return pdfjs;
}

async function readTextLines(bytes: Uint8Array): Promise<TextLine[]> {
  const pdfjs = await loadPdfjs();
  // pdfjs transfers the buffer to its worker, so hand it a copy.
  const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const out: TextLine[] = [];
  for (let p = 1; p <= Math.min(doc.numPages, MAX_PAGES); p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const items: TextItem[] = [];
    for (const it of content.items) {
      if (!("str" in it) || !it.str.trim()) continue;
      const t = it.transform as number[];
      items.push({ str: it.str, x: t[4], y: t[5], w: it.width, size: Math.hypot(t[0], t[1]) || 10 });
    }
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    const lines: TextItem[][] = [];
    for (const it of items) {
      const line = lines.find((l) => Math.abs(l[0].y - it.y) < Math.max(3, it.size * 0.5));
      if (line) line.push(it);
      else lines.push([it]);
    }
    lines.forEach((l, i) => {
      l.sort((a, b) => a.x - b.x);
      out.push({
        id: `p${p}-L${i + 1}`,
        page: p - 1,
        text: l.map((x) => x.str).join(" ").replace(/\s+/g, " ").trim(),
        items: l,
        x: l[0].x,
        y: l[0].y,
        size: l[0].size,
      });
    });
  }
  await doc.cleanup();
  return out;
}

export async function parsePdf(bytes: Uint8Array): Promise<ParsedPdf> {
  const lines = await readTextLines(bytes);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = doc.getPages();
  const acro: AcroInfo[] = [];
  for (const f of doc.getForm().getFields()) {
    let kind: AcroKind;
    let options: string[] | null = null;
    if (f instanceof PDFTextField) kind = "text";
    else if (f instanceof PDFCheckBox) kind = "checkbox";
    else if (f instanceof PDFRadioGroup) {
      kind = "radio";
      options = f.getOptions();
    } else if (f instanceof PDFDropdown) {
      kind = "dropdown";
      options = f.getOptions();
    } else continue; // buttons, signatures
    if (f.isReadOnly()) continue;

    let nearby = "";
    const widget = f.acroField.getWidgets()[0];
    if (widget) {
      const r = widget.getRectangle();
      const pageRef = widget.P();
      const pageIdx = Math.max(0, pages.findIndex((pg) => pg.ref === pageRef));
      const midY = r.y + r.height / 2;
      const sameRow = lines.filter((l) => l.page === pageIdx && Math.abs(l.y - midY) < 12);
      nearby = sameRow
        .flatMap((l) => l.items)
        .filter((it) => it.x + it.w <= r.x + 4 && it.x > r.x - 260)
        .map((it) => it.str)
        .join(" ");
      // Checkboxes usually have their text to the right.
      if (!nearby.trim() && kind === "checkbox") {
        nearby = sameRow
          .flatMap((l) => l.items)
          .filter((it) => it.x >= r.x + r.width - 2)
          .map((it) => it.str)
          .join(" ");
      }
      if (!nearby.trim()) {
        const above = lines
          .filter((l) => l.page === pageIdx && l.y > r.y + r.height && l.y < r.y + r.height + 24)
          .sort((a, b) => a.y - b.y)[0];
        nearby = above?.text ?? "";
      }
    }
    acro.push({ name: f.getName(), kind, options, nearby: nearby.trim().slice(0, 200) });
  }
  return { acro, lines, text: lines.map((l) => l.text).join("\n") };
}

// Rough Helvetica-like glyph widths, good enough to find where a dotted/underscored blank starts.
const glyphW = (s: string) =>
  [...s].reduce((w, c) => w + (/[.,:;'|il ]/.test(c) ? 0.28 : c === "_" ? 0.556 : /[A-Z]/.test(c) ? 0.67 : 0.53), 0);

const isBlank = (s: string) => /^[\s_.\-…:]*$/.test(s) && /[_.…]{3,}/.test(s);

// Where to write a value for a form that has no fillable fields: just after its printed label.
function overlayPlacement(ref: string, label: string, lines: TextLine[]): Placement | null {
  const line = lines.find((l) => l.id === ref);
  if (!line) return null;
  const firstWord = label.toLowerCase().split(/\s+/)[0] ?? "";
  let start = line.items.findIndex((it) => it.str.toLowerCase().includes(firstWord));
  if (start < 0) start = 0;
  let end = start;
  while (end + 1 < line.items.length && !isBlank(line.items[end + 1].str) && !line.items[end].str.includes(":")) end++;
  const it = line.items[end];
  // If the label item itself ends with a run of underscores/dots, write over the blank part.
  const blankAt = it.str.search(/[_.…]{3,}/);
  const x = blankAt > 0 ? it.x + (it.w * glyphW(it.str.slice(0, blankAt))) / glyphW(it.str) + 4 : it.x + it.w + 6;
  return { kind: "overlay", page: line.page, x, y: line.y + 1, size: Math.min(12, Math.max(9, line.size)) };
}

export function placeFields(extracted: ExtractedField[], parsed: ParsedPdf): Field[] {
  const acroByName = new Map(parsed.acro.map((a) => [a.name, a]));
  const out: Field[] = [];
  const seen = new Set<string>();
  for (const f of extracted) {
    if (seen.has(f.id)) continue;
    let placement: Placement | null = null;
    const a = acroByName.get(f.ref);
    if (a) placement = { kind: "acro", name: a.name, acroKind: a.kind };
    else if (parsed.acro.length === 0) placement = overlayPlacement(f.ref, f.label, parsed.lines);
    if (!placement) continue;
    seen.add(f.id);
    out.push({ ...f, options: f.options ?? a?.options ?? null, placement });
  }
  return out;
}

// Standard PDF fonts only cover Latin-1; drop anything else rather than crash.
const toWinAnsi = (s: string) => s.replace(/[^\x20-\x7E\xA0-\xFF]/g, "").trim();

export async function fillPdf(bytes: Uint8Array, fields: Field[], values: Record<string, string>) {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form = doc.getForm();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();

  for (const f of fields) {
    const raw = values[f.id];
    if (!raw) continue;
    const v = toWinAnsi(raw);
    if (!v) continue;
    const p = f.placement;
    try {
      if (p.kind === "overlay") {
        pages[p.page]?.drawText(v, { x: p.x, y: p.y, size: p.size, font, color: rgb(0.05, 0.15, 0.55) });
        continue;
      }
      if (p.acroKind === "text") {
        const tf = form.getTextField(p.name);
        const max = tf.getMaxLength();
        tf.setText(max ? v.slice(0, max) : v);
      } else if (p.acroKind === "checkbox") {
        const cb = form.getCheckBox(p.name);
        if (/^(yes|y|true|haan|han|ha)$/i.test(v)) cb.check();
        else cb.uncheck();
      } else {
        const ctl = p.acroKind === "radio" ? form.getRadioGroup(p.name) : form.getDropdown(p.name);
        const opt = ctl.getOptions().find((o) => o.toLowerCase() === v.toLowerCase());
        if (opt) ctl.select(opt);
      }
    } catch (err) {
      console.warn(`Could not fill ${f.id}`, err);
    }
  }
  form.updateFieldAppearances(font);
  return doc.save();
}
