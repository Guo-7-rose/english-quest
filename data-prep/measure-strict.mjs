// 加严版：只保留「词干是常用真实单词」的可信拆解
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

const csv = readFileSync(new URL("./ecdict.csv", import.meta.url), "utf8").split(/\r?\n/);
function parseLine(l) {
  const r = []; let cur = "", q = false;
  for (const c of l) {
    if (c === '"') { q = !q; continue; }
    if (c === "," && !q) { r.push(cur); cur = ""; } else cur += c;
  }
  r.push(cur); return r;
}
const frq = new Map(), banks = { zk: [], gk: [], cet4: [] };
for (let i = 1; i < csv.length; i++) {
  const f = parseLine(csv[i]);
  if (f.length < 12) continue;
  const w = (f[0] ?? "").toLowerCase();
  if (!/^[a-z]+$/.test(w)) continue;
  const n = Number(f[9] || 0);
  if (!frq.has(w) || n > frq.get(w)) frq.set(w, n);
  const tag = (f[7] ?? "").split(" ");
  if (tag.includes("zk")) banks.zk.push(w);
  if (tag.includes("gk")) banks.gk.push(w);
  if (tag.includes("cet4")) banks.cet4.push(w);
}
const COMMON = 2000;                       // 词干常用阈值
const isCommon = (w) => (frq.get(w) ?? 0) >= COMMON;

function strictSplit(w) {
  for (const p of prefixes) {
    if (p.length < 2 || !w.startsWith(p)) continue;
    const rest = w.slice(p.length);
    if (rest.length >= 3 && isCommon(rest)) return { affix: p, rest, type: "prefix" };
  }
  for (const s of suffixes) {
    if (s.length < 2 || !w.endsWith(s)) continue;
    const rest = w.slice(0, w.length - s.length);
    if (rest.length >= 3 && isCommon(rest)) return { affix: s, rest, type: "suffix" };
  }
  return null;
}

console.log("词干常用阈值 frq >=", COMMON);
for (const [k, arr] of Object.entries(banks)) {
  const uniq = [...new Set(arr)];
  let direct = 0, rule = 0;
  const samples = [];
  for (const w of uniq) {
    if (keysByWord.has(w)) { direct++; continue; }
    const r = strictSplit(w);
    if (r) { rule++; if (samples.length < 8) samples.push(`${w} = ${r.affix} + ${r.rest}`); }
  }
  const total = direct + rule;
  console.log(`${k}: 词源库直出 ${direct} + 可信规则 ${rule} = ${total}/${uniq.length} (${(total / uniq.length * 100).toFixed(1)}%)`);
  console.log("   样例:", samples.join(" | "));
}
