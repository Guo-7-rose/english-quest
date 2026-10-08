// data-prep/daily-bank-source.json + ECDICT -> src/data/wordbank-daily.json
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, "..", "data-prep", "daily-bank-source.json");
const csvPath = join(root, "..", "data-prep", "ecdict.csv");
if (!existsSync(src) || !existsSync(csvPath)) {
  console.error("缺少 data-prep/daily-bank-source.json 或 ecdict.csv");
  process.exit(1);
}

function parseCsvLine(l) {
  const r = []; let cur = "", q = false;
  for (const c of l) {
    if (c === '"') { q = !q; continue; }
    if (c === "," && !q) { r.push(cur); cur = ""; } else cur += c;
  }
  r.push(cur); return r;
}

const dict = new Map();
const lines = readFileSync(csvPath, "utf8").split(/\r?\n/);
for (let i = 1; i < lines.length; i++) {
  const f = parseCsvLine(lines[i]);
  if (f.length < 12) continue;
  const w = (f[0] ?? "").toLowerCase();
  if (!/^[a-z]+$/.test(w)) continue;
  if (dict.has(w)) continue;
  const meaning = (f[3] ?? "").split("\\n").map(s => s.trim()).filter(Boolean)
    .filter(s => !s.startsWith("[网络]") && !s.startsWith("[医]") && !s.startsWith("[法]") && !s.startsWith("[亦作"))
    .slice(0, 3).map(s => s.length > 40 ? s.slice(0, 40) : s);
  if (meaning.length === 0) continue;
  dict.set(w, { phonetic: f[1] ?? "", meaning });
}
console.log("词典可用词条:", dict.size);

const source = JSON.parse(readFileSync(src, "utf8"));
const missing = [];
const themes = source.themes.map(t => {
  const words = [];
  const seen = new Set();
  for (const raw of String(t.words).split(/\s+/)) {
    const w = raw.toLowerCase().trim();
    if (!w || seen.has(w)) continue;
    seen.add(w);
    const d = dict.get(w);
    if (!d) { missing.push(t.id + ":" + w); continue; }
    words.push({ word: w, phonetic: d.phonetic, meaning: d.meaning });
  }
  return { id: t.id, title: t.title, icon: t.icon, words };
});

const total = themes.reduce((a, t) => a + t.words.length, 0);
writeFileSync(join(root, "..", "src", "data", "wordbank-daily.json"),
  JSON.stringify({ themes, expressions: source.expressions }), "utf8");
console.log(`主题 ${themes.length} 个，词条 ${total} 个，表达 ${source.expressions.length} 条`);
if (missing.length) console.log("词典中缺失（已跳过）:", missing.join(", "));
