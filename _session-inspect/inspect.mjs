import { readFileSync, writeFileSync } from 'node:fs';
import { zstdDecompressSync } from 'node:zlib';
import { resolve } from 'node:path';

const MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd]);
const file = resolve(process.argv[2]);
const buf = readFileSync(file);

const starts = [];
let i = buf.indexOf(MAGIC, 0);
while (i !== -1) { starts.push(i); i = buf.indexOf(MAGIC, i + 1); }
console.log('magic occurrences:', starts.length, starts.slice(0, 20).join(','));

const parts = [];
for (let k = 0; k < starts.length; k += 1) {
  const s = starts[k];
  try {
    const out = zstdDecompressSync(buf.subarray(s));
    parts.push({ k, s, len: out.length, text: out.toString('utf8') });
  } catch (e) {
    console.log(`frame@${s} failed: ${String(e.message).slice(0, 80)}`);
  }
}
console.log('decoded frames:', parts.map((p) => `${p.k}@${p.s}:${p.len}`).join(' '));

const text = parts.map((p) => p.text).join('');
writeFileSync(resolve('_session-inspect/snapshot.jsonl'), text, 'utf8');
const lines = text.split('\n').filter((l) => l.trim());
console.log('totalChars:', text.length, 'lines:', lines.length);
lines.forEach((l, idx) => {
  let o;
  try { o = JSON.parse(l); } catch { console.log(`#${idx} <unparsable ${l.length}>`); return; }
  const preview = JSON.stringify(o).slice(0, 180).replace(/\s+/g, ' ');
  console.log(`#${idx} len=${l.length} [${o.type ?? '?'}] :: ${preview}`);
});
