// 把 dist/ 同步到 eq-upload/（Cloudflare Pages 直传目录），包含点文件
import { cpSync, rmSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "..", "dist");
const out = join(root, "..", "eq-upload");

if (!existsSync(dist)) {
  console.error("未找到 dist/，请先运行 npm run build");
  process.exit(1);
}
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const entry of readdirSync(dist)) {
  cpSync(join(dist, entry), join(out, entry), { recursive: true });
}
const files = readdirSync(out);
console.log(`prepare-upload: 已同步 ${files.length} 项到 eq-upload/`);
console.log("  " + files.join(" "));
