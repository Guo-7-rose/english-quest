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

// 阶段 -> ECDICT tag 列表（v2：日常词包单独维护，此脚本产出 初中/高中/四级）
const TAGS = { 1: ["zk"], 2: ["gk"], 3: ["cet4"] };
const CHAPTER_SIZE = { 1: 40, 2: 100, 3: 100 };

// 功能词停用表：冠词/代词/介词/连词/助动词/情态动词 —— 属于语法，不作为背单词目标
const FUNCTION_WORDS = new Set(`
a an the this that these those some any each every both all no none other another such
i you he she it we they me him her us them my your his its our their mine yours hers ours theirs
myself yourself himself herself itself ourselves themselves who whom whose which what whoever whatever
something anything nothing everything someone anyone everyone nobody somebody anybody everybody one ones
in on at by for with about against between among through during before after above below under over
up down out off into onto from to of as than like near behind beside beyond within without across along
around upon toward towards until till since past per via despite except besides throughout underneath
and or but nor so yet because although though if unless while whereas whether when where once whenever
wherever however therefore moreover nevertheless otherwise hence thus
be am is are was were been being have has had having do does did done doing
will would shall should can could may might must ought need dare
not no yes there here
`.trim().split(/\s+/));

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
    if (FUNCTION_WORDS.has(w.word)) continue;      // 剔除纯语法功能词
    if (!seen.has(w.word)) { seen.add(w.word); uniq.push(w); }
  }
  // 按词频「排名」升序（frq=1 最常用先学），无排名(0)沉底
  uniq.sort((a, b) => {
    const ra = a.frq === 0 ? Number.MAX_SAFE_INTEGER : a.frq;
    const rb = b.frq === 0 ? Number.MAX_SAFE_INTEGER : b.frq;
    return (ra - rb) || a.word.localeCompare(b.word);
  });
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
