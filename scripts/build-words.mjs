// ECDICT(MIT) -> 四阶段分章词库 JSON 生成器
// 用法: node scripts/build-words.mjs  （需要 data-prep/ecdict.csv）
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const CSV = join(root, "..", "data-prep", "ecdict.csv");
if (!existsSync(CSV)) {
  console.error("缺少 data-prep/ecdict.csv：请先下载 ECDICT（MIT）");
  process.exit(1);
}

// 阶段 -> ECDICT tag 列表（或 oxford 列）
const TAGS = { 1: ["zk"], 2: ["gk"], 3: ["cet4"], 4: ["ielts", "toefl"] };
const CHAPTER_SIZE = { 1: 40, 2: 100, 3: 100, 4: 100 };

function parseCsvLine(l) {
  const r = [];
  let cur = "", q = false;
  for (const c of l) {
    if (c === '"') { q = !q; continue; }
    if (c === "," && !q) { r.push(cur); cur = ""; } else cur += c;
  }
  r.push(cur);
  return r;
}

function cleanMeaning(trans) {
  if (!trans) return [];
  return trans
    .split("\\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !s.startsWith("[网络]") && !s.startsWith("[医]") && !s.startsWith("[法]") && !s.startsWith("[亦作"))
    .slice(0, 4)
    .map((s) => (s.length > 40 ? s.slice(0, 40) : s));
}

const all = [];
{
  const lines = readFileSync(CSV, "utf8").split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    const f = parseCsvLine(lines[i]);
    if (f.length < 12) continue;
    const [word, phonetic, , translation, , , oxford, tag, , frq, exchange] = f;
    if (!word) continue;
    const w = word.toLowerCase();
    if (!/^[a-z]+$/.test(w)) continue;          // 只收纯字母单词
    if (w.length < 2 || w.length > 18) continue;
    const meaning = cleanMeaning(translation);
    if (meaning.length === 0) continue;
    const ex = {};
    if (exchange) {
      for (const part of exchange.split("/")) {
        const m = part.match(/^([a-z0-9]):(.+)$/);
        if (m && /^[a-zA-Z' -]+$/.test(m[2])) ex[m[1]] = m[2].split(",").slice(0, 3).map((s) => s.trim().toLowerCase());
      }
    }
    all.push({
      word: w, phonetic: phonetic || "", meaning, tag: tag || "", oxford: oxford || "",
      frq: frq ? Number(frq) : 0, exchange: ex,
    });
  }
}
console.log("parsed candidates:", all.length);

for (const [stageStr, tags] of Object.entries(TAGS)) {
  const stage = Number(stageStr);
  const pool = all.filter((w) => {
    const tagSet = new Set(w.tag.split(" "));
    return tags.some((t) => tagSet.has(t)) || (stage === 1 && w.oxford === "1");
  });
  const seen = new Set();
  const uniq = [];
  for (const w of pool) {
    if (!seen.has(w.word)) { seen.add(w.word); uniq.push(w); }
  }
  // 词频降序（常用先学），无词频沉底
  uniq.sort((a, b) => (b.frq - a.frq) || a.word.localeCompare(b.word));
  const chapters = [];
  let no = 0;
  for (let i = 0; i < uniq.length; i += CHAPTER_SIZE[stage]) {
    no++;
    chapters.push({
      stage, no, title: `第${no}章`,
      words: uniq.slice(i, i + CHAPTER_SIZE[stage]).map((w) => ({
        id: w.word, word: w.word, phonetic: w.phonetic, meaning: w.meaning, exchange: w.exchange,
      })),
    });
  }
  const out = join(root, "..", "src", "data", `words-stage${stage}.json`);
  writeFileSync(out, JSON.stringify({ stage, chapters }), "utf8");
  console.log(`stage ${stage}: ${uniq.length} words / ${chapters.length} chapters -> ${out}`);
}
