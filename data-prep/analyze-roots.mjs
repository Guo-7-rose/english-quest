// 分析 ECDICT wordroot.txt 的结构与覆盖率
import { readFileSync } from "node:fs";

const roots = JSON.parse(readFileSync(new URL("./wordroot.txt", import.meta.url), "utf8"));
const entries = Object.entries(roots);
console.log("词源条目总数:", entries.length);

const byClass = {};
for (const [, v] of entries) byClass[v.class] = (byClass[v.class] ?? 0) + 1;
console.log("按类型:", JSON.stringify(byClass));

// 反向索引：单词 -> 词源条目
const wordMap = new Map();
for (const [key, v] of entries) {
  for (const ex of v.example ?? []) {
    const w = String(ex).toLowerCase().trim();
    if (!/^[a-z]+$/.test(w)) continue;
    if (!wordMap.has(w)) wordMap.set(w, []);
    wordMap.get(w).push(key);
  }
}
console.log("可被拆解的单词数(纯字母):", wordMap.size);

// 覆盖率：对照 ECDICT 考试标签词表
const csv = readFileSync(new URL("./ecdict.csv", import.meta.url), "utf8").split(/\r?\n/);
function parseLine(l) {
  const r = []; let cur = "", q = false;
  for (const c of l) {
    if (c === '"') { q = !q; continue; }
    if (c === "," && !q) { r.push(cur); cur = ""; } else cur += c;
  }
  r.push(cur); return r;
}
const buckets = { zk: [], gk: [], cet4: [], daily: [] };
for (let i = 1; i < csv.length; i++) {
  const f = parseLine(csv[i]);
  if (f.length < 12) continue;
  const w = (f[0] ?? "").toLowerCase();
  if (!/^[a-z]+$/.test(w)) continue;
  const tag = f[7] ?? "";
  const frq = Number(f[9] || 0);
  if (tag.split(" ").includes("zk")) buckets.zk.push(w);
  if (tag.split(" ").includes("gk")) buckets.gk.push(w);
  if (tag.split(" ").includes("cet4")) buckets.cet4.push(w);
  if (frq >= 8000 && w.length > 2) buckets.daily.push(w);   // 高频 = 日常候选
}
for (const [k, arr] of Object.entries(buckets)) {
  const uniq = [...new Set(arr)];
  const covered = uniq.filter((w) => wordMap.has(w)).length;
  console.log(`${k}: ${uniq.length} 词, 可词源拆解 ${covered} (${(covered / uniq.length * 100).toFixed(1)}%)`);
}

// 样例：展示几个词的拆解
for (const w of ["import", "export", "transport", "teacher", "beautiful", "unhappy", "predict"]) {
  console.log(w, "->", (wordMap.get(w) ?? []).slice(0, 3).join(", ") || "(无)");
}
