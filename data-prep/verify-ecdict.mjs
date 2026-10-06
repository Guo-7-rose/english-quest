// one-off verification script: counts oxford column + exchange coverage in ecdict.csv
import { readFileSync } from "node:fs";

const lines = readFileSync(new URL("./ecdict.csv", import.meta.url), "utf8").split(/\r?\n/);

function splitLine(l) {
  const r = [];
  let cur = "", q = false;
  for (const c of l) {
    if (c === '"') { q = !q; continue; }
    if (c === "," && !q) { r.push(cur); cur = ""; } else cur += c;
  }
  r.push(cur);
  return r;
}

let ox = 0, ox1 = 0, ex = 0, total = 0;
for (let i = 1; i < lines.length; i++) {
  const l = lines[i];
  if (!l) continue;
  const f = splitLine(l);
  if (f.length < 12) continue;
  total++;
  if (f[6] !== "") { ox++; if (f[6] === "1") ox1++; }
  if (f[10] !== "") ex++;
}
console.log("total words:", total);
console.log("oxford column non-empty:", ox, "(value=1:", ox1 + ")");
console.log("exchange non-empty:", ex, "=", (ex / total * 100).toFixed(1) + "%");
