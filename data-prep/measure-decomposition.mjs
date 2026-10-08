// 测量：用 ECDICT 前缀/后缀 + 规则拆解，能把词表覆盖率提升到多少
import { readFileSync } from "node:fs";

const roots = JSON.parse(readFileSync(new URL("./wordroot.txt", import.meta.url), "utf8"));

const norm = (k) => k.replace(/\d+$/, "").replace(/-$/, "").replace(/^-/, "");
const prefixes = [], suffixes = [], keysByWord = new Map();
for (const [key, v] of Object.entries(roots)) {
  const n = norm(key).toLowerCase();
  if (v.class === "prefix") prefixes.push(n);
  else if (String(v.class).includes("suffix")) suffixes.push(n);
  for (const ex of v.example ?? []) {
    const w = String(ex).toLowerCase().trim();
    if (!/^[a-z]+$/.test(w)) continue;
    if (!keysByWord.has(w)) keysByWord.set(w, []);
    keysByWord.get(w).push(key);
  }
}
prefixes.sort((a, b) => b.length - a.length);
suffixes.sort((a, b) => b.length - a.length);

// 读词表
const csv = readFileSync(new URL("./ecdict.csv", import.meta.url), "utf8").split(/\r?\n/);
function parseLine(l) {
  const r = []; let cur = "", q = false;
  for (const c of l) {
    if (c === '"') { q = !q; continue; }
    if (c === "," && !q) { r.push(cur); cur = ""; } else cur += c;
  }
  r.push(cur); return r;
}
const wordSet = new Set(), banks = { zk: [], gk: [], cet4: [], daily: [] };
for (let i = 1; i < csv.length; i++) {
  const f = parseLine(csv[i]);
  if (f.length < 12) continue;
  const w = (f[0] ?? "").toLowerCase();
  if (!/^[a-z]+$/.test(w)) continue;
  wordSet.add(w);
  const tag = f[7] ?? "", frq = Number(f[9] || 0);
  if (tag.split(" ").includes("zk")) banks.zk.push(w);
  if (tag.split(" ").includes("gk")) banks.gk.push(w);
  if (tag.split(" ").includes("cet4")) banks.cet4.push(w);
  if (frq >= 8000 && w.length > 2) banks.daily.push(w);
}

// 规则拆解：前缀剥离 + 后缀剥离，剩余部分需是已知单词或词根
function trySplit(w) {
  for (const p of prefixes) {
    if (p.length >= 2 && w.startsWith(p) && w.length - p.length >= 3) {
      const rest = w.slice(p.length);
      if (wordSet.has(rest) || keysByWord.has(rest)) return { type: "prefix", affix: p, rest };
    }
  }
  for (const s of suffixes) {
    if (s.length >= 2 && w.endsWith(s) && w.length - s.length >= 3) {
      const rest = w.slice(0, w.length - s.length);
      if (wordSet.has(rest) || keysByWord.has(rest)) return { type: "suffix", affix: s, rest };
    }
  }
  return null;
}

console.log(`前缀 ${prefixes.length} 个 / 后缀 ${suffixes.length} 个 / 词根族例词 ${keysByWord.size}`);
for (const [k, arr] of Object.entries(banks)) {
  const uniq = [...new Set(arr)];
  let direct = 0, rule = 0;
  const samples = [];
  for (const w of uniq) {
    if (keysByWord.has(w)) { direct++; continue; }
    const r = trySplit(w);
    if (r) { rule++; if (samples.length < 6) samples.push(`${w} = ${r.affix}- + ${r.rest}`); }
  }
  const total = direct + rule;
  console.log(`${k}: 直接词源 ${direct} + 规则拆解 ${rule} = ${total}/${uniq.length} (${(total / uniq.length * 100).toFixed(1)}%)`);
  console.log("   样例:", samples.join(" | "));
}
