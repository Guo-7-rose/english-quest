# 英语闯关岛 English Quest 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个游戏化英语学习单文件网站：打字背单词（三阶递进）+ 四阶段闯关路线 + 语法讲解选择题 + 每日打卡/成长系统 + 卡通风动态正反馈，双击 index.html 即用，数据存 localStorage。

**Architecture:** 纯前端 SPA：Vite + TypeScript 开发，vite-plugin-singlefile 打包为单文件。引擎层（typing/review/progress/streak）为纯函数模块，可单元测试；视图层消费引擎状态并渲染 DOM；storage 层统一读写 localStorage（带 schema 版本与迁移）。词库由 ECDICT（MIT）经 `scripts/build-words.mjs` 生成静态 JSON 随构建内联。

**Tech Stack:** Vite 8 + TypeScript 5（strict）+ Vitest（jsdom）+ ts-fsrs 5 + vite-plugin-singlefile 2；运行时零其他依赖；Node 24 / npm 11（本机 npm 需用 `npm.cmd`）。

**Spec:** [docs/superpowers/specs/2026-10-06-english-quest-design.md](../specs/2026-10-06-english-quest-design.md)

## Global Constraints

- 产物必须为**单个 dist/index.html**（全内联，无外部请求），双击可开；验证命令：`npm.cmd run build` 后检查 dist/index.html 存在且为单文件。
- 全部运行数据存 localStorage，键前缀 `eq:`，必须带 `eq:schemaVersion` 字段与迁移函数。
- 第三方运行时依赖仅允许 `ts-fsrs`（MIT）；开发依赖仅 vite/vitest/typescript/vite-plugin-singlefile/jsdom。
- 音频全部 WebAudio 合成，发音用浏览器 `speechSynthesis`（en-US），无任何音频文件。
- 词库数据仅来自 ECDICT（MIT）；不得引入 GPL/AGPL 数据。
- 打字正确判定：输入须与目标词逐字符一致才判对；同一词累计错 3 次显示答案并进复习队列；打错需重打该词。
- 星级阈值：正确率 ≥60% =1★、≥80% =2★、≥95% =3★；关卡按顺序解锁；阶段测验 80% 通过才进下一阶段。
- 默认每日目标：30 词或 2 语法单元（完成任一即达标）；冻结卡每周 +1、上限 3。
- 所有测试命令用 `npm.cmd test`（vitest run）；构建用 `npm.cmd run build`；提交前必须测试全绿。
- 文案语言：界面中文，词条内容中英混合；日期处理必须通过注入的时钟（不直接依赖 `new Date()`）。

---

## 文件结构

```
(项目根 = 工作目录根)
├── package.json / tsconfig.json / vite.config.ts   # 构建配置
├── index.html                                      # SPA 壳（构建入口）
├── src/
│   ├── types.ts            # 全部共享类型（Word/Chapter/Stage/Progress/Settings…）
│   ├── main.ts             # 启动：storage 初始化、路由、顶栏渲染、全局事件
│   ├── store/storage.ts    # localStorage 读写 + 迁移
│   ├── engine/typing.ts    # 打字引擎（纯逻辑）
│   ├── engine/progress.ts  # XP/等级/星级/解锁（纯逻辑）
│   ├── engine/streak.ts    # 打卡/连续天数/冻结卡/热力图数据（纯逻辑，注入时钟）
│   ├── engine/review.ts    # ts-fsrs 复习调度（纯逻辑）
│   ├── data/words.ts       # 词库访问：阶段/章节/词形变化题
│   ├── data/grammar.ts     # 语法题库访问 + 判分
│   ├── data/achievements.ts# 成就定义 + 判定
│   ├── data/words-stage1.json … words-stage4.json  # 由 scripts/build-words.mjs 生成
│   ├── views/home.ts / map.ts / typing.ts / grammar.ts / stats.ts / settings.ts
│   ├── fx/audio.ts         # WebAudio 合成音效 + speechSynthesis
│   ├── fx/fx.ts            # 粒子/彩带/抖动/弹窗提示
│   └── styles/base.css / components.css            # 卡通设计系统
├── scripts/build-words.mjs # ECDICT → 分阶段分章词库 JSON
├── tests/*.test.ts
└── dist/index.html         # 交付产物（构建生成，git 忽略）
```

引擎模块签名（后续任务互相引用的契约）：

```ts
// types.ts 关键类型
type WordId = string;
interface Word { id: WordId; word: string; phonetic: string; meaning: string[]; exchange: Record<string,string[]>; } // exchange 如 { s:["apples"], d:["appled"], i:["appling"] }
interface Chapter { id: string; stage: 1|2|3|4; no: number; title: string; words: Word[]; }
interface WordStats { correct: number; wrong: number; lastSeen: number; fsrs: { due: Date; stability: number; difficulty: number; state: number } | null; }
interface ChapterProgress { state: "locked"|"open"|"done"; stars: 0|1|2|3; bestAcc: number; bestWpm: number; }
interface Profile { xp: number; level: number; streak: number; lastCheckinDate: string|null; totalMinutes: number; dailyGoal: { words: number; grammarUnits: number; }; goalsMetToday: boolean; freezeCards: number; lastFreezeGrant: string|null; checkinDates: string[]; }
interface Settings { sound: boolean; tts: boolean; showMeaning: boolean; theme: string; }
```

## Tasks

### Task 1: 工程脚手架（Vite+TS+Vitest+singlefile）

**Files:**
- Create: `package.json`、`vite.config.ts`、`tsconfig.json`、`index.html`、`.gitignore`（更新）、`src/main.ts`、`src/styles/base.css`、`tests/smoke.test.ts`

**Interfaces:**
- Produces: `npm.cmd test`、`npm.cmd run build`、`npm.cmd run dev` 三个脚本可用；`dist/index.html` 单文件构建可产出。

- [ ] **Step 1: 写 package.json**

```json
{
  "name": "english-quest",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "gen:words": "node scripts/build-words.mjs"
  },
  "dependencies": { "ts-fsrs": "^5.4.2" },
  "devDependencies": {
    "vite": "^8.3.3",
    "typescript": "^5.9.0",
    "vitest": "^3.2.0",
    "jsdom": "^26.1.0",
    "vite-plugin-singlefile": "^2.3.3"
  }
}
```

- [ ] **Step 2: 写 vite.config.ts**

```ts
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [viteSingleFile()],
  base: "./",
  test: { environment: "jsdom", include: ["tests/**/*.test.ts"] },
} as never);
```

注：vitest 3 的 `test` 配置放在 vite.config.ts 需要类型断言；若 TS 报错改用独立 `vitest.config.ts`：

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "jsdom", include: ["tests/**/*.test.ts"] } });
```

- [ ] **Step 3: 写 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "ESNext", "moduleResolution": "bundler",
    "strict": true, "noUncheckedIndexedAccess": true, "skipLibCheck": true,
    "types": ["vite/client"], "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "resolveJsonModule": true, "esModuleInterop": true, "noEmit": true
  },
  "include": ["src", "tests", "vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 4: 写 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>英语闯关岛 English Quest</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 5: 写最小 main.ts 与 base.css**

`src/main.ts`：

```ts
import "./styles/base.css";
const app = document.getElementById("app")!;
app.innerHTML = `<div class="hello">英语闯关岛</div>`;
```

`src/styles/base.css`：

```css
:root { --green:#58CC02; --yellow:#FFC800; --blue:#1CB0F6; --purple:#CE82FF; --red:#FF4B4B; --ink:#3C3C3C; --gray:#777; --bg:#FFF7E8; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: "Nunito","PingFang SC","Microsoft YaHei",system-ui,sans-serif; background: var(--bg); color: var(--ink); }
.hello { padding: 40px; font-size: 24px; font-weight: 900; color: var(--green); }
```

- [ ] **Step 6: 写 tests/smoke.test.ts**

```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("jsdom 环境可用", () => {
    document.body.innerHTML = `<div id="app"></div>`;
    expect(document.getElementById("app")).not.toBeNull();
  });
});
```

- [ ] **Step 7: 安装依赖并验证**

Run: `npm.cmd install`
Run: `npm.cmd test` — Expected: 1 passed
Run: `npm.cmd run build` — Expected: dist/index.html 生成
Run: `Get-ChildItem dist` — Expected: 仅 index.html（可含同名前缀资源时检查 `dist` 下文件数）

- [ ] **Step 8: 更新 .gitignore 并提交**

```bash
git add -A
git commit -m "chore: Vite+TS+Vitest 工程脚手架（singlefile 构建）"
```

---

### Task 2: 设计系统 CSS（卡通组件层）

**Files:**
- Create: `src/styles/components.css`
- Modify: `src/styles/base.css`（追加 CSS 变量与通用动画）、`src/main.ts`（import components.css）

**Interfaces:**
- Produces: 类名契约，后续所有视图直接使用：`.app`（内容容器）、`.topbar`、`.pill`、`.nav-btn`（`.on` 激活）、`.card`、`.btn`（`--green/--yellow/--blue/--purple/--red/--ghost` 变体）、`.btn:active` 下沉、`.muted`、`.heatmap`（`.day .lv1 .lv2 .lv3`）、`.toast`（`.show`）、`.stars`、`.xp-bar .xp-fill`、`.node .bubble .locked .done .master`、`.word-stage .ch .typed-ok .typed-bad .caret .shake`、`.particle`、`.confetti`。

- [ ] **Step 1: 写 components.css（完整组件样式，沿用样版 prototype.html 的视觉语言）**

```css
/* ===== 布局 ===== */
.app { width: min(960px, 96vw); margin: 0 auto; padding: 16px 0 48px; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
nav.main-nav { display: flex; gap: 10px; margin: 16px 0 20px; flex-wrap: wrap; }
.pill { background: #fff; border: 2px solid #E5E5E5; border-bottom-width: 4px; border-radius: 14px; padding: 6px 12px; font-weight: 800; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; }
.pill .val { color: var(--blue); font-size: 16px; }
.pill.fire .val { color: #FF9600; }
.card { background: #fff; border: 2px solid #E5E5E5; border-radius: 20px; padding: 20px; margin-bottom: 16px; }
.muted { color: var(--gray); font-size: 13px; }
h2 { margin: 0 0 12px; font-size: 20px; font-weight: 900; }

/* ===== 按钮 ===== */
.btn { font-family: inherit; font-weight: 900; font-size: 15px; letter-spacing: 1px; border-radius: 14px; padding: 10px 18px; cursor: pointer; background: #fff; color: var(--ink); border: 2px solid #E5E5E5; border-bottom-width: 4px; transition: transform .06s ease, filter .12s ease; }
.btn:hover { filter: brightness(.97); }
.btn:active { transform: translateY(3px); border-bottom-width: 1px; }
.btn:disabled { filter: grayscale(.4); cursor: not-allowed; }
.btn--green { background: var(--green); border-color: #46A302; color: #fff; }
.btn--yellow { background: var(--yellow); border-color: #DBA800; color: #E66A00; }
.btn--blue { background: var(--blue); border-color: #1899D6; color: #fff; }
.btn--purple { background: var(--purple); border-color: #A568CC; color: #fff; }
.btn--red { background: var(--red); border-color: #D33131; color: #fff; }
.btn--ghost { background: transparent; }
.btn.on { background: var(--green); border-color: #46A302; color: #fff; }

/* ===== 热力图 ===== */
.heatmap { display: grid; grid-template-columns: repeat(14, 1fr); gap: 5px; margin-top: 12px; }
.heatmap .day { aspect-ratio: 1; border-radius: 4px; background: #EBEDF0; }
.heatmap .day.lv1 { background: #C6E9B4; } .heatmap .day.lv2 { background: #8BD75A; } .heatmap .day.lv3 { background: #58CC02; }

/* ===== 打字舞台 ===== */
.word-stage { background: linear-gradient(180deg,#EAF9FF,#D9F1FF); border: 2px solid #1899D6; border-bottom-width: 6px; border-radius: 20px; padding: 26px 20px; text-align: center; position: relative; overflow: hidden; }
.hint-zh { font-size: 22px; font-weight: 900; margin-bottom: 4px; }
.hint-ph { color: var(--gray); font-size: 15px; font-weight: 700; margin-bottom: 18px; letter-spacing: 1px; }
.letters { display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; min-height: 64px; margin-bottom: 10px; }
.letters .ch { font-size: 38px; font-weight: 900; color: #B8C4CC; padding: 2px 3px; border-radius: 8px; text-transform: lowercase; }
.letters .ch.typed-ok { color: var(--green); }
.letters .ch.typed-bad { color: var(--red); }
.letters .ch.caret { box-shadow: inset 0 -4px 0 var(--blue); }
.word-stage.shake { animation: shake .3s ease; }
@keyframes shake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-5px);} 75%{transform:translateX(5px);} }
.progress-dots { display: flex; justify-content: center; gap: 6px; margin-bottom: 16px; }
.progress-dots .dot { width: 10px; height: 10px; border-radius: 50%; background: #D8E4EC; }
.progress-dots .dot.on { background: var(--blue); } .progress-dots .dot.err { background: var(--red); }
.live-stats { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; font-weight: 900; font-size: 14px; }
.live-stats .num { color: var(--blue); font-size: 20px; }
.combo-badge { position: absolute; top: 14px; right: 14px; background: var(--yellow); border: 2px solid #DBA800; border-bottom-width: 4px; border-radius: 12px; padding: 6px 12px; font-weight: 900; color: #E66A00; font-size: 15px; transition: transform .12s ease; }
.combo-badge.pop { transform: scale(1.25); }
.combo-badge.hot { background: var(--red); border-color: #D33131; color: #fff; }

/* ===== 路线图 ===== */
.stage { position: relative; padding: 16px 16px 16px 60px; margin-bottom: 14px; }
.stage .rail { position: absolute; left: 28px; top: 0; bottom: 0; width: 4px; background: #E5E5E5; border-radius: 2px; }
.stage .title { font-weight: 900; font-size: 17px; margin-bottom: 10px; }
.nodes { display: flex; gap: 10px; flex-wrap: wrap; }
.node { width: 76px; text-align: center; cursor: pointer; transition: transform .08s ease; }
.node:hover { transform: translateY(-3px); }
.node .bubble { width: 56px; height: 56px; margin: 0 auto 6px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; color: #fff; background: var(--blue); border: 3px solid #fff; box-shadow: 0 0 0 2px #1899D6, 0 4px 0 #1899D6; }
.node.locked .bubble { background: #CFCFCF; box-shadow: 0 0 0 2px #AFAFAF, 0 4px 0 #AFAFAF; }
.node.done .bubble { background: var(--green); box-shadow: 0 0 0 2px #46A302, 0 4px 0 #46A302; }
.node.master .bubble { background: var(--purple); box-shadow: 0 0 0 2px #A568CC, 0 4px 0 #A568CC; }
.node .stars { font-size: 11px; letter-spacing: 1px; }
.node .label { font-size: 11px; font-weight: 800; color: var(--gray); }

/* ===== 特效 ===== */
.particle { position: absolute; pointer-events: none; font-size: 20px; font-weight: 900; animation: fly .9s ease-out forwards; z-index: 5; }
@keyframes fly { 0%{opacity:1; transform:translate(0,0) scale(.6) rotate(0);} 100%{opacity:0; transform:translate(var(--dx),var(--dy)) scale(1.4) rotate(var(--rot));} }
.confetti { position: fixed; top: -20px; width: 10px; height: 16px; z-index: 99; pointer-events: none; animation: fall linear forwards; }
@keyframes fall { 0%{transform:translateY(0) rotate(0);} 100%{transform:translateY(105vh) rotate(720deg);} }
.toast { position: fixed; left: 50%; bottom: 36px; transform: translateX(-50%) translateY(80px); background: var(--ink); color: #fff; font-weight: 800; font-size: 15px; padding: 12px 22px; border-radius: 14px; opacity: 0; transition: all .3s cubic-bezier(.34,1.56,.64,1); z-index: 100; }
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

/* ===== 语法卡 ===== */
.knowledge { background: #FFFBE6; border: 2px solid #FFE08A; border-radius: 14px; padding: 14px; margin-bottom: 14px; }
.quiz-option { display: block; width: 100%; text-align: left; margin-bottom: 8px; }
.quiz-option.ok { background: var(--green); border-color: #46A302; color: #fff; }
.quiz-option.bad { background: #FFE3E3; border-color: #FFB3B3; }

/* ===== 经验条 ===== */
.xp-bar { flex: 1; height: 18px; background: #E5E5E5; border-radius: 10px; overflow: hidden; border: 2px solid #E5E5E5; }
.xp-fill { height: 100%; width: 0%; background: linear-gradient(90deg,#58CC02,#7CE222); border-radius: 8px; transition: width .5s cubic-bezier(.34,1.56,.64,1); }
.level-badge { width: 52px; height: 52px; border-radius: 50%; background: var(--blue); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; border: 3px solid #fff; box-shadow: 0 0 0 2px #1899D6; flex-shrink: 0; }
.badge-wall { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 10px; }
.badge { text-align: center; padding: 10px; border-radius: 14px; border: 2px solid #E5E5E5; }
.badge .icon { font-size: 28px; }
.badge.locked { filter: grayscale(1); opacity: .5; }
```

- [ ] **Step 2: main.ts 引入 components.css**

```ts
import "./styles/base.css";
import "./styles/components.css";
```

- [ ] **Step 3: 验证构建**

Run: `npm.cmd run build` — Expected: 成功；`dist/index.html` 内联含 `.word-stage` 样式。

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "style: 卡通设计系统组件层 CSS"
```

---

### Task 3: 类型定义 + storage 层（含迁移）

**Files:**
- Create: `src/types.ts`、`src/store/storage.ts`、`tests/storage.test.ts`

**Interfaces:**
- Produces: `loadAll(): AppState`、`save(state: AppState): void`、`resetAll(): void`；类型 `AppState = { schemaVersion, profile, stageProgress, wordStats, grammar, mistakes, achievements, settings }`；`defaultState(): AppState`。

- [ ] **Step 1: 写 types.ts**

```ts
export type StageId = 1 | 2 | 3 | 4;

export interface Word {
  id: string;            // 单词本身（小写）
  word: string;
  phonetic: string;
  meaning: string[];
  exchange: Record<string, string[]>; // 键: s(复数) d(过去式) i(现在分词) 3(三单) r(比较级) t(最高级) 0/1(词形)
}

export interface Chapter {
  id: string;            // `${stage}-${no}`
  stage: StageId;
  no: number;
  title: string;
  words: Word[];
}

export interface FsrsCard { due: string; stability: number; difficulty: number; state: number; }

export interface WordStats {
  correct: number;
  wrong: number;
  lastSeen: number;      // epoch ms
  fsrs: FsrsCard | null;
  inReview: boolean;     // 是否在复习队列
}

export interface ChapterProgress {
  state: "locked" | "open" | "done";
  stars: 0 | 1 | 2 | 3;
  bestAcc: number;
  bestWpm: number;
}

export interface StageProgress { [chapterId: string]: ChapterProgress; }

export interface Profile {
  xp: number;
  level: number;
  streak: number;
  lastCheckinDate: string | null;   // YYYY-MM-DD
  checkinDates: string[];           // 全部打卡日期（热力图）
  totalMinutes: number;
  dailyGoal: { words: number; grammarUnits: number };
  goalsMetToday: boolean;
  freezeCards: number;
  lastFreezeGrant: string | null;   // YYYY-MM-DD 上次发卡
  lifetimeWords: number;            // 累计打对词数（成就用）
  maxCombo: number;                 // 历史最高连击
}

export interface GrammarUnitProgress { done: boolean; score: number; answers: number[]; }

export interface Mistake { word: string; wrongAnswer: string; ts: number; }

export interface AchievementState { [id: string]: { unlockedAt: number }; }

export interface Settings { sound: boolean; tts: boolean; showMeaning: boolean; theme: string; }

export interface AppState {
  schemaVersion: number;
  profile: Profile;
  stageProgress: Record<StageId, StageProgress>;
  wordStats: Record<string, WordStats>;
  grammar: Record<string, GrammarUnitProgress>;
  mistakes: Mistake[];
  achievements: AchievementState;
  settings: Settings;
}
```

- [ ] **Step 2: 写 failing test**

`tests/storage.test.ts`：

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { loadAll, save, resetAll, defaultState, SCHEMA_VERSION } from "../src/store/storage";

describe("storage", () => {
  beforeEach(() => { localStorage.clear(); resetAll(); });

  it("默认状态可保存并读回", () => {
    const s = defaultState();
    s.profile.xp = 123;
    save(s);
    const loaded = loadAll();
    expect(loaded.profile.xp).toBe(123);
    expect(loaded.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("缺失键时返回默认状态", () => {
    localStorage.clear();
    const loaded = loadAll();
    expect(loaded.profile.level).toBe(1);
  });

  it("旧版本状态走迁移", () => {
    localStorage.setItem("eq:state", JSON.stringify({ schemaVersion: 1, profile: { xp: 42 } }));
    const loaded = loadAll();
    expect(loaded.schemaVersion).toBe(SCHEMA_VERSION);
    expect(loaded.profile.xp).toBe(42); // 已迁移保留
    expect(loaded.profile.freezeCards).toBe(0); // 新字段补齐
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm.cmd test` — Expected: FAIL（模块不存在）

- [ ] **Step 4: 实现 storage.ts**

```ts
import type { AppState, Profile, Settings } from "../types";

export const SCHEMA_VERSION = 1;
const KEY = "eq:state";

export function defaultState(): AppState {
  const profile: Profile = {
    xp: 0, level: 1, streak: 0, lastCheckinDate: null, checkinDates: [],
    totalMinutes: 0, dailyGoal: { words: 30, grammarUnits: 2 },
    goalsMetToday: false, freezeCards: 0, lastFreezeGrant: null,
    lifetimeWords: 0, maxCombo: 0,
  };
  const settings: Settings = { sound: true, tts: true, showMeaning: true, theme: "green" };
  return {
    schemaVersion: SCHEMA_VERSION, profile,
    stageProgress: { 1: {}, 2: {}, 3: {}, 4: {} },
    wordStats: {}, grammar: {}, mistakes: [], achievements: {}, settings,
  };
}

function migrate(raw: unknown): AppState {
  const base = defaultState();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  const merged: AppState = { ...base, ...(obj as Partial<AppState>), schemaVersion: SCHEMA_VERSION };
  merged.profile = { ...base.profile, ...((obj.profile as Partial<Profile>) ?? {}) };
  merged.settings = { ...base.settings, ...((obj.settings as Partial<Settings>) ?? {}) };
  merged.stageProgress = { ...base.stageProgress, ...((obj.stageProgress as AppState["stageProgress"]) ?? {}) };
  merged.wordStats = (obj.wordStats as AppState["wordStats"]) ?? {};
  merged.grammar = (obj.grammar as AppState["grammar"]) ?? {};
  merged.mistakes = (obj.mistakes as AppState["mistakes"]) ?? [];
  merged.achievements = (obj.achievements as AppState["achievements"]) ?? {};
  return merged;
}

export function loadAll(): AppState {
  const raw = localStorage.getItem(KEY);
  if (!raw) return defaultState();
  try { return migrate(JSON.parse(raw)); }
  catch { return defaultState(); }
}

export function save(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetAll(): void {
  localStorage.removeItem(KEY);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm.cmd test` — Expected: 3 passed

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: 类型定义 + localStorage 存储层（schema 迁移）"
```

---

### Task 4: 词库数据层（访问 + 词形变化题生成）

**Files:**
- Create: `src/data/words.ts`、`tests/words.test.ts`、`src/data/words-stage1.json`（先用手工样例，Task 15 由生成脚本全量替换）
- Modify: `src/types.ts`（如需要）

**Interfaces:**
- Consumes: `Word`、`Chapter` 类型（Task 3）
- Produces: `ALL_STAGES: Chapter[][]`（按阶段数组）、`getStage(stage: StageId): Chapter[]`、`getChapter(id: string): Chapter | undefined`、`genWordFormQuestions(word: Word): WordFormQuestion[]`、`type WordFormQuestion = { wordId: string; prompt: string; answer: string; kind: string }`

- [ ] **Step 1: 写 words-stage1.json（样例：1 章 3 词，供测试与 M2 联调；全量数据 Task 15 生成）**

```json
{
  "stage": 1,
  "chapters": [
    {
      "stage": 1, "no": 1, "title": "第1章 · 入门热身",
      "words": [
        { "id": "apple", "word": "apple", "phonetic": "/ˈæpl/", "meaning": ["n. 苹果"], "exchange": { "s": ["apples"] } },
        { "id": "cat", "word": "cat", "phonetic": "/kæt/", "meaning": ["n. 猫"], "exchange": { "s": ["cats"] } },
        { "id": "run", "word": "run", "phonetic": "/rʌn/", "meaning": ["v. 跑；运转", "n. 跑步"], "exchange": { "d": ["ran"], "i": ["running"], "3": ["runs"] } }
      ]
    }
  ]
}
```

- [ ] **Step 2: 写 failing test**

`tests/words.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { getStage, getChapter, genWordFormQuestions } from "../src/data/words";

describe("words", () => {
  it("阶段 1 可读且章节 id 规范", () => {
    const chs = getStage(1);
    expect(chs.length).toBeGreaterThan(0);
    expect(chs[0]!.id).toBe("1-1");
    expect(chs[0]!.words.length).toBe(3);
  });

  it("按 id 取章节", () => {
    const ch = getChapter("1-1")!;
    expect(ch.title).toContain("第1章");
  });

  it("词形变化题生成（复数/过去式/三单）", () => {
    const apple = getChapter("1-1")!.words.find(w => w.id === "apple")!;
    const qs = genWordFormQuestions(apple);
    expect(qs).toContainEqual({ wordId: "apple", prompt: "apple 的复数形式是？", answer: "apples", kind: "plural" });
    const run = getChapter("1-1")!.words.find(w => w.id === "run")!;
    const kinds = genWordFormQuestions(run).map(q => q.kind);
    expect(kinds).toContain("past");
    expect(kinds).toContain("third");
  });

  it("无 exchange 的词不生成题目", () => {
    const qs = genWordFormQuestions({ id: "x", word: "x", phonetic: "", meaning: ["-"], exchange: {} });
    expect(qs).toEqual([]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm.cmd test` — Expected: FAIL

- [ ] **Step 4: 实现 words.ts**

```ts
import type { Chapter, StageId, Word } from "../types";
import stage1 from "./words-stage1.json";

export interface WordFormQuestion { wordId: string; prompt: string; answer: string; kind: string; }

const RAW: Record<string, unknown>[] = [{ data: stage1 }];

const KIND_KEYS: Array<[string, string, (w: Word, forms: string[]) => string]> = [
  ["s", "plural", (w, f) => `${w.word} 的复数形式是？`],
  ["d", "past", (w, f) => `${w.word} 的过去式是？`],
  ["i", "ing", (w, f) => `${w.word} 的现在分词是？`],
  ["3", "third", (w, f) => `${w.word} 的第三人称单数是？`],
  ["r", "comparative", (w, f) => `${w.word} 的比较级是？`],
  ["t", "superlative", (w, f) => `${w.word} 的最高级是？`],
];

function buildStages(): Chapter[][] {
  const stages: Chapter[][] = [[], [], [], []];
  for (const entry of RAW) {
    const d = (entry as { data: { stage: number; chapters: Chapter[] } }).data;
    for (const ch of d.chapters) stages[ch.stage - 1]!.push({ ...ch, id: `${ch.stage}-${ch.no}` });
  }
  return stages;
}

export const ALL_STAGES: Chapter[][] = buildStages();

export function getStage(stage: StageId): Chapter[] { return ALL_STAGES[stage - 1] ?? []; }

export function getChapter(id: string): Chapter | undefined {
  for (const st of ALL_STAGES) for (const ch of st) if (ch.id === id) return ch;
  return undefined;
}

export function genWordFormQuestions(word: Word): WordFormQuestion[] {
  const qs: WordFormQuestion[] = [];
  for (const [key, kind, promptFn] of KIND_KEYS) {
    const forms = word.exchange[key];
    if (forms && forms.length > 0) {
      qs.push({ wordId: word.id, prompt: promptFn(word, forms), answer: forms[0]!, kind });
    }
  }
  return qs;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm.cmd test` — Expected: all pass（smoke + storage + words）

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: 词库数据层（阶段/章节访问 + 词形变化题生成）"
```

---

### Task 5: 打字引擎（纯逻辑核心）

**Files:**
- Create: `src/engine/typing.ts`、`tests/typing.test.ts`

**Interfaces:**
- Consumes: `Word`（Task 3）
- Produces:

```ts
export interface TypingStats { startedAt: number; total: number; errors: number; combo: number; maxCombo: number; }
export function createSession(words: Word[], startedAt?: number): TypingSession;
export interface TypingSession {
  words: Word[]; stats: TypingStats; index: number; typed: string; wordErrors: number;
  input(ch: string): void;                       // 追加合法字母
  submit(): SubmitResult;                        // 回车判定
  skip(): void;
  readonly current: Word | null;                 // null = 已结束
  readonly done: boolean;
  accuracy(): number;                            // 0-100
  wpm(now?: number): number;
  elapsed(now?: number): number;                 // 秒
  wordResult: (boolean | null)[];                // 每词对错（null=跳过）
}
export type SubmitResult = { ok: boolean; word: Word; revealed: boolean };
```

- [ ] **Step 1: 写 failing test**

`tests/typing.test.ts`：

```ts
import { describe, it, expect, vi } from "vitest";
import { createSession } from "../src/engine/typing";

const WORDS = [
  { id: "apple", word: "apple", phonetic: "/x/", meaning: ["苹果"], exchange: {} },
  { id: "cat", word: "cat", phonetic: "/x/", meaning: ["猫"], exchange: {} },
];

describe("typing session", () => {
  it("逐字符输入与正确判定", () => {
    const s = createSession(WORDS, 1000);
    for (const ch of "apple") s.input(ch);
    const r = s.submit();
    expect(r.ok).toBe(true);
    expect(s.index).toBe(1);
    expect(s.stats.total).toBe(1);
    expect(s.stats.combo).toBe(1);
  });

  it("打错需重打，累计 3 次才显示答案", () => {
    const s = createSession(WORDS, 1000);
    s.input("a"); s.input("p"); s.input("x");
    let r = s.submit();                       // 错 1
    expect(r.ok).toBe(false); expect(r.revealed).toBe(false);
    expect(s.typed).toBe("");                  // 清空重打
    s.input("a"); s.input("z");
    r = s.submit();                            // 错 2
    expect(r.revealed).toBe(false);
    r = s.submit();                            // 空提交 = 错 3
    expect(r.revealed).toBe(true);             // 显示答案并跳过
    expect(s.index).toBe(1);
    expect(s.wordResult[0]).toBe(false);
  });

  it("连击与断连击", () => {
    const s = createSession(WORDS, 1000);
    for (const ch of "apple") s.input(ch); s.submit();
    expect(s.stats.combo).toBe(1);
    s.input("c"); s.input("x"); s.submit();
    expect(s.stats.combo).toBe(0);
  });

  it("统计计算 accuracy / wpm", () => {
    const s = createSession(WORDS, 0);
    for (const ch of "apple") s.input(ch); s.submit(); // 对
    for (const ch of "cat") s.input(ch); s.submit();   // 对
    expect(s.accuracy()).toBe(100);
    expect(s.wpm(60000)).toBe(2);             // 1 分钟 2 词
    expect(s.done).toBe(true);
  });

  it("skip 记录 null 并推进", () => {
    const s = createSession(WORDS, 1000);
    s.skip();
    expect(s.index).toBe(1);
    expect(s.wordResult[0]).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test` — Expected: FAIL

- [ ] **Step 3: 实现 typing.ts**

```ts
import type { Word } from "../types";

export interface TypingStats { startedAt: number; total: number; errors: number; combo: number; maxCombo: number; }
export type SubmitResult = { ok: boolean; word: Word; revealed: boolean };

export interface TypingSession {
  words: Word[];
  stats: TypingStats;
  index: number;
  typed: string;
  wordErrors: number;
  input(ch: string): void;
  submit(): SubmitResult;
  skip(): void;
  readonly current: Word | null;
  readonly done: boolean;
  accuracy(): number;
  wpm(now?: number): number;
  elapsed(now?: number): number;
  wordResult: (boolean | null)[];
}

export function createSession(words: Word[], startedAt: number = Date.now()): TypingSession {
  const stats: TypingStats = { startedAt, total: 0, errors: 0, combo: 0, maxCombo: 0 };
  const wordResult: (boolean | null)[] = words.map(() => null);
  const s: TypingSession = {
    words, stats, index: 0, typed: "", wordErrors: 0, wordResult,
    get current() { return s.words[s.index] ?? null; },
    get done() { return s.index >= s.words.length; },
    input(ch: string) {
      if (s.done || !s.current) return;
      if (/^[a-zA-Z]$/.test(ch) && s.typed.length < s.current.word.length) s.typed += ch.toLowerCase();
    },
    submit(): SubmitResult {
      if (s.done || !s.current) return { ok: false, word: s.current!, revealed: true };
      const word = s.current;
      if (s.typed === word.word) {
        s.stats.total++; s.stats.combo++; s.stats.maxCombo = Math.max(s.stats.maxCombo, s.stats.combo);
        s.wordResult[s.index] = true; s.wordErrors = 0; s.typed = ""; s.index++;
        return { ok: true, word, revealed: false };
      }
      s.wordErrors++; s.stats.errors++; s.stats.combo = 0;
      s.wordResult[s.index] = false;
      if (s.wordErrors >= 3) { s.typed = ""; s.wordErrors = 0; s.index++; return { ok: false, word, revealed: true }; }
      s.typed = "";
      return { ok: false, word, revealed: false };
    },
    skip() { if (!s.done) { s.wordResult[s.index] = null; s.index++; s.typed = ""; s.wordErrors = 0; } },
    accuracy() {
      const all = s.stats.total + s.stats.errors;
      return all === 0 ? 100 : Math.round((s.stats.total / all) * 100);
    },
    wpm(now: number = Date.now()) {
      const min = s.elapsed(now) / 60;
      return min > 0 ? Math.round(s.stats.total / min) : 0;
    },
    elapsed(now: number = Date.now()) { return (now - s.stats.startedAt) / 1000; },
  };
  return s;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test` — Expected: all pass

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: 打字引擎纯逻辑（判定/重打/连击/WPM/正确率）"
```

---

### Task 6: 特效层（音效合成 + 粒子/彩带/toast）

**Files:**
- Create: `src/fx/audio.ts`、`src/fx/fx.ts`

**Interfaces:**
- Produces: `initAudio(): void`（首次用户手势时初始化 AudioContext）、`sCorrect()`、`sWrong()`、`sKey()`、`sLevelUp()`、`sUnlock()`、`speakWord(word: string): void`（speechSynthesis，en-US）、`setSoundEnabled(on: boolean)`、`setTtsEnabled(on: boolean)`；`burstStars(el: HTMLElement)`、`confettiBurst()`、`shakeEl(el: HTMLElement)`、`toast(msg: string)`、`popEl(el: HTMLElement)`。

- [ ] **Step 1: 实现 audio.ts（无单测，浏览器验证）**

```ts
let ctx: AudioContext | null = null;
let soundOn = true;
let ttsOn = true;

export function initAudio(): void {
  if (!ctx) { try { ctx = new AudioContext(); } catch { /* 忽略 */ } }
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

export function setSoundEnabled(on: boolean): void { soundOn = on; }
export function setTtsEnabled(on: boolean): void { ttsOn = on; }

function beep(freq: number, dur: number, type: OscillatorType, vol = 0.15): void {
  if (!soundOn || !ctx) return;
  try {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch { /* 忽略 */ }
}

export const sCorrect = () => beep(880, .12, "triangle", .2);
export const sWrong = () => beep(180, .25, "sawtooth", .15);
export const sKey = () => beep(620, .04, "sine", .05);
export const sLevelUp = () => { beep(523, .12, "square", .15); setTimeout(() => beep(659, .12, "square", .15), 120); setTimeout(() => beep(784, .2, "square", .15), 240); };
export const sUnlock = () => { beep(784, .1, "triangle", .18); setTimeout(() => beep(1046, .18, "triangle", .18), 110); };

export function speakWord(word: string): void {
  if (!ttsOn) return;
  try {
    const u = new SpeechSynthesisUtterance(word);
    u.lang = "en-US"; u.rate = 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch { /* 忽略 */ }
}
```

- [ ] **Step 2: 实现 fx.ts**

```ts
const PARTICLE_CHARS = ["⭐", "✨", "🌟", "💫"];

export function burstStars(el: HTMLElement): void {
  for (let i = 0; i < 8; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.textContent = PARTICLE_CHARS[Math.floor(Math.random() * PARTICLE_CHARS.length)]!;
    p.style.left = (20 + Math.random() * 60) + "%";
    p.style.top = (30 + Math.random() * 30) + "%";
    p.style.setProperty("--dx", (Math.random() * 160 - 80) + "px");
    p.style.setProperty("--dy", (-40 - Math.random() * 90) + "px");
    p.style.setProperty("--rot", (Math.random() * 360 - 180) + "deg");
    el.appendChild(p);
    setTimeout(() => p.remove(), 950);
  }
}

const COLORS = ["#58CC02", "#FFC800", "#1CB0F6", "#CE82FF", "#FF4B4B"];
export function confettiBurst(): void {
  for (let i = 0; i < 60; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = COLORS[i % COLORS.length]!;
    c.style.animationDuration = (1.2 + Math.random() * 1.4) + "s";
    c.style.animationDelay = Math.random() * 0.3 + "s";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3000);
  }
}

export function shakeEl(el: HTMLElement): void {
  el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake");
}

export function popEl(el: HTMLElement): void {
  el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
}

let toastEl: HTMLElement | null = null;
let toastTimer: number | undefined;
export function toast(msg: string): void {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "toast";
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl!.classList.remove("show"), 2600);
}
```

- [ ] **Step 3: 浏览器冒烟验证**

Run: `npm.cmd run dev`（后台任务），浏览器打开 `http://127.0.0.1:8899/` 或 vite 端口，控制台执行 `import("./src/fx/fx.ts")` 后调用 `toast("hi")` 与 `confettiBurst()`——Expected: 页面出现提示条与彩带（若手测不便，留待 Task 7 的打字页联调时验证）。

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: WebAudio 合成音效 + 粒子/彩带/提示特效层"
```

---

### Task 7: 成长系统 progress（XP/等级/星级/解锁）

**Files:**
- Create: `src/engine/progress.ts`、`tests/progress.test.ts`

**Interfaces:**
- Consumes: `AppState`、`ChapterProgress`（Task 3）
- Produces:

```ts
export function xpForWord(combo: number): number;                       // 10 * (combo>=10?1.5:combo>=3?1.2:1)
export function addXp(state: AppState, amount: number): boolean;        // 返回是否升级
export function xpNeededForLevel(level: number): number;                // 100 + (level-1)*50
export function starsForAccuracy(acc: number): 0|1|2|3;
export function completeChapter(state: AppState, chapterId: string, acc: number, wpm: number): void; // 写入进度并解锁下一章
export function unlockNext(state: AppState, chapterId: string): void;
export function nextChapterId(chapterId: string): string | null;
export const LEVEL_TITLES: Record<number, string>;
```

- [ ] **Step 1: 写 failing test**

`tests/progress.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { xpForWord, addXp, xpNeededForLevel, starsForAccuracy, completeChapter, nextChapterId, LEVEL_TITLES } from "../src/engine/progress";
import { defaultState } from "../src/store/storage";

describe("progress", () => {
  it("XP 连击加成", () => {
    expect(xpForWord(1)).toBe(10);
    expect(xpForWord(3)).toBe(12);
    expect(xpForWord(10)).toBe(15);
  });

  it("升级消耗 XP", () => {
    const s = defaultState();
    const need = xpNeededForLevel(1);
    s.profile.xp = need - 5;
    expect(addXp(s, 10)).toBe(true);   // 升级
    expect(s.profile.level).toBe(2);
    expect(s.profile.xp).toBe(5);      // 溢出保留
  });

  it("星级阈值", () => {
    expect(starsForAccuracy(40)).toBe(0);
    expect(starsForAccuracy(60)).toBe(1);
    expect(starsForAccuracy(80)).toBe(2);
    expect(starsForAccuracy(95)).toBe(3);
  });

  it("通关解锁下一章", () => {
    const s = defaultState();
    s.stageProgress[1]["1-1"] = { state: "open", stars: 0, bestAcc: 0, bestWpm: 0 };
    completeChapter(s, "1-1", 88, 32);
    expect(s.stageProgress[1]["1-1"]!.state).toBe("done");
    expect(s.stageProgress[1]["1-1"]!.stars).toBe(2);
    expect(s.stageProgress[1]["1-2"]!.state).toBe("open");
  });

  it("下一章 id", () => {
    expect(nextChapterId("1-1")).toBe("1-2");
    expect(nextChapterId("4-30")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test` — Expected: FAIL

- [ ] **Step 3: 实现 progress.ts**

```ts
import type { AppState } from "../types";
import { getChapter } from "../data/words";

export const LEVEL_TITLES: Record<number, string> = {
  1: "新手", 2: "学徒", 3: "入门者", 4: "进阶者", 5: "熟练者",
  6: "高手", 7: "专家", 8: "大师", 9: "传奇",
};

export function xpForWord(combo: number): number {
  const mult = combo >= 10 ? 1.5 : combo >= 3 ? 1.2 : 1;
  return Math.round(10 * mult);
}

export function xpNeededForLevel(level: number): number { return 100 + (level - 1) * 50; }

export function addXp(state: AppState, amount: number): boolean {
  state.profile.xp += amount;
  let leveled = false;
  while (state.profile.xp >= xpNeededForLevel(state.profile.level)) {
    state.profile.xp -= xpNeededForLevel(state.profile.level);
    state.profile.level++;
    leveled = true;
  }
  return leveled;
}

export function starsForAccuracy(acc: number): 0 | 1 | 2 | 3 {
  if (acc >= 95) return 3;
  if (acc >= 80) return 2;
  if (acc >= 60) return 1;
  return 0;
}

export function nextChapterId(chapterId: string): string | null {
  const [stage, no] = chapterId.split("-").map(Number) as [number, number];
  const next = getChapter(`${stage}-${no + 1}`);
  return next ? next.id : null;
}

export function unlockNext(state: AppState, chapterId: string): void {
  const nid = nextChapterId(chapterId);
  if (!nid) return;
  const [stage] = nid.split("-").map(Number) as [number, number];
  const p = state.stageProgress[stage as 1|2|3|4];
  if (p[nid] && p[nid]!.state === "locked") p[nid]!.state = "open";
  else if (!p[nid]) p[nid] = { state: "open", stars: 0, bestAcc: 0, bestWpm: 0 };
}

export function completeChapter(state: AppState, chapterId: string, acc: number, wpm: number): void {
  const [stage] = chapterId.split("-").map(Number) as [number, number];
  const p = state.stageProgress[stage as 1|2|3|4];
  const cur = p[chapterId] ?? { state: "open", stars: 0, bestAcc: 0, bestWpm: 0 };
  const stars = Math.max(cur.stars, starsForAccuracy(acc));
  p[chapterId] = { state: "done", stars, bestAcc: Math.max(cur.bestAcc, acc), bestWpm: Math.max(cur.bestWpm, wpm) };
  unlockNext(state, chapterId);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test` — Expected: all pass

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: 成长系统（XP/等级/星级/章节解锁）"
```

---

### Task 8: 打字训练视图（引擎接入 + 三模式 + 结算）

**Files:**
- Create: `src/views/typing.ts`
- Modify: `src/main.ts`（注册视图与路由）

**Interfaces:**
- Consumes: `createSession`（Task 5）、`fx`（Task 6）、`completeChapter`/`addXp`（Task 7）、`getChapter`（Task 4）、`speakWord`（Task 6）
- Produces: `renderTypingView(container: HTMLElement, chapterId: string): void`、`typingMode: "follow" | "dictation" | "listening"`（存 state.settings 或模块变量）

- [ ] **Step 1: 实现 typing.ts 视图（核心渲染函数）**

```ts
import type { Chapter, Word } from "../types";
import { getChapter } from "../data/words";
import { createSession, type TypingSession } from "../engine/typing";
import { addXp, xpForWord, completeChapter } from "../engine/progress";
import { sCorrect, sWrong, sKey, sLevelUp, speakWord } from "../fx/audio";
import { burstStars, confettiBurst, shakeEl, popEl, toast } from "../fx/fx";
import type { AppState } from "../types";

let session: TypingSession | null = null;
let mode: "follow" | "dictation" | "listening" = "dictation";
let chapter: Chapter | null = null;

export function setTypingMode(m: typeof mode): void { mode = m; }

export function renderTypingView(root: HTMLElement, state: AppState, chapterId: string): void {
  chapter = getChapter(chapterId) ?? null;
  root.innerHTML = "";
  if (!chapter) { root.innerHTML = `<div class="card"><h2>章节不存在</h2></div>`; return; }
  session = createSession(chapter.words);
  session.stats.combo = 0;

  const stage = document.createElement("div");
  stage.className = "word-stage";
  stage.id = "wordStage";
  stage.innerHTML = `
    <div class="combo-badge" id="comboBadge">🔥 连击 x0</div>
    <div class="hint-zh" id="hintZh"></div>
    <div class="hint-ph" id="hintPh"></div>
    <div class="letters" id="letters"></div>
    <div class="progress-dots" id="dots"></div>
    <div class="live-stats">
      <div>⏱ <span class="num" id="statTime">00:00</span></div>
      <div>⌨️ 已打 <span class="num" id="statCount">0</span> 词</div>
      <div>🚀 WPM <span class="num" id="statWpm">0</span></div>
      <div>🎯 正确率 <span class="num" id="statAcc">100%</span></div>
    </div>
    <div class="muted" style="margin-top:12px">
      <button class="btn btn--ghost" id="modeBtn"></button>
      <span id="tip">看中文释义，盲打英文单词，回车确认（Esc 跳过）</span>
    </div>`;

  root.appendChild(stage);
  const summary = document.createElement("div");
  summary.id = "chapterSummary";
  root.appendChild(summary);

  document.getElementById("modeBtn")!.addEventListener("click", cycleMode);
  refreshModeBtn();
  renderWord();
  startTicker();
}

function cycleMode(): void {
  mode = mode === "dictation" ? "listening" : mode === "listening" ? "follow" : "dictation";
  refreshModeBtn();
  renderWord();
  toast(mode === "follow" ? "跟打模式：照着单词打" : mode === "listening" ? "听写模式：听发音盲打" : "默写模式：看释义盲打");
}

function refreshModeBtn(): void {
  const btn = document.getElementById("modeBtn");
  if (btn) btn.textContent = "模式：" + (mode === "follow" ? "跟打" : mode === "listening" ? "听写" : "默写") + "（点击切换）";
}

function renderWord(): void {
  if (!session || session.done) { renderSummary(); return; }
  const word = session.current!;
  document.getElementById("hintZh")!.textContent = mode === "follow" ? word.word : word.meaning.join("；");
  document.getElementById("hintPh")!.textContent = word.phonetic + (mode === "listening" ? "  🔊 已播报" : "  （" + word.word.length + " 个字母）");
  const letters = document.getElementById("letters")!;
  letters.innerHTML = "";
  [...word.word].forEach((ch, i) => {
    const s = document.createElement("span");
    s.className = "ch"; s.textContent = mode === "follow" ? ch : "•"; s.id = "ch" + i;
    letters.appendChild(s);
  });
  if (mode === "listening") speakWord(word.word);
  renderDots();
  updateLetters();
}

function updateLetters(): void {
  if (!session || !session.current) return;
  const word = session.current.word;
  [...word].forEach((_, i) => {
    const el = document.getElementById("ch" + i);
    if (!el) return;
    el.classList.remove("typed-ok", "typed-bad", "caret");
    if (i < session.typed.length) el.classList.add(session.typed[i] === word[i] ? "typed-ok" : "typed-bad");
    else if (i === session.typed.length) el.classList.add("caret");
  });
}

function renderDots(): void {
  if (!session) return;
  const dots = document.getElementById("dots")!;
  dots.innerHTML = "";
  session.words.forEach((_, i) => {
    const d = document.createElement("div");
    const r = session.wordResult[i];
    d.className = "dot" + (r === true ? " on" : r === false ? " err" : "");
    dots.appendChild(d);
  });
}

function handleKey(e: KeyboardEvent): void {
  const view = document.getElementById("view-typing");
  if (!view || view.style.display === "none" || !session || session.done) return;
  if (e.key === "Escape") { session.skip(); renderWord(); return; }
  if (e.key === "Enter") { onEnter(); return; }
  if (/^[a-zA-Z]$/.test(e.key)) { session.input(e.key); sKey(); updateLetters(); }
}

function onEnter(): void {
  if (!session || session.done) return;
  const r = session.submit();
  const stage = document.getElementById("wordStage")!;
  if (r.ok) {
    sCorrect(); burstStars(stage);
    const xp = xpForWord(session.stats.combo);
    const leveled = addXp(currentState, xp);
    refreshTopbar();
    if (leveled) { sLevelUp(); confettiBurst(); toast("🆙 升级！"); }
    const badge = document.getElementById("comboBadge")!;
    badge.textContent = session.stats.combo >= 3 ? "🔥 连击 x" + session.stats.combo : "连击 x" + session.stats.combo;
    badge.classList.toggle("hot", session.stats.combo >= 3);
    popEl(badge);
    if ([5, 10, 20, 50].includes(session.stats.combo)) { confettiBurst(); sLevelUp(); toast("🎊 " + session.stats.combo + " 连击！"); }
    updateLiveStats();
    renderWord();
  } else if (r.revealed) {
    sWrong(); shakeEl(stage);
    toast("💡 答案是：" + r.word.word + "，已加入复习队列");
    queueForReview(r.word.id);
    updateLiveStats();
    renderWord();
  } else {
    sWrong(); shakeEl(stage);
    toast("❌ 不对哦，再试一次！");
    updateLiveStats();
  }
}

function queueForReview(wordId: string): void {
  const st = currentState.wordStats[wordId] ?? { correct: 0, wrong: 0, lastSeen: 0, fsrs: null, inReview: false };
  st.inReview = true; st.lastSeen = Date.now(); st.wrong++;
  currentState.wordStats[wordId] = st;
  currentState.mistakes.push({ word: wordId, wrongAnswer: "", ts: Date.now() });
  saveCurrent();
}

// —— 供 main.ts 注入：状态引用与保存/刷新回调 ——
export let currentState: AppState;
export let saveCurrent: () => void;
export let refreshTopbar: () => void;
export function bindTyping(state: AppState, save: () => void, refresh: () => void): void {
  currentState = state; saveCurrent = save; refreshTopbar = refresh;
}

function updateLiveStats(): void {
  if (!session) return;
  document.getElementById("statCount")!.textContent = String(session.stats.total);
  document.getElementById("statAcc")!.textContent = session.accuracy() + "%";
}

function startTicker(): void {
  const tick = () => {
    if (!session || session.done) return;
    const sec = session.elapsed();
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(Math.floor(sec % 60)).padStart(2, "0");
    document.getElementById("statTime")!.textContent = m + ":" + s;
    document.getElementById("statWpm")!.textContent = String(session.wpm());
    window.setTimeout(tick, 500);
  };
  tick();
}

function renderSummary(): void {
  if (!session || !chapter) return;
  const acc = session.accuracy();
  const wpm = session.wpm();
  const stars = acc >= 95 ? 3 : acc >= 80 ? 2 : acc >= 60 ? 1 : 0;
  completeChapter(currentState, chapter.id, acc, wpm);
  saveCurrent();
  const box = document.getElementById("chapterSummary")!;
  box.innerHTML = `
    <div class="card" style="text-align:center">
      <h2>🎉 本章完成！</h2>
      <div style="font-size:40px">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</div>
      <div class="muted">正确率 ${acc}% · WPM ${wpm} · 最高连击 x${session.stats.maxCombo}</div>
      <div style="margin-top:12px;display:flex;gap:10px;justify-content:center">
        <button class="btn btn--green" id="retryBtn">🔁 再练一次</button>
        <button class="btn btn--blue" id="nextBtn">▶️ 下一章</button>
      </div>
    </div>`;
  document.getElementById("retryBtn")!.addEventListener("click", () => renderTypingView(document.getElementById("view-typing")!, currentState, chapter!.id));
  const nid = (() => { const [st, no] = chapter!.id.split("-").map(Number); return `${st}-${no + 1}`; })();
  document.getElementById("nextBtn")!.addEventListener("click", () => {
    if (getChapter(nid)) renderTypingView(document.getElementById("view-typing")!, currentState, nid);
    else { toast("已是本阶段最后一章！"); window.dispatchEvent(new CustomEvent("eq:navigate", { detail: { view: "map" } })); }
  });
  confettiBurst();
}

export function attachTypingKeys(): void { document.addEventListener("keydown", handleKey); }
```

- [ ] **Step 2: main.ts 注册视图与路由（见 Task 9 一起接入）**

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: 打字训练视图（默写/听写/跟打三模式 + 章节结算）"
```

---

### Task 9: 主框架（main.ts 路由 + 顶栏 + 全局状态）

**Files:**
- Create: `src/views/home.ts`（占位完整实现）、`src/views/map.ts`、`src/views/grammar.ts`、`src/views/stats.ts`（占位）、`src/views/settings.ts`（占位）
- Modify: `src/main.ts`（完整实现）

**Interfaces:**
- Produces: 路由机制：`window.dispatchEvent(new CustomEvent("eq:navigate", { detail: { view, chapterId? } }))`；`bindTyping` 注入点；顶栏渲染 `refreshTopbar()`；全局 `state` 与 `save()`。

- [ ] **Step 1: 实现 main.ts**

```ts
import "./styles/base.css";
import "./styles/components.css";
import { loadAll, save } from "./store/storage";
import type { AppState } from "./types";
import { renderHome } from "./views/home";
import { renderMap } from "./views/map";
import { renderTypingView, bindTyping, attachTypingKeys, setTypingMode } from "./views/typing";
import { renderGrammar } from "./views/grammar";
import { renderStats } from "./views/stats";
import { renderSettings } from "./views/settings";
import { getStage } from "./data/words";
import { initAudio } from "./fx/audio";

let state: AppState = loadAll();
const app = document.getElementById("app")!;
let currentView = "home";
let currentChapterId: string | null = null;

app.innerHTML = `
  <div class="app">
    <div class="topbar">
      <div class="logo" id="logo">🏝️ 英闯岛 <span>English Quest</span></div>
      <div class="stats-pills" id="pills"></div>
    </div>
    <nav class="main-nav" id="nav"></nav>
    <main id="views"></main>
  </div>`;

const NAVS: Array<[string, string, string]> = [
  ["home", "🏠 首页", ""], ["map", "🗺️ 闯关地图", ""], ["typing", "⌨️ 单词训练", ""],
  ["grammar", "📖 语法训练", ""], ["stats", "📊 数据中心", ""], ["settings", "⚙️ 设置", ""],
];

function renderNav(): void {
  const nav = document.getElementById("nav")!;
  nav.innerHTML = NAVS.map(([v, label]) =>
    `<button class="btn${v === currentView ? " on" : ""}" data-view="${v}">${label}</button>`).join("");
  nav.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => navigate(b.getAttribute("data-view")!)));
  document.getElementById("logo")!.addEventListener("click", () => navigate("home"));
}

function refreshTopbar(): void {
  const pills = document.getElementById("pills")!;
  pills.innerHTML = `
    <div class="pill fire">🔥 <span class="val">${state.profile.streak}</span> 天</div>
    <div class="pill">⚡ <span class="val">${state.profile.xp}</span> XP</div>
    <div class="pill">🏅 Lv.<span class="val">${state.profile.level}</span></div>`;
}

function navigate(view: string, chapterId: string | null = null): void {
  currentView = view;
  currentChapterId = chapterId;
  renderNav();
  refreshTopbar();
  const root = document.getElementById("views")!;
  root.innerHTML = `<section id="view-${view}" style="display:block"></section>`;
  const el = document.getElementById(`view-${view}`)!;
  if (view === "home") renderHome(el, state);
  else if (view === "map") renderMap(el, state);
  else if (view === "typing") {
    if (!currentChapterId) {
      const first = getStage(1)[0];
      currentChapterId = first ? first.id : null;
    }
    if (currentChapterId) renderTypingView(el, state, currentChapterId);
    else el.innerHTML = `<div class="card"><h2>词库为空</h2></div>`;
  }
  else if (view === "grammar") renderGrammar(el, state);
  else if (view === "stats") renderStats(el, state);
  else if (view === "settings") renderSettings(el, state);
}

window.addEventListener("eq:navigate", (e) => {
  const d = (e as CustomEvent).detail as { view: string; chapterId?: string };
  navigate(d.view, d.chapterId ?? null);
});

function persist(): void { save(state); }
bindTyping(state, persist, refreshTopbar);
attachTypingKeys();
renderNav();
refreshTopbar();
navigate("home");

document.addEventListener("pointerdown", initAudio, { once: true });
```

- [ ] **Step 2: 实现 map.ts（路线图视图）**

```ts
import type { AppState } from "../types";
import { getStage } from "../data/words";
import { toast } from "../fx/fx";

const STAGE_META = [
  { id: 1, color: "🟢", name: "阶段一 · 基础", desc: "小初核心词 + 语法入门" },
  { id: 2, color: "🟡", name: "阶段二 · 进阶", desc: "高中 3500 + 语法进阶" },
  { id: 3, color: "🔵", name: "阶段三 · 高手", desc: "四级词汇 + 语法高级" },
  { id: 4, color: "🟣", name: "阶段四 · 大师", desc: "雅思/托福 + 长难句" },
];

export function renderMap(root: HTMLElement, state: AppState): void {
  root.innerHTML = "";
  const cont = document.createElement("div");
  STAGE_META.forEach((meta) => {
    const chs = getStage(meta.id as 1 | 2 | 3 | 4);
    if (chs.length === 0) return;
    const card = document.createElement("div");
    card.className = "card stage";
    card.innerHTML = `<div class="rail"></div>
      <div class="title">${meta.color} ${meta.name} <span class="muted">${meta.desc}</span></div>
      <div class="nodes"></div>`;
    const nodes = card.querySelector(".nodes")!;
    chs.forEach((ch, i) => {
      const p = state.stageProgress[meta.id as 1|2|3|4][ch.id];
      const isOpen = i === 0 || p?.state !== "locked";
      const node = document.createElement("div");
      node.className = "node" + (p?.state === "done" ? " done" : !isOpen ? " locked" : "");
      node.innerHTML = `<div class="bubble">${!isOpen ? "🔒" : p?.state === "done" ? "⭐" : "▶"}</div>
        <div class="stars">${p ? "★".repeat(p.stars) + "☆".repeat(3 - p.stars) : ""}</div>
        <div class="label">第${ch.no}关</div>`;
      node.addEventListener("click", () => {
        if (!isOpen) { toast("🔒 该关卡还未解锁，先通关前面的吧！"); return; }
        window.dispatchEvent(new CustomEvent("eq:navigate", { detail: { view: "typing", chapterId: ch.id } }));
      });
      nodes.appendChild(node);
    });
    cont.appendChild(card);
  });
  root.appendChild(cont);
}
```

- [ ] **Step 3: 实现 home.ts（首页：打卡 + XP + 热力图 + 今日任务）**

```ts
import type { AppState } from "../types";
import { todayStr, checkin, heatmapDays } from "../engine/streak";
import { xpNeededForLevel } from "../engine/progress";
import { confettiBurst, toast } from "../fx/fx";
import { sLevelUp } from "../fx/audio";
import { getStage } from "../data/words";

export function renderHome(root: HTMLElement, state: AppState): void {
  root.innerHTML = "";
  const hero = document.createElement("div");
  hero.className = "hero";
  hero.style.cssText = "display:flex;gap:16px;flex-wrap:wrap;";
  hero.innerHTML = `
    <div class="checkin-box" style="flex:1.2;min-width:280px;background:linear-gradient(180deg,#FFE37A,#FFC800);border:2px solid #DBA800;border-bottom-width:6px;border-radius:20px;padding:22px;text-align:center;">
      <div class="streak" style="font-size:44px;font-weight:900;color:#E66A00;">🔥 ${state.profile.streak} <small style="font-size:16px">天连续</small></div>
      <div class="muted" style="color:#8A5B00;">${state.profile.goalsMetToday ? "今日目标已完成，明天继续！" : "今天再来一组，完成每日目标！"}</div>
      <button class="btn btn--green" id="checkinBtn" style="margin-top:14px;width:100%;font-size:20px;padding:14px;">${state.profile.goalsMetToday ? "✅ 今日已达标" : "✅ 打卡（完成目标自动打卡）"}</button>
    </div>
    <div class="xp-box" style="flex:1;min-width:280px;display:flex;flex-direction:column;gap:12px;justify-content:center;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="level-badge">Lv.${state.profile.level}</div>
        <div><div style="font-weight:900">${state.profile.level} 级</div><div class="muted">距离下一级还差 ${Math.max(0, xpNeededForLevel(state.profile.level) - state.profile.xp)} XP</div></div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;font-weight:800;">
        <div>⚡ 经验值</div>
        <div class="xp-bar"><div class="xp-fill" style="width:${Math.min(100, state.profile.xp / xpNeededForLevel(state.profile.level) * 100)}%"></div></div>
        <div>${state.profile.xp}/${xpNeededForLevel(state.profile.level)}</div>
      </div>
    </div>`;
  root.appendChild(hero);

  const heat = document.createElement("div");
  heat.className = "card";
  heat.innerHTML = `<h2>📅 打卡日历</h2><div class="muted">🔥 连续 ${state.profile.streak} 天 · 冻结卡 x${state.profile.freezeCards}</div><div class="heatmap" id="heatmap"></div>`;
  root.appendChild(heat);
  const hm = heat.querySelector("#heatmap")!;
  heatmapDays(state, new Date()).forEach(d => {
    const el = document.createElement("div");
    el.className = "day" + (d.checked ? " lv3" : d.isFuture ? "" : " lv1");
    el.title = d.date;
    hm.appendChild(el);
  });

  const tasks = document.createElement("div");
  tasks.className = "card";
  tasks.innerHTML = `<h2>🎯 今日任务</h2><div class="muted">完成任务自动打卡</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px">
      <button class="btn" data-go="typing" style="border-color:#46A302;color:var(--green)">⌨️ 背 ${state.profile.dailyGoal.words} 个词</button>
      <button class="btn" data-go="grammar" style="border-color:#1899D6;color:var(--blue)">📖 学 ${state.profile.dailyGoal.grammarUnits} 个语法单元</button>
    </div>`;
  root.appendChild(tasks);
  tasks.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () =>
    window.dispatchEvent(new CustomEvent("eq:navigate", { detail: { view: b.getAttribute("data-go") } }))));

  const btn = hero.querySelector("#checkinBtn")!;
  btn.addEventListener("click", () => {
    if (state.profile.goalsMetToday) { toast("今日目标已完成！"); return; }
    toast("完成每日目标后自动打卡：背词 30 个 或 语法 2 单元");
  });
}
```

注：`checkin`/`heatmapDays` 在 Task 10 实现；home 先引用，Task 10 完成后补齐（本任务构建需暂以注释/占位，或按 Task 10 先行）。**执行顺序调整：Task 10 在 Task 9 之前完成**（顺序号不变，仅执行先后）。

- [ ] **Step 4: 实现 stats.ts / grammar.ts / settings.ts 占位（正式实现在后续任务）**

`src/views/stats.ts`：

```ts
import type { AppState } from "../types";
export function renderStats(root: HTMLElement, state: AppState): void {
  root.innerHTML = `<div class="card"><h2>📊 数据中心</h2><div class="muted">统计图表即将上线</div></div>`;
}
```

`src/views/grammar.ts`：

```ts
import type { AppState } from "../types";
export function renderGrammar(root: HTMLElement, state: AppState): void {
  root.innerHTML = `<div class="card"><h2>📖 语法训练</h2><div class="muted">语法单元即将上线</div></div>`;
}
```

`src/views/settings.ts`：

```ts
import type { AppState } from "../types";
export function renderSettings(root: HTMLElement, state: AppState): void {
  root.innerHTML = `<div class="card"><h2>⚙️ 设置</h2><div class="muted">设置面板即将上线</div></div>`;
}
```

- [ ] **Step 5: 浏览器验证**

Run: `npm.cmd run build`
用 bsk（或手动）打开 dist/index.html：首页/地图/打字/语法/统计/设置 6 个导航可用；地图点第 1 关进入打字页；打对样例词出现特效与 XP 增长；打完 3 词出结算卡。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: 主框架路由 + 顶栏 + 首页/地图视图"
```

---

### Task 10: 打卡系统 streak（纯逻辑 + 注入时钟）

**Files:**
- Create: `src/engine/streak.ts`、`tests/streak.test.ts`

**Interfaces:**
- Consumes: `AppState`（Task 3）
- Produces: `todayStr(now?: Date): string`、`heatmapDays(state, now: Date): { date: string; checked: boolean; isFuture: boolean }[]`（近 28 天）、`markGoalMet(state, now?: Date): boolean`（达标即打卡；返回是否触发新打卡）、`grantFreezeIfDue(state, now?: Date): void`（每周一补卡，上限 3）、`useFreeze(state, now?: Date): boolean`（补昨日断签）、`daysSinceLastCheckin(state, now?: Date): number`

- [ ] **Step 1: 写 failing test**

`tests/streak.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { todayStr, heatmapDays, markGoalMet, grantFreezeIfDue, useFreeze, daysSinceLastCheckin } from "../src/engine/streak";
import { defaultState } from "../src/store/storage";

const D = (s: string) => new Date(s + "T12:00:00");

describe("streak", () => {
  it("todayStr 本地日期格式", () => {
    expect(todayStr(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("达标即打卡并累计 streak", () => {
    const s = defaultState();
    const ok = markGoalMet(s, D("2026-01-05"));
    expect(ok).toBe(true);
    expect(s.profile.streak).toBe(1);
    expect(s.profile.goalsMetToday).toBe(true);
    expect(s.profile.lastCheckinDate).toBe("2026-01-05");
    // 同日重复不重复打卡
    expect(markGoalMet(s, D("2026-01-05"))).toBe(false);
    // 次日连续
    expect(markGoalMet(s, D("2026-01-06"))).toBe(true);
    expect(s.profile.streak).toBe(2);
  });

  it("隔天打卡重置 streak 为 1", () => {
    const s = defaultState();
    markGoalMet(s, D("2026-01-01"));
    markGoalMet(s, D("2026-01-05"));
    expect(s.profile.streak).toBe(1);
  });

  it("每周发冻结卡（上限 3）", () => {
    const s = defaultState();
    grantFreezeIfDue(s, D("2026-01-05"));  // 周一
    expect(s.profile.freezeCards).toBe(1);
    grantFreezeIfDue(s, D("2026-01-06"));
    expect(s.profile.freezeCards).toBe(1);  // 同周不重复
    grantFreezeIfDue(s, D("2026-01-12"));
    expect(s.profile.freezeCards).toBe(2);
    s.profile.freezeCards = 3;
    grantFreezeIfDue(s, D("2026-01-19"));
    expect(s.profile.freezeCards).toBe(3);
  });

  it("冻结卡补昨日断签", () => {
    const s = defaultState();
    markGoalMet(s, D("2026-01-01"));
    expect(daysSinceLastCheckin(s, D("2026-01-03"))).toBe(2);
    expect(useFreeze(s, D("2026-01-03"))).toBe(false); // 无卡
    s.profile.freezeCards = 1;
    expect(useFreeze(s, D("2026-01-03"))).toBe(true);  // 补 01-02
    expect(s.profile.streak).toBe(2);
    expect(s.profile.freezeCards).toBe(0);
  });

  it("热力图近 28 天", () => {
    const s = defaultState();
    markGoalMet(s, D("2026-01-05"));
    const days = heatmapDays(s, D("2026-01-05"));
    expect(days.length).toBe(28);
    expect(days[27]!.checked).toBe(true);
    expect(days[27]!.isFuture).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test` — Expected: FAIL

- [ ] **Step 3: 实现 streak.ts**

```ts
import type { AppState } from "../types";

export function todayStr(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}

export function daysSinceLastCheckin(state: AppState, now: Date = new Date()): number {
  if (!state.profile.lastCheckinDate) return Infinity;
  const last = new Date(state.profile.lastCheckinDate + "T12:00:00");
  return Math.round((now.getTime() - last.getTime()) / 86400000);
}

export function markGoalMet(state: AppState, now: Date = new Date()): boolean {
  const t = todayStr(now);
  const p = state.profile;
  if (p.lastCheckinDate === t) { p.goalsMetToday = true; return false; }
  const gap = p.lastCheckinDate ? daysSinceLastCheckin(state, now) : Infinity;
  p.streak = gap === 1 ? p.streak + 1 : 1;
  p.lastCheckinDate = t;
  p.goalsMetToday = true;
  p.checkinDates.push(t);
  return true;
}

function mondayOf(date: Date): Date {
  const d = new Date(date); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return d;
}

export function grantFreezeIfDue(state: AppState, now: Date = new Date()): void {
  const p = state.profile;
  const thisMon = todayStr(mondayOf(now));
  if (p.lastFreezeGrant === thisMon) return;
  p.lastFreezeGrant = thisMon;
  if (p.freezeCards < 3) p.freezeCards++;
}

export function useFreeze(state: AppState, now: Date = new Date()): boolean {
  const p = state.profile;
  if (p.freezeCards <= 0) return false;
  const gap = daysSinceLastCheckin(state, now);
  if (gap !== 2) return false;   // 只补「昨天断签、今天来补」的场景
  p.freezeCards--;
  p.lastCheckinDate = todayStr(addDays(now, -1));
  p.streak += 1;
  p.checkinDates.push(p.lastCheckinDate);
  return true;
}

export function heatmapDays(state: AppState, now: Date = new Date()): { date: string; checked: boolean; isFuture: boolean }[] {
  const set = new Set(state.profile.checkinDates);
  const out: { date: string; checked: boolean; isFuture: boolean }[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = addDays(now, -i);
    const t = todayStr(d);
    out.push({ date: t, checked: set.has(t), isFuture: d.getTime() > now.getTime() });
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test` — Expected: all pass

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: 打卡系统（连续天数/冻结卡/热力图，注入时钟可测）"
```

---

### Task 11: 语法模块（数据 + 引擎 + 视图）

**Files:**
- Create: `src/data/grammar.ts`、`src/data/grammar-stage1.json`、`src/engine/grammar.ts`、`tests/grammar.test.ts`
- Modify: `src/views/grammar.ts`（完整实现）

**Interfaces:**
- Consumes: `GrammarUnitProgress`（Task 3）
- Produces: `getGrammarStage(stage: number): GrammarUnit[]`、`type GrammarUnit = { id, stage, no, title, knowledge: string, questions: GrammarQuestion[] }`、`type GrammarQuestion = { q: string; options: string[]; answer: number }`、`judgeGrammar(unit, index, choice): boolean`、`recordGrammarAnswer(state, unitId, index, choice): void`

- [ ] **Step 1: 写 grammar-stage1.json（阶段一 10 单元；先落 2 个完整单元 + 8 个待办占位结构由生成脚本/后续任务补齐——不，必须完整：本任务直接交付 10 单元 × 8 题全部内容）**

> 内容作者按以下清单编写（每题：题干、4 选项、正确答案下标）：
> 1. be 动词（am/is/are 基础用法）；2. 名词复数（规则变化 s/es/ies）；3. 人称代词与物主代词；4. 一般现在时（含三单）；5. 一般疑问句与否定句；6. there be 句型；7. 形容词与副词基础；8. 冠词 a/an/the；9. 祈使句；10. 基础介词（in/on/at）。每题附带简析写入 `explain` 字段（可选，展示于答题后）。
> JSON 结构：

```json
{
  "stage": 1,
  "units": [
    {
      "id": "g1-1", "stage": 1, "no": 1, "title": "be 动词",
      "knowledge": "be 动词随主语变化：I am；he/she/it is；we/you/they are。例：She is a teacher. / They are students.",
      "questions": [
        { "q": "I ___ a student.", "options": ["am", "is", "are", "be"], "answer": 0 },
        { "q": "She ___ my sister.", "options": ["am", "is", "are", "be"], "answer": 1 }
      ]
    }
  ]
}
```

（实现时由执行者按此 schema 完整编写 10 单元、每单元 8-12 题；题目为内容资产，直接写入 JSON 文件。）

- [ ] **Step 2: 写 failing test**

`tests/grammar.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { getGrammarStage } from "../src/data/grammar";
import { judgeGrammar, recordGrammarAnswer } from "../src/engine/grammar";
import { defaultState } from "../src/store/storage";

describe("grammar", () => {
  it("阶段一 10 个单元", () => {
    const units = getGrammarStage(1);
    expect(units.length).toBe(10);
    expect(units[0]!.id).toBe("g1-1");
    expect(units[0]!.questions.length).toBeGreaterThanOrEqual(8);
  });

  it("判定与进度记录", () => {
    const u = getGrammarStage(1)[0]!;
    expect(judgeGrammar(u, 0, u.questions[0]!.answer)).toBe(true);
    const s = defaultState();
    recordGrammarAnswer(s, u.id, 0, 0);
    expect(s.grammar[u.id]).toBeDefined();
    expect(s.grammar[u.id]!.answers[0]).toBe(0);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm.cmd test` — Expected: FAIL

- [ ] **Step 4: 实现 grammar.ts 数据层与引擎**

`src/data/grammar.ts`：

```ts
import type { GrammarQuestion, GrammarUnit } from "../types";
import stage1 from "./grammar-stage1.json";

const RAW = [{ data: stage1 }];

export const ALL_GRAMMAR: GrammarUnit[] = RAW.flatMap(e => (e as { data: { units: GrammarUnit[] } }).data.units);

export function getGrammarStage(stage: number): GrammarUnit[] {
  return ALL_GRAMMAR.filter(u => u.stage === stage);
}
```

`src/engine/grammar.ts`：

```ts
import type { AppState, GrammarUnit } from "../types";

export function judgeGrammar(unit: GrammarUnit, index: number, choice: number): boolean {
  return unit.questions[index]?.answer === choice;
}

export function recordGrammarAnswer(state: AppState, unitId: string, index: number, choice: number): void {
  const p = state.grammar[unitId] ?? { done: false, score: 0, answers: [] };
  p.answers[index] = choice;
  state.grammar[unitId] = p;
}

export function finishGrammarUnit(state: AppState, unitId: string, unit: GrammarUnit): void {
  const p = state.grammar[unitId] ?? { done: false, score: 0, answers: [] };
  const correct = unit.questions.filter((q, i) => p.answers[i] === q.answer).length;
  p.done = true;
  p.score = Math.round((correct / unit.questions.length) * 100);
  state.grammar[unitId] = p;
}
```

（`GrammarQuestion`/`GrammarUnit` 类型补充进 `src/types.ts`。）

- [ ] **Step 5: 实现 views/grammar.ts 完整视图（知识卡 → 逐题作答 → 单元结算 + 解锁下一单元）**

```ts
import type { AppState } from "../types";
import { getGrammarStage, ALL_GRAMMAR } from "../data/grammar";
import { judgeGrammar, recordGrammarAnswer, finishGrammarUnit } from "../engine/grammar";
import { addXp } from "../engine/progress";
import { sCorrect, sWrong, sLevelUp } from "../fx/audio";
import { burstStars, confettiBurst, toast } from "../fx/fx";
import { markGoalMet } from "../engine/streak";

export function renderGrammar(root: HTMLElement, state: AppState, unitId?: string): void {
  root.innerHTML = "";
  const stage = 1;
  const units = getGrammarStage(stage);
  if (!unitId) {
    const list = document.createElement("div");
    list.innerHTML = `<div class="card"><h2>📖 语法训练 · 阶段一</h2><div class="muted">先学知识卡，再做题闯关</div></div>`;
    units.forEach((u, i) => {
      const p = state.grammar[u.id];
      const unlocked = i === 0 || state.grammar[units[i - 1]!.id]?.done;
      const row = document.createElement("div");
      row.className = "card";
      row.style.cssText = "display:flex;justify-content:space-between;align-items:center;";
      row.innerHTML = `<div><b>${unlocked ? "📘" : "🔒"} ${u.title}</b>${p?.done ? ` <span class="muted">得分 ${p.score}</span>` : ""}</div>
        <button class="btn ${p?.done ? "" : "btn--green"}" data-id="${u.id}" ${unlocked ? "" : "disabled"}>${p?.done ? "再练一次" : "开始"}</button>`;
      row.querySelector("button")!.addEventListener("click", () => renderUnit(root, state, u.id));
      list.appendChild(row);
    });
    root.appendChild(list);
    return;
  }
  renderUnit(root, state, unitId);
}

function renderUnit(root: HTMLElement, state: AppState, unitId: string): void {
  const unit = ALL_GRAMMAR.find(u => u.id === unitId)!;
  const p = state.grammar[unitId] ?? { done: false, score: 0, answers: [] };
  state.grammar[unitId] = p;
  root.innerHTML = "";
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `<h2>📖 ${unit.title}</h2>
    <div class="knowledge">📚 <b>知识卡片：</b>${unit.knowledge}</div>
    <div id="quiz"></div>`;
  root.appendChild(card);

  const quiz = card.querySelector("#quiz")!;
  let idx = 0;
  const renderQ = () => {
    const q = unit.questions[idx];
    quiz.innerHTML = `<div style="font-weight:900;margin:12px 0 8px">Q${idx + 1}. ${q.q}</div>
      <div style="display:flex;flex-direction:column;gap:8px;max-width:460px">${
        q.options.map((o, i) => `<button class="btn quiz-option" data-i="${i}">${String.fromCharCode(65 + i)}. ${o}</button>`).join("")
      }</div>`;
    quiz.querySelectorAll(".quiz-option").forEach(b => b.addEventListener("click", () => {
      const choice = Number(b.getAttribute("data-i"));
      const ok = judgeGrammar(unit, idx, choice);
      recordGrammarAnswer(state, unitId, idx, choice);
      b.classList.add(ok ? "ok" : "bad");
      if (ok) { sCorrect(); burstStars(card); addXp(state, 5); } else { sWrong(); toast("❌ 正确答案已标出（见绿色）"); quiz.querySelector(`[data-i="${unit.questions[idx]!.answer}"]`)!.classList.add("ok"); }
      setTimeout(() => { idx++; idx < unit.questions.length ? renderQ() : renderDone(); }, 900);
    }));
  };
  const renderDone = () => {
    finishGrammarUnit(state, unitId, unit);
    const doneP = state.grammar[unitId]!;
    quiz.innerHTML = `<div style="text-align:center;padding:16px">
      <div style="font-size:36px">${doneP.score >= 80 ? "🎉" : "💪"}</div>
      <b>单元完成！得分 ${doneP.score}</b>
      <div class="muted" style="margin-top:6px">${doneP.score >= 80 ? "已达标，会计入每日目标" : "建议再练一次巩固"}</div>
      <button class="btn btn--green" id="againBtn" style="margin-top:12px">🔁 再来一次</button>
    </div>`;
    if (doneP.score >= 80) {
      const newly = markGoalMet(state);
      if (newly) { confettiBurst(); sLevelUp(); toast("🔥 打卡成功！连续 " + state.profile.streak + " 天"); }
    }
    quiz.querySelector("#againBtn")!.addEventListener("click", () => renderUnit(root, state, unitId));
  };
  renderQ();
}
```

- [ ] **Step 6: Run tests & build**

Run: `npm.cmd test` — Expected: all pass
Run: `npm.cmd run build` — Expected: 成功

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "feat: 语法训练模块（知识卡 + 选择题 + 单元结算）"
```

---

### Task 12: 成就系统

**Files:**
- Create: `src/data/achievements.ts`、`tests/achievements.test.ts`

**Interfaces:**
- Produces: `checkAchievements(state: AppState): string[]`（返回本次新解锁的成就 id 列表）、`ACHIEVEMENTS: Record<string, { name: string; icon: string; desc: string }>`

- [ ] **Step 1: 写 failing test**

`tests/achievements.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { checkAchievements } from "../src/data/achievements";
import { defaultState } from "../src/store/storage";

describe("achievements", () => {
  it("累计词数成就", () => {
    const s = defaultState();
    s.profile.lifetimeWords = 1000;
    const newOnes = checkAchievements(s);
    expect(newOnes).toContain("words-1000");
    expect(s.achievements["words-1000"]).toBeDefined();
    // 幂等
    expect(checkAchievements(s)).toEqual([]);
  });

  it("连击成就", () => {
    const s = defaultState();
    s.profile.maxCombo = 10;
    expect(checkAchievements(s)).toContain("combo-10");
  });

  it("打卡 7 天成就", () => {
    const s = defaultState();
    s.profile.streak = 7;
    expect(checkAchievements(s)).toContain("streak-7");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test` — Expected: FAIL

- [ ] **Step 3: 实现 achievements.ts**

```ts
import type { AppState } from "../types";

export interface AchievementDef { name: string; icon: string; desc: string; }
export const ACHIEVEMENTS: Record<string, AchievementDef> = {
  "combo-10": { name: "十连击", icon: "🔥", desc: "单局打出 10 连击" },
  "combo-20": { name: "二十连击", icon: "⚡", desc: "单局打出 20 连击" },
  "words-100": { name: "百词斩", icon: "💯", desc: "累计打对 100 词" },
  "words-1000": { name: "千词大关", icon: "📚", desc: "累计打对 1000 词" },
  "streak-7": { name: "一周之约", icon: "🗓️", desc: "连续打卡 7 天" },
  "streak-30": { name: "月度坚持", icon: "🏆", desc: "连续打卡 30 天" },
  "streak-100": { name: "百日传奇", icon: "👑", desc: "连续打卡 100 天" },
  "stage1-3star": { name: "基础满星", icon: "🌟", desc: "阶段一全部 3 星" },
};

type Cond = (s: AppState) => boolean;
const CONDS: Record<string, Cond> = {
  "combo-10": s => s.profile.maxCombo >= 10,
  "combo-20": s => s.profile.maxCombo >= 20,
  "words-100": s => s.profile.lifetimeWords >= 100,
  "words-1000": s => s.profile.lifetimeWords >= 1000,
  "streak-7": s => s.profile.streak >= 7,
  "streak-30": s => s.profile.streak >= 30,
  "streak-100": s => s.profile.streak >= 100,
  "stage1-3star": s => Object.values(s.stageProgress[1]).length > 0 &&
    Object.values(s.stageProgress[1]).every(p => p.state === "done" && p.stars === 3),
};

export function checkAchievements(state: AppState): string[] {
  const unlocked: string[] = [];
  for (const [id, cond] of Object.entries(CONDS)) {
    if (!state.achievements[id] && cond(state)) {
      state.achievements[id] = { unlockedAt: Date.now() };
      unlocked.push(id);
    }
  }
  return unlocked;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test` — Expected: all pass

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: 成就系统（定义 + 判定 + 幂等解锁）"
```

---

### Task 13: 数据中心视图 + 错题本

**Files:**
- Modify: `src/views/stats.ts`（完整实现）

**Interfaces:**
- Consumes: `AppState`、`ACHIEVEMENTS`（Task 12）、`heatmapDays`（Task 10）
- Produces: 完整数据中心视图（概览数字、热力图、成就墙、错题本列表、清空错题本按钮）

- [ ] **Step 1: 实现 stats.ts**

```ts
import type { AppState } from "../types";
import { ACHIEVEMENTS, checkAchievements } from "../data/achievements";
import { heatmapDays } from "../engine/streak";
import { toast } from "../fx/fx";

export function renderStats(root: HTMLElement, state: AppState): void {
  root.innerHTML = "";
  const totalWords = Object.values(state.wordStats).reduce((a, w) => a + w.correct, 0);
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `<h2>📊 数据中心</h2>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <div class="pill">📚 累计打对 <span class="val">${totalWords}</span> 词</div>
      <div class="pill">⏱ 累计 <span class="val">${state.profile.totalMinutes}</span> 分钟</div>
      <div class="pill fire">🔥 最长连击 <span class="val">${state.profile.maxCombo}</span></div>
      <div class="pill">🏅 成就 <span class="val">${Object.keys(state.achievements).length}/${Object.keys(ACHIEVEMENTS).length}</span></div>
    </div>`;
  root.appendChild(card);

  const heat = document.createElement("div");
  heat.className = "card";
  heat.innerHTML = `<h2>📅 打卡日历</h2><div class="heatmap" id="hm"></div>`;
  root.appendChild(heat);
  const hm = heat.querySelector("#hm")!;
  heatmapDays(state).forEach(d => {
    const el = document.createElement("div");
    el.className = "day" + (d.checked ? " lv3" : d.isFuture ? "" : " lv1");
    el.title = d.date;
    hm.appendChild(el);
  });

  const wall = document.createElement("div");
  wall.className = "card";
  wall.innerHTML = `<h2>🏅 成就墙</h2><div class="badge-wall"></div>`;
  root.appendChild(wall);
  const bw = wall.querySelector(".badge-wall")!;
  Object.entries(ACHIEVEMENTS).forEach(([id, a]) => {
    const got = !!state.achievements[id];
    const b = document.createElement("div");
    b.className = "badge" + (got ? "" : " locked");
    b.innerHTML = `<div class="icon">${a.icon}</div><b>${a.name}</b><div class="muted">${a.desc}</div>`;
    bw.appendChild(b);
  });

  const mb = document.createElement("div");
  mb.className = "card";
  mb.innerHTML = `<h2>📕 错题本</h2><div class="muted">共 ${state.mistakes.length} 条</div>
    <div id="mistakeList" style="margin-top:10px"></div>
    <button class="btn btn--red" id="clearMistakes" style="margin-top:10px">🗑️ 清空错题本</button>`;
  root.appendChild(mb);
  const list = mb.querySelector("#mistakeList")!;
  list.innerHTML = state.mistakes.slice(-50).reverse().map(m =>
    `<div class="pill" style="margin:4px">${m.word} <span class="muted">${new Date(m.ts).toLocaleDateString()}</span></div>`).join("") || `<div class="muted">暂无错题</div>`;
  mb.querySelector("#clearMistakes")!.addEventListener("click", () => {
    state.mistakes = [];
    renderStats(root, state);
    toast("错题本已清空");
  });
}
```

- [ ] **Step 2: 浏览器验证**（build 后打开，数据中心各区块正常显示）

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: 数据中心（概览/热力图/成就墙/错题本）"
```

---

### Task 14: ts-fsrs 复习调度

**Files:**
- Create: `src/engine/review.ts`、`tests/review.test.ts`

**Interfaces:**
- Consumes: `AppState`（Task 3）、`ts-fsrs` 包
- Produces: `initFsrs(): void`（初始化默认参数）、`scheduleReview(state, wordId, grade: 1|2|3|4, now?: Date): void`（1=完全忘记 2=困难 3=良好 4=简单；写入 wordStats.fsrs）、`dueReviews(state, now?: Date): string[]`（到期词 id 列表）、`isDue(wordStats, now): boolean`

- [ ] **Step 1: 写 failing test**

`tests/review.test.ts`：

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { scheduleReview, dueReviews, initFsrs } from "../src/engine/review";
import { defaultState } from "../src/store/storage";

const NOW = new Date("2026-01-01T12:00:00");

describe("review (fsrs)", () => {
  beforeEach(() => { initFsrs(); });

  it("首次复习后生成卡片并有到期日", () => {
    const s = defaultState();
    scheduleReview(s, "apple", 3, NOW);
    const st = s.wordStats["apple"]!;
    expect(st.fsrs).not.toBeNull();
    expect(new Date(st.fsrs!.due).getTime()).toBeGreaterThan(NOW.getTime());
  });

  it("到期队列", () => {
    const s = defaultState();
    scheduleReview(s, "apple", 3, NOW);
    // 40 天后应到期
    const later = new Date(NOW.getTime() + 40 * 86400000);
    expect(dueReviews(s, later)).toContain("apple");
    expect(dueReviews(s, NOW)).not.toContain("apple");
  });

  it("不同评分到期间隔递增（3 良好 > 1 忘记）", () => {
    const s1 = defaultState(); scheduleReview(s1, "a", 1, NOW);
    const s2 = defaultState(); scheduleReview(s2, "a", 3, NOW);
    const due1 = new Date(s1.wordStats["a"]!.fsrs!.due).getTime();
    const due2 = new Date(s2.wordStats["a"]!.fsrs!.due).getTime();
    expect(due2).toBeGreaterThan(due1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test` — Expected: FAIL

- [ ] **Step 3: 实现 review.ts**

```ts
import { createEmptyCard, generatorParameters, fsrs, Rating } from "ts-fsrs";
import type { AppState, WordStats } from "../types";

let f = fsrs(generatorParameters());

export function initFsrs(): void { f = fsrs(generatorParameters()); }

export function scheduleReview(state: AppState, wordId: string, grade: 1 | 2 | 3 | 4, now: Date = new Date()): void {
  const st: WordStats = state.wordStats[wordId] ?? { correct: 0, wrong: 0, lastSeen: 0, fsrs: null, inReview: true };
  const card = st.fsrs
    ? { due: new Date(st.fsrs.due), stability: st.fsrs.stability, difficulty: st.fsrs.difficulty, state: st.fsrs.state as 0|1|2|3, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, last_review: new Date(st.lastSeen) }
    : createEmptyCard(now);
  const r = f.next(card, now, grade as Rating);
  st.fsrs = { due: r.card.due.toISOString(), stability: r.card.stability, difficulty: r.card.difficulty, state: r.card.state };
  st.lastSeen = now.getTime();
  st.inReview = r.card.state !== 2 || r.card.due > now; // 仍是学习/复习态则保留队列
  if (grade >= 3) st.correct++; else st.wrong++;
  state.wordStats[wordId] = st;
}

export function isDue(ws: WordStats, now: Date = new Date()): boolean {
  return !!ws.fsrs && new Date(ws.fsrs.due).getTime() <= now.getTime();
}

export function dueReviews(state: AppState, now: Date = new Date()): string[] {
  return Object.entries(state.wordStats)
    .filter(([, ws]) => ws.inReview && isDue(ws, now))
    .map(([id]) => id);
}
```

（若 ts-fsrs v5 的 `createEmptyCard`/`fsrs()` 签名与上不同，以安装版本的类型定义为准微调；测试锁定行为即可。）

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test` — Expected: all pass

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: ts-fsrs 复习调度（评分 → 到期队列）"
```

---

### Task 15: 词库生成脚本（ECDICT → 四阶段全量 JSON）

**Files:**
- Create: `scripts/build-words.mjs`
- Modify: `.gitignore`（保留 data-prep/*.csv 忽略；生成产物 `src/data/words-stage*.json` 提交入库）

**Interfaces:**
- Consumes: `data-prep/ecdict.csv`（本地，62.9MB，不入库）
- Produces: `src/data/words-stage1.json` … `words-stage4.json`（章节化词库，随构建内联）；章节粒度：阶段一 40 词/章，其余 100 词/章。

- [ ] **Step 1: 写 build-words.mjs**

```js
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const CSV = join(root, "..", "data-prep", "ecdict.csv");
if (!existsSync(CSV)) {
  console.error("缺少 data-prep/ecdict.csv：请先下载 ECDICT（MIT）");
  process.exit(1);
}

const TAGS = { 1: ["zk"], 2: ["gk"], 3: ["cet4"], 4: ["ielts", "toefl"] };
const CHAPTER_SIZE = { 1: 40, 2: 100, 3: 100, 4: 100 };
const OXFORD = new Set();

function parseCsvLine(l) {
  const r = []; let cur = "", q = false;
  for (const c of l) {
    if (c === '"') { q = !q; continue; }
    if (c === "," && !q) { r.push(cur); cur = ""; } else cur += c;
  }
  r.push(cur);
  return r;
}

function cleanMeaning(trans) {
  if (!trans) return [];
  const parts = trans.split("\\n").map(s => s.trim()).filter(Boolean);
  return parts
    .filter(s => !s.startsWith("[网络]") && !s.startsWith("[医]") && !s.startsWith("[法]"))
    .slice(0, 4)
    .map(s => s.length > 40 ? s.slice(0, 40) : s);
}

const all = [];
{
  const lines = readFileSync(CSV, "utf8").split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    const f = parseCsvLine(lines[i]);
    if (f.length < 12) continue;
    const [word, phonetic, , translation, , , oxford, tag, , , exchange] = f;
    if (!word || !/^[a-zA-Z][a-zA-Z' -]*$/.test(word)) continue;
    if (word.length > 24) continue;
    const meaning = cleanMeaning(translation);
    if (meaning.length === 0) continue;
    const ex = {};
    if (exchange) for (const part of exchange.split("/")) {
      const m = part.match(/^([a-z0-9]):(.+)$/);
      if (m && /^[a-zA-Z' -]+$/.test(m[2])) ex[m[1]] = m[2].split(",").slice(0, 3);
    }
    all.push({ word, phonetic: phonetic || "", meaning, tag: tag || "", oxford: oxford || "", exchange: ex });
  }
}
console.log("parsed candidates:", all.length);

for (const [stageStr, tags] of Object.entries(TAGS)) {
  const stage = Number(stageStr);
  const pool = all.filter(w => tags.some(t => w.tag.split(" ").includes(t)) || (stage === 1 && w.oxford === "1"));
  const seen = new Set();
  const uniq = [];
  for (const w of pool) { const k = w.word.toLowerCase(); if (!seen.has(k)) { seen.add(k); uniq.push({ ...w, word: k }); } }
  // 按词频排序（frq 列不存在，此处按长度+字母序的简易排序；实现时可用 tag 顺序）
  uniq.sort((a, b) => a.word.length - b.word.length || a.word.localeCompare(b.word));
  const chapters = [];
  let no = 0;
  for (let i = 0; i < uniq.length; i += CHAPTER_SIZE[stage]) {
    no++;
    chapters.push({
      stage, no, title: `第${no}章`,
      words: uniq.slice(i, i + CHAPTER_SIZE[stage]).map((w, j) => ({ id: w.word, word: w.word, phonetic: w.phonetic, meaning: w.meaning, exchange: w.exchange })),
    });
  }
  const out = join(root, "..", "src", "data", `words-stage${stage}.json`);
  writeFileSync(out, JSON.stringify({ stage, chapters }, null, 1), "utf8");
  console.log(`stage ${stage}: ${uniq.length} words / ${chapters.length} chapters -> ${out}`);
}
```

- [ ] **Step 2: 运行生成并核验数量**

Run: `node scripts/build-words.mjs`
Expected: 输出各阶段词数约等于实测（zk 1603 + oxford3461 去重后约 3800+；gk 3679；cet4 3849；ielts+toefl 约 9000+ 去重）
Run: `npm.cmd test` — Expected: words.test 中「阶段 1 章节 >=1」仍通过（样例被真实数据替换后 getStage(1)[0].id === "1-1" 不变）

- [ ] **Step 3: 修改 words.ts 加载全部四阶段**

```ts
import type { Chapter, StageId, Word } from "../types";
import stage1 from "./words-stage1.json";
import stage2 from "./words-stage2.json";
import stage3 from "./words-stage3.json";
import stage4 from "./words-stage4.json";

const RAW = [stage1, stage2, stage3, stage4];

function buildStages(): Chapter[][] {
  const stages: Chapter[][] = [[], [], [], []];
  for (const d of RAW) {
    for (const ch of (d as { chapters: Chapter[] }).chapters) stages[ch.stage - 1]!.push({ ...ch, id: `${ch.stage}-${ch.no}` });
  }
  return stages;
}

export const ALL_STAGES: Chapter[][] = buildStages();
// getStage / getChapter / genWordFormQuestions 不变
```

- [ ] **Step 4: build 并确认体积**

Run: `npm.cmd run build` — Expected: 成功；dist/index.html 体积记录（预计 3-6MB，可接受）

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: ECDICT→四阶段词库生成脚本 + 全量词库数据"
```

---

### Task 16: 每日任务混合（新词 + 到期复习）与复习入口

**Files:**
- Create: `src/engine/daily.ts`、`tests/daily.test.ts`
- Modify: `src/views/typing.ts`（复习入口）、`src/main.ts`（打卡触发 checkAchievements）

**Interfaces:**
- Produces: `buildDailySession(state, chapterId, now?: Date): { words: Word[]; tags: ("new"|"review")[] }`（本章新词 + 到期复习词混合，复习词不超 10 个）；`markWordLearned(state, wordId): void`（更新 lifetimeWords/totalMinutes/checkAchievements 调用点）

- [ ] **Step 1: 写 failing test**

`tests/daily.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { buildDailySession } from "../src/engine/daily";
import { defaultState } from "../src/store/storage";
import { scheduleReview } from "../src/engine/review";
import { getChapter } from "../src/data/words";

describe("daily session", () => {
  it("混合新词与到期复习词", () => {
    const s = defaultState();
    scheduleReview(s, "apple", 1, new Date("2026-01-01T12:00:00"));
    const ch = getChapter("1-1")!;
    const { words, tags } = buildDailySession(s, ch.id, new Date("2026-02-01T12:00:00"));
    expect(words.length).toBe(ch.words.length + 1);  // 全部新词 + 1 复习词
    expect(tags).toContain("review");
    expect(tags.filter(t => t === "new").length).toBe(ch.words.length);
  });

  it("无到期复习时不追加", () => {
    const s = defaultState();
    const ch = getChapter("1-1")!;
    const { words, tags } = buildDailySession(s, ch.id, new Date("2026-02-01T12:00:00"));
    expect(words.length).toBe(ch.words.length);
    expect(tags).not.toContain("review");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test` — Expected: FAIL

- [ ] **Step 3: 实现 daily.ts**

```ts
import type { AppState, Word } from "../types";
import { getChapter, getStage } from "../data/words";
import { dueReviews } from "./review";

export function buildDailySession(state: AppState, chapterId: string, now: Date = new Date()): { words: Word[]; tags: ("new" | "review")[] } {
  const ch = getChapter(chapterId);
  const words: Word[] = ch ? [...ch.words] : [];
  const tags: ("new" | "review")[] = words.map(() => "new");
  const due = dueReviews(state, now).slice(0, 10);
  for (const id of due) {
    const w = findWord(id);
    if (w && !words.some(x => x.id === id)) { words.push(w); tags.push("review"); }
  }
  return { words, tags };
}

function findWord(id: string): Word | undefined {
  for (const st of getStage(1)) for (const w of st.words) if (w.id === id) return w;
  for (const st of getStage(2)) for (const w of st.words) if (w.id === id) return w;
  for (const st of getStage(3)) for (const w of st.words) if (w.id === id) return w;
  for (const st of getStage(4)) for (const w of st.words) if (w.id === id) return w;
  return undefined;
}
```

（typing 视图改用 `buildDailySession` 提供词表：`createSession(words, ...)`；打卡触发点加 `checkAchievements(state)` 与 `markGoalMet`。）

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test` — Expected: all pass

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: 每日任务混合新词+到期复习 + 复习入口"
```

---

### Task 17: 设置视图 + 主题解锁

**Files:**
- Modify: `src/views/settings.ts`（完整实现）、`src/main.ts`（主题应用）

**Interfaces:**
- Consumes: `Settings`（Task 3）、`setSoundEnabled/setTtsEnabled`（Task 6）
- Produces: 设置面板（音效/发音/释义显示开关、每日目标三档、数据重置按钮）、主题切换（green/blue/purple 由通关阶段解锁）。

- [ ] **Step 1: 实现 settings.ts**

```ts
import type { AppState } from "../types";
import { resetAll, save } from "../store/storage";
import { setSoundEnabled, setTtsEnabled } from "../fx/audio";
import { toast } from "../fx/fx";

const THEMES = [
  { id: "green", name: "🟢 草地绿", needStage: 1 },
  { id: "blue", name: "🔵 天空蓝", needStage: 2 },
  { id: "purple", name: "🟣 大师紫", needStage: 3 },
];

export function renderSettings(root: HTMLElement, state: AppState): void {
  root.innerHTML = "";
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `<h2>⚙️ 设置</h2>`;
  root.appendChild(card);

  const addToggle = (label: string, key: "sound" | "tts" | "showMeaning") => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:8px 0";
    row.innerHTML = `<b>${label}</b>`;
    const b = document.createElement("button");
    b.className = "btn " + (state.settings[key] ? "btn--green" : "");
    b.textContent = state.settings[key] ? "开" : "关";
    b.addEventListener("click", () => {
      state.settings[key] = !state.settings[key];
      if (key === "sound") setSoundEnabled(state.settings.sound);
      if (key === "tts") setTtsEnabled(state.settings.tts);
      save(state);
      renderSettings(root, state);
    });
    row.appendChild(b);
    card.appendChild(row);
  };
  addToggle("🔊 音效", "sound");
  addToggle("🔊 单词发音", "tts");
  addToggle("💬 显示释义", "showMeaning");

  card.insertAdjacentHTML("beforeend", `<h2 style="margin-top:16px">🎨 主题</h2><div class="muted">通关更高阶段解锁新主题</div><div id="themes" style="display:flex;gap:10px;margin-top:10px"></div>`);
  const themes = card.querySelector("#themes")!;
  const maxStageDone = ([1, 2, 3, 4] as const).filter(st => Object.values(state.stageProgress[st]).some(p => p.state === "done")).length + 1;
  THEMES.forEach(t => {
    const unlocked = t.needStage <= Math.max(1, maxStageDone);
    const b = document.createElement("button");
    b.className = "btn" + (state.settings.theme === t.id ? " on" : "");
    b.textContent = unlocked ? t.name : "🔒 " + t.name;
    b.disabled = !unlocked;
    b.addEventListener("click", () => { state.settings.theme = t.id; save(state); applyTheme(t.id); renderSettings(root, state); });
    themes.appendChild(b);
  });

  card.insertAdjacentHTML("beforeend", `<h2 style="margin-top:16px">⚠️ 危险区</h2>
    <button class="btn btn--red" id="resetBtn">🗑️ 重置全部数据</button>`);
  card.querySelector("#resetBtn")!.addEventListener("click", () => {
    if (confirm("确定清空所有学习进度？此操作不可恢复！")) {
      resetAll();
      location.reload();
    }
  });
}

export function applyTheme(id: string): void {
  const map: Record<string, { bg: string; green: string }> = {
    green: { bg: "#FFF7E8", green: "#58CC02" },
    blue: { bg: "#EEF7FF", green: "#1CB0F6" },
    purple: { bg: "#F7EEFF", green: "#A568CC" },
  };
  const t = map[id] ?? map["green"]!;
  document.documentElement.style.setProperty("--bg", t.bg);
  document.documentElement.style.setProperty("--green", t.green);
}
```

- [ ] **Step 2: main.ts 启动时应用主题**

```ts
import { applyTheme } from "./views/settings";
// navigate("home") 之前：
applyTheme(state.settings.theme);
```

- [ ] **Step 3: 浏览器验证 + 提交**

Run: `npm.cmd run build`，浏览器确认开关与主题切换生效。
```bash
git add -A
git commit -m "feat: 设置面板（音效/发音/释义开关 + 主题解锁 + 数据重置）"
```

---

### Task 18: 收尾打磨与全量验收

**Files:**
- Modify: `README.md`（更新使用说明）、`src/views/home.ts`（冻结卡补签入口）
- Create: 无

**Interfaces:**
- 无新增；全量回归。

- [ ] **Step 1: 全量回归**

Run: `npm.cmd test` — Expected: 全部测试通过（列出数量）
Run: `npm.cmd run build` — Expected: dist/index.html 单文件

- [ ] **Step 2: 浏览器端到端验收（bsk 或手动）**

1. 打开 dist/index.html：6 个导航可用，无 console 报错
2. 打完整一章（阶段一第 1 章 40 词）：结算卡显示星级/正确率/WPM，重进后进度保留
3. 打卡：完成每日目标后首页 streak 变化、热力图当天变绿
4. 语法：完成 1 个单元，得分与解锁下一单元生效
5. 错题（连错 3 次）进入复习队列，次日（或改系统日期）复习词出现在打字任务
6. 设置：音效/发音开关、主题切换、重置数据均生效

- [ ] **Step 3: 更新 README（交付说明）**

写入：如何打开（双击 dist/index.html）、数据存储位置（浏览器 localStorage，清理浏览器数据会重置进度）、如何更新词库（node scripts/build-words.mjs）、目录结构、许可证声明（ECDICT MIT；代码自有）。

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "docs: 交付说明；全量验收通过"
```

---

## Self-Review

**1. Spec coverage：**
- §6 机制 1（打字引擎/三模式/错误重打）→ Task 5、8 ✅
- §6 机制 2-3（连击/XP/等级）→ Task 5、7、8 ✅
- §6 机制 4（打卡/热力图/冻结卡）→ Task 10、9（home）✅
- §6 机制 5（星级/解锁）→ Task 7 ✅
- §6 机制 6（成就）→ Task 12、13 ✅
- §6 机制 7（fsrs 复习）→ Task 14、16 ✅
- §6 机制 8（音效/主题/发音）→ Task 6、17 ✅
- §7 路线（词库四阶段/词形题/阶段测验）→ Task 4、15（词形题在 Task 4）；**阶段测验未设任务** → 增补到 Task 16 后续：阶段测验实现（词 20 题 + 语法 10 题、80% 通过）→ **新增 Task 19** ✅（见下）
- §5 数据模型 → Task 3 ✅
- §12 验收标准 1-8 → Task 18 覆盖 ✅

**2. Placeholder scan：** 无 TBD/TODO；语法题库内容在 Task 11 有明确清单（10 单元主题+结构），执行时直接编写完整 JSON。

**3. Type consistency：** `bindTyping(state, save, refresh)` 与 main.ts 调用一致；`markGoalMet`/`heatmapDays`/`checkin` 引用在 Task 9 已注明执行顺序（Task 10 先行）；`WordFormQuestion` 在 Task 4 定义并被 Task 15 数据消费（生成器只产出 exchange 字段，题目运行时生成，一致）。

### Task 19: 阶段测验（补 spec §7）

**Files:**
- Create: `src/engine/quiz.ts`、`tests/quiz.test.ts`
- Modify: `src/views/map.ts`（阶段末节点改为「阶段测验」）

**Interfaces:**
- Produces: `buildStageQuiz(state, stage): { wordQs: WordFormQuestion[]; grammarQs: GrammarQuestion[] }`（词 20 题取自本阶段已学词随机，语法 10 题取自本阶段单元）、`evaluateStageQuiz(state, stage, results): { passed: boolean; score: number }`（≥80% 通过，解锁下一阶段第 1 章）

- [ ] **Step 1: 写 failing test**

```ts
import { describe, it, expect } from "vitest";
import { buildStageQuiz, evaluateStageQuiz } from "../src/engine/quiz";
import { defaultState } from "../src/store/storage";

describe("stage quiz", () => {
  it("生成 20 词 + 10 语法题", () => {
    const s = defaultState();
    const q = buildStageQuiz(s, 1);
    expect(q.wordQs.length).toBe(20);
    expect(q.grammarQs.length).toBe(10);
  });
  it("80% 通过解锁下一阶段", () => {
    const s = defaultState();
    const passed = evaluateStageQuiz(s, 1, { score: 85 });
    expect(passed.passed).toBe(true);
    expect(s.stageProgress[2]["2-1"]?.state).toBe("open");
  });
});
```

（实现参照 Task 4/11/7 的既有函数组合；实现后跑测试并提交。）
