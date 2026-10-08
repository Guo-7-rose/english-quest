import { readFileSync } from "node:fs";
const lines = readFileSync(new URL("./ecdict.csv", import.meta.url), "utf8").split(/\r?\n/);
const want = new Set(["the", "be", "and", "of", "in", "to", "have", "it", "that", "for", "you", "he", "help", "happy", "water", "state", "might"]);
function sp(l) {
  const r = []; let c = "", q = false;
  for (const ch of l) {
    if (ch === '"') { q = !q; continue; }
    if (ch === "," && !q) { r.push(c); c = ""; } else c += ch;
  }
  r.push(c); return r;
}
const seen = new Set();
for (let i = 1; i < lines.length; i++) {
  const f = sp(lines[i]);
  const w = (f[0] || "").toLowerCase();
  if (want.has(w) && !seen.has(w)) {
    seen.add(w);
    console.log(w.padEnd(8), "pos=[" + (f[4] || "") + "]");
  }
}
