// 分析 611 个词根家族的规模、来源语言、以及对各词表的贡献度
import { readFileSync } from "node:fs";

const roots = JSON.parse(readFileSync(new URL("./wordroot.txt", import.meta.url), "utf8"));
const norm = (k) => k.replace(/\d+$/, "").replace(/-$/, "").replace(/^-/, "");

const csv = readFileSync(new URL("./ecdict.csv", import.meta.url), "utf8").split(/\r?\n/);
function parseLine(l) {
  const r = []; let cur = "", q = false;
  for (const c of l) {
    if (c === '"') { q = !q; continue; }
    if (c === "," && !q) { r.push(cur); cur = ""; } else cur += c;
  }
  r.push(cur); return r;
}
const banks = { zk: new Set(), gk: new Set(), cet4: new Set() };
for (let i = 1; i < csv.length; i++) {
  const f = parseLine(csv[i]);
  if (f.length < 12) continue;
  const w = (f[0] ?? "").toLowerCase();
  if (!/^[a-z]+$/.test(w)) continue;
  const tag = (f[7] ?? "").split(" ");
  if (tag.includes("zk")) banks.zk.add(w);
  if (tag.includes("gk")) banks.gk.add(w);
  if (tag.includes("cet4")) banks.cet4.add(w);
}
const inAny = (w) => banks.zk.has(w) || banks.gk.has(w) || banks.cet4.has(w);

const entries = Object.entries(roots);
const byClass = {}, byOrigin = {};
let totalExamples = 0;
const familyStats = [];
for (const [key, v] of entries) {
  byClass[v.class] = (byClass[v.class] ?? 0) + 1;
  const origin = v.origin || "(未标注)";
  byOrigin[origin] = (byOrigin[origin] ?? 0) + 1;
  const ex = (v.example ?? []).map((e) => String(e).toLowerCase().trim()).filter((w) => /^[a-z]+$/.test(w));
  totalExamples += ex.length;
  const hitZk = ex.filter((w) => banks.zk.has(w)).length;
  const hitGk = ex.filter((w) => banks.gk.has(w)).length;
  const hitC4 = ex.filter((w) => banks.cet4.has(w)).length;
  familyStats.push({ key, name: norm(key), meaning: v.meaning, class: v.class, origin, size: ex.length, hitZk, hitGk, hitC4, hitAny: ex.filter(inAny).length });
}

console.log("家族总数:", entries.length, "| 例词总数:", totalExamples);
console.log("来源语言 Top8:", Object.entries(byOrigin).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}:${v}`).join(" "));
console.log("家族规模分布:", JSON.stringify({
  "1-3词": familyStats.filter(f => f.size <= 3).length,
  "4-9词": familyStats.filter(f => f.size >= 4 && f.size <= 9).length,
  "10-29词": familyStats.filter(f => f.size >= 10 && f.size <= 29).length,
  "30+词": familyStats.filter(f => f.size >= 30).length,
}));
const useful = familyStats.filter(f => f.hitAny > 0);
console.log(`对初中/高中/四级词表有贡献的家族: ${useful.length} / ${familyStats.length}`);
console.log("贡献度 Top12（家族=含义，例词数/命中初中/高中/四级）:");
for (const f of [...useful].sort((a, b) => b.hitAny - a.hitAny).slice(0, 12)) {
  console.log(`  ${f.name.padEnd(10)} ${String(f.meaning).slice(0, 22).padEnd(24)} 例词${String(f.size).padStart(3)} | 初${String(f.hitZk).padStart(2)} 高${String(f.hitGk).padStart(2)} 四${String(f.hitC4).padStart(2)}`);
}
