import { readFileSync } from "node:fs";
const lines = readFileSync(new URL("./ecdict.csv", import.meta.url), "utf8").split(/\r?\n/);
const want = new Set(["happy", "teach", "vice", "port", "write", "apple", "the", "quick", "help", "juice"]);
function sp(l) {
  const r = []; let c = "", q = false;
  for (const ch of l) {
    if (ch === '"') { q = !q; continue; }
    if (ch === "," && !q) { r.push(c); c = ""; } else c += ch;
  }
  r.push(c); return r;
}
for (let i = 1; i < lines.length; i++) {
  const f = sp(lines[i]);
  const w = (f[0] || "").toLowerCase();
  if (want.has(w)) console.log(w.padEnd(8), "bnc=" + (f[8] || "-"), "frq=" + (f[9] || "-"), "collins=" + (f[5] || "-"), "oxford=" + (f[6] || "-"));
}
