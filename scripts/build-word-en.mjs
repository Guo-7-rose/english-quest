// 音节切分（记忆分块用，不做词源声明）+ 英文释义 → src/data/word-en.json
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);
const DIGRAPHS = ["sh", "ch", "th", "ph", "wh", "ck", "ng", "qu", "gh"];
const KEEP_TOGETHER = ["tion", "sion", "ture", "cious", "tious", "cial", "tial", "ble", "cle", "dle", "fle", "gle", "kle", "ple", "tle", "zle"];

function isVowelAt(w, i) {
  const c = w[i];
  if (!VOWELS.has(c)) return false;
  if (c === "y") {
    // y 在词首或元音旁作辅音
    if (i === 0) return false;
    const prev = w[i - 1];
    if (prev && VOWELS.has(prev) && prev !== "y") return false;
    return true;
  }
  return true;
}

/** 把单词切成可朗读的音节块（近似，用于记忆分块展示） */
export function syllabify(word) {
  const w = word.toLowerCase();
  if (w.length <= 3) return [w];

  // 收集元音组区间
  const groups = [];
  let i = 0;
  while (i < w.length) {
    if (isVowelAt(w, i)) {
      const start = i;
      while (i < w.length && isVowelAt(w, i)) i++;
      groups.push([start, i - 1]);
    } else i++;
  }
  if (groups.length <= 1) return [w];

  const cuts = [];
  for (let g = 0; g < groups.length - 1; g++) {
    const vEnd = groups[g][1];
    const nextStart = groups[g + 1][0];
    const between = w.slice(vEnd + 1, nextStart);
    let cut;
    if (between.length === 0) cut = vEnd + 1;                       // 元音相邻：中间切
    else if (between.length === 1) cut = vEnd + 1;                  // 单辅音：归后一音节（wa-ter）
    else if (DIGRAPHS.some(d => between.startsWith(d))) cut = vEnd + 1;  // 二合字母整体归后（wea-ther）
    else {
      const cluster = between;
      let idx = 0;
      for (const d of DIGRAPHS) {
        const p = cluster.indexOf(d);
        if (p > 0) { idx = p; break; }
      }
      cut = vEnd + 1 + (idx > 0 ? idx : Math.floor(cluster.length / 2));
    }
    if (cut > 0 && cut < w.length) cuts.push(cut);
  }

  // 常见词尾整体保留
  for (const kt of KEEP_TOGETHER) {
    const pos = w.length - kt.length;
    if (pos > 1 && w.endsWith(kt)) {
      const filtered = cuts.filter(c => c <= pos || c >= w.length - 1);
      if (!filtered.includes(pos)) filtered.push(pos);
      cuts.length = 0;
      cuts.push(...filtered);
      break;
    }
  }

  const uniq = [...new Set(cuts)].filter(c => c > 0 && c < w.length).sort((a, b) => a - b);
  const parts = [];
  let prev = 0;
  for (const c of uniq) { parts.push(w.slice(prev, c)); prev = c; }
  parts.push(w.slice(prev));
  // 去掉长度 1 的碎片（并回前一块），最多 5 块
  const merged = [];
  for (const p of parts) {
    if (p.length === 1 && merged.length > 0) merged[merged.length - 1] += p;
    else merged.push(p);
  }
  return merged.slice(0, 5);
}

// --- 抽样自检（node scripts/build-word-en.mjs check）---
if (process.argv.includes("check")) {
  const samples = ["hospital", "weather", "beautiful", "computer", "umbrella", "library", "chocolate", "restaurant", "bicycle", "telephone", "family", "elephant", "understand", "information", "together", "important"];
  console.log("=== 音节切分抽样 ===");
  for (const s of samples) console.log(s.padEnd(12), syllabify(s).join(" · "));
  process.exit(0);
}

// --- 生成 src/data/word-en.json：{ word: { def: 英文释义, syl: 音节分块 } } ---
function parseCsvLine(l) {
  const r = []; let cur = "", q = false;
  for (const c of l) {
    if (c === '"') { q = !q; continue; }
    if (c === "," && !q) { r.push(cur); cur = ""; } else cur += c;
  }
  r.push(cur); return r;
}

const needed = new Set();
for (const f of ["words-stage1.json", "words-stage2.json", "words-stage3.json"]) {
  const j = JSON.parse(readFileSync(join(root, "..", "src", "data", f), "utf8"));
  for (const ch of j.chapters) for (const w of ch.words) needed.add(w.word);
}
const daily = JSON.parse(readFileSync(join(root, "..", "src", "data", "wordbank-daily.json"), "utf8"));
for (const t of daily.themes) for (const w of t.words) needed.add(w.word);

const defs = new Map();
const csv = readFileSync(join(root, "..", "data-prep", "ecdict.csv"), "utf8").split(/\r?\n/);
for (let i = 1; i < csv.length; i++) {
  const f = parseCsvLine(csv[i]);
  if (f.length < 12) continue;
  const w = (f[0] ?? "").toLowerCase();
  if (!needed.has(w) || defs.has(w)) continue;
  const def = (f[2] ?? "").split("\\n").map(s => s.trim()).filter(Boolean)[0] ?? "";
  if (!def) continue;
  defs.set(w, def.length > 90 ? def.slice(0, 90) : def);
}

const out = {};
for (const w of needed) {
  const syl = syllabify(w);
  out[w] = { def: defs.get(w) ?? "", syl: syl.join("-") };
}
writeFileSync(join(root, "..", "src", "data", "word-en.json"), JSON.stringify(out), "utf8");
const withDef = Object.values(out).filter(v => v.def).length;
console.log(`word-en.json: ${Object.keys(out).length} 词（含英文释义 ${withDef} 个）`);
