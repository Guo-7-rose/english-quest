// 构建后处理：生成 GitHub Pages 需要的 404 回退与 .nojekyll
import { copyFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "..", "dist");
const index = join(dist, "index.html");

if (!existsSync(index)) {
  console.error("未找到 dist/index.html，请先运行 npm run build");
  process.exit(1);
}

// SPA 回退：任意路径都返回首页（GitHub Pages 用 404.html，Cloudflare 用 _redirects）
copyFileSync(index, join(dist, "404.html"));
writeFileSync(join(dist, ".nojekyll"), "");
console.log("postbuild: 已生成 404.html 与 .nojekyll");
