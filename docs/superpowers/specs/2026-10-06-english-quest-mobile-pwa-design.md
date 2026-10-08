# 英语闯关岛 v2 · 手机版 + PWA + GitHub Pages 规格

> 状态：已获用户批准（2026-10-06）· 前提决策：公开仓库 + PWA + GitHub Pages

## 1. 目标

让网站能在手机上正常使用，并且可以「添加到主屏幕」、断网可用（PWA）；通过 GitHub Pages 发布，手机访问一个 https 链接即可。

## 2. 已确认的用户决策

| 决策点 | 结论 |
|---|---|
| 手机使用方式 | 发布到 GitHub Pages + 装成 PWA（添加到主屏幕、离线可用） |
| 仓库可见性 | **公开**仓库 `english-quest`（免费 Pages 可用） |
| 底部导航 5 主项 | 🏠 学习面板 / 📚 单词板块 / 🌱 词根词缀库 / 📖 语法训练 / 🔁 复习；🎬 视频课 / 📊 数据 / ⚙️ 设置 收进「更多」 |

## 3. 布局适配（断点 ≤768px，桌面版不受影响）

1. **底部固定标签栏**：5 个主项 + 「更多」面板（弹出列表含视频课/数据/设置）；顶部导航在手机上隐藏
2. **触控规范**：按钮最小高度 44px；正文/输入字号 ≥16px（防 iOS 聚焦自动缩放）；点击区域留白
3. **词表行**：紧凑两行卡片（单词 + 音标 / 释义 + 层级标签），点开仍展开三层拆解与标记按钮
4. **网格**：主题词包、词根家族在手机上 2 列；数据页指标自动换行；顶部状态栏 pills 缩小
5. **视频**：沿用 padding-top 56.25% 比例，无需改动
6. 安全区：底部标签栏加 `env(safe-area-inset-bottom)` 适配全面屏

## 4. PWA 层

| 文件 | 作用 |
|---|---|
| `manifest.webmanifest` | name / short_name / start_url `./` / scope `./` / display `standalone` / theme_color / background_color / icons 192+512（含 maskable） |
| `icons/*.png` | 脚本生成（Pillow），圆角底色 + 「英」字，192/512/180(apple-touch) |
| `sw.js` | 应用外壳缓存：安装时预缓存 `./`、`./index.html`、manifest、图标；导航请求 cache-first 回退网络；**版本号由构建注入**，更新即换缓存 |
| `index.html` | 增加 manifest 链接、theme-color、apple-mobile-web-app-* 元信息 |

**注册策略**：仅在 `http(s)` 协议下注册 SW（`file://` 下不注册，避免报错）；单文件本地打开仍可正常使用，只是没有离线缓存与安装提示。

## 5. 部署

1. 新建**公开**仓库 `Guo-7-rose/english-quest`
2. GitHub Actions 工作流：push 时 `npm ci && npm run build` → 发布 `dist/` 到 Pages
3. 访问地址：`https://guo-7-rose.github.io/english-quest/`
4. 因为项目页在子路径下，manifest/SW/图标全部使用**相对路径**（`./...`）以保证子路径可用

## 6. 验收标准

1. 桌面端：93 个测试保持全绿、`tsc` 零错误、桌面布局无变化
2. 手机端：≤768px 出现底部标签栏；无横向溢出；按钮可点区域 ≥44px；「更多」可打开视频课/数据/设置
3. PWA：manifest 字段齐全且被 index.html 引用；SW 在 http(s) 下注册成功；二次访问离线可打开页面
4. 部署：Pages URL 返回 200；页面内含 manifest 与 SW 注册代码
5. 真机验证（需用户执行）：手机打开链接 → 添加到主屏幕 → 断网打开一次

## 7. 非目标

- 不做原生 App（不上架应用商店）
- 不改动业务逻辑与内容（仅布局、PWA、部署）
- 不引入前端框架或 UI 库
- 视频仍需联网（不做视频离线缓存）
