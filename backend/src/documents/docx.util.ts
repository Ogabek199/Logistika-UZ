import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';
import { execFile } from 'child_process';
import PizZip from 'pizzip';
import * as libre from 'libreoffice-convert';

const convertAsync = promisify(libre.convert);
const execFileAsync = promisify(execFile);

/**
 * These .docx templates keep their text split across many <w:r>/<w:t> runs
 * (Word does this because of spell-check / rsid metadata). Replacing values
 * therefore has to work across run boundaries, so we flatten every text node
 * into one "plain" string, run the replacements there and write the result
 * back into the underlying nodes.
 */

type TextRule = { find: RegExp; replace: string };
type SeqRule = { find: RegExp; values: string[] };

const TEXT_NODE_RE = /<w:t(?![a-zA-Z])([^>]*)>([\s\S]*?)<\/w:t>/g;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

type Node = { attrs: string; content: string; start: number; end: number };

function fillXml(
  xml: string,
  textRules: TextRule[],
  seqRules: SeqRule[],
): string {
  const nodes: Node[] = [];
  let m: RegExpExecArray | null;
  TEXT_NODE_RE.lastIndex = 0;
  while ((m = TEXT_NODE_RE.exec(xml))) {
    nodes.push({
      attrs: m[1],
      content: m[2],
      start: m.index,
      end: TEXT_NODE_RE.lastIndex,
    });
  }

  // Map every character of the flattened text to its owning node + offset.
  const owner: Array<{ node: number; offset: number }> = [];
  nodes.forEach((n, ni) => {
    for (let i = 0; i < n.content.length; i += 1) {
      owner.push({ node: ni, offset: i });
    }
  });
  const plain = nodes.map((n) => n.content).join('');

  type Edit = { s: number; e: number; text: string };
  const edits: Edit[] = [];

  for (const rule of textRules) {
    const re = new RegExp(
      rule.find.source,
      rule.find.flags.includes('g') ? rule.find.flags : `${rule.find.flags}g`,
    );
    let mm: RegExpExecArray | null;
    while ((mm = re.exec(plain))) {
      if (mm[0].length === 0) {
        re.lastIndex += 1;
        continue;
      }
      edits.push({
        s: mm.index,
        e: mm.index + mm[0].length,
        text: escapeXml(rule.replace),
      });
    }
  }

  for (const rule of seqRules) {
    const re = new RegExp(
      rule.find.source,
      rule.find.flags.includes('g') ? rule.find.flags : `${rule.find.flags}g`,
    );
    let mm: RegExpExecArray | null;
    let i = 0;
    while ((mm = re.exec(plain))) {
      if (mm[0].length === 0) {
        re.lastIndex += 1;
        continue;
      }
      const value = rule.values[i % rule.values.length];
      edits.push({
        s: mm.index,
        e: mm.index + mm[0].length,
        text: escapeXml(value),
      });
      i += 1;
    }
  }

  // Apply right-to-left so earlier offsets remain valid.
  edits.sort((a, b) => b.s - a.s);
  let lastStart = Number.POSITIVE_INFINITY;
  for (const edit of edits) {
    if (edit.e > lastStart) continue; // skip overlaps
    lastStart = edit.s;
    applyEdit(nodes, owner, edit.s, edit.e, edit.text);
  }

  let out = '';
  let cursor = 0;
  for (const n of nodes) {
    out += xml.slice(cursor, n.start);
    let attrs = n.attrs;
    if (n.content.length && !/xml:space=/.test(attrs)) {
      attrs = `${attrs} xml:space="preserve"`;
    }
    out += `<w:t${attrs}>${n.content}</w:t>`;
    cursor = n.end;
  }
  out += xml.slice(cursor);
  return out;
}

function applyEdit(
  nodes: Node[],
  owner: Array<{ node: number; offset: number }>,
  s: number,
  e: number,
  text: string,
): void {
  const start = owner[s];
  const endInclusive = owner[e - 1];
  if (!start || !endInclusive) return;

  if (start.node === endInclusive.node) {
    const n = nodes[start.node];
    n.content =
      n.content.slice(0, start.offset) +
      text +
      n.content.slice(endInclusive.offset + 1);
    return;
  }

  const first = nodes[start.node];
  first.content = first.content.slice(0, start.offset) + text;
  for (let ni = start.node + 1; ni < endInclusive.node; ni += 1) {
    nodes[ni].content = '';
  }
  const last = nodes[endInclusive.node];
  last.content = last.content.slice(endInclusive.offset + 1);
}

function templatePath(name: string): string {
  return path.join(process.cwd(), 'templates', name);
}

export function renderDocx(
  templateFile: string,
  textRules: TextRule[],
  seqRules: SeqRule[] = [],
): Buffer {
  const raw = fs.readFileSync(templatePath(templateFile));
  const zip = new PizZip(raw);
  const docXml = zip.file('word/document.xml');
  if (!docXml) throw new Error('document.xml topilmadi');
  const filled = fillXml(docXml.asText(), textRules, seqRules);
  zip.file('word/document.xml', filled);
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

/** «DD» MM. YYYY — templatelardagi ruscha sana formati. */
export function formatRuDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `«${dd}» ${mm}. ${d.getFullYear()}`;
}

const SOFFICE_CANDIDATES = [
  process.env.LIBREOFFICE_PATH,
  '/opt/homebrew/bin/soffice',
  '/Applications/LibreOffice.app/Contents/MacOS/soffice',
  '/usr/bin/libreoffice',
  '/usr/bin/soffice',
].filter(Boolean) as string[];

function findSoffice(): string | null {
  for (const candidate of SOFFICE_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/** DOCX → PDF (LibreOffice kerak). */
export async function docxToPdf(docx: Buffer): Promise<Buffer> {
  try {
    return await convertAsync(docx, '.pdf', undefined);
  } catch {
    const soffice = findSoffice();
    if (!soffice) {
      throw new Error(
        'PDF yaratish uchun LibreOffice o‘rnatilmagan. macOS: brew install --cask libreoffice',
      );
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'logistika-pdf-'));
    const input = path.join(tmpDir, 'input.docx');
    const output = path.join(tmpDir, 'input.pdf');
    try {
      fs.writeFileSync(input, docx);
      await execFileAsync(soffice, [
        '--headless',
        '--convert-to',
        'pdf',
        '--outdir',
        tmpDir,
        input,
      ]);
      if (!fs.existsSync(output)) {
        throw new Error('PDF konvertatsiya muvaffaqiyatsiz');
      }
      return fs.readFileSync(output);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}
