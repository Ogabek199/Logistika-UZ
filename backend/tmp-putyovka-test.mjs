import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PizZip from 'pizzip';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// Load compiled JS if present; otherwise transpile via dynamic import of dist after build
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Inline minimal render using same algorithm as docx.util (import from source via child)
const { execFileSync } = await import('child_process');

const out = path.join(__dirname, 'tmp-out.docx');
const script = `
const { renderDocx } = require('./src/documents/docx.util');
const PizZip = require('pizzip');
const fs = require('fs');
const buf = renderDocx('putyovka.docx', [
  { find: /Джуманбаев\\s*А/g, replace: 'DAMIROV AKMAL' },
  { find: /DAF\\s+/g, replace: 'MAN TGX ' },
  { find: /40[\\s\\u00a0]*D\\s*545\\s*RA/g, replace: '01 A 333 BA' },
  { find: /KOEGEL\\s*№\\s*40\\s*9787\\s*AA/g, replace: 'KRONE SD № 402884CA' },
  { find: /ПУТЕВОЙ ЛИСТ\\s*№\\s*11/g, replace: 'ПУТЕВОЙ ЛИСТ  № 42' },
]);
fs.writeFileSync(${JSON.stringify(out)}, buf);
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();
const re = /<w:t(?![a-zA-Z])[^>]*>([\\s\\S]*?)<\\/w:t>/g;
let m, plain = '';
while ((m = re.exec(xml))) plain += m[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const c = plain.replace(/\\s+/g, ' ');
console.log('DAMIROV', c.includes('DAMIROV'));
console.log('MAN TGX', c.includes('MAN TGX'));
console.log('01 A 333 BA', c.includes('01 A 333 BA'));
console.log('KRONE', c.includes('KRONE'));
console.log('402884', c.includes('402884'));
console.log('42', /ПУТЕВОЙ ЛИСТ\\s*№\\s*42/.test(c));
console.log('old DAF', c.includes('DAF'));
console.log('old KOEGEL', c.includes('KOEGEL'));
console.log('old name', c.includes('Джуман'));
console.log('vehicle', c.match(/Автомобиль.{0,50}/)?.[0]);
console.log('trailer', c.match(/Прицеп.{0,50}/)?.[0]);
console.log('bytes', buf.length);
`;

fs.writeFileSync(path.join(__dirname, 'tmp-run.js'), script);
execFileSync('npx', ['ts-node', '--transpile-only', 'tmp-run.js'], {
  cwd: __dirname,
  stdio: 'inherit',
});
