# 英语闯关岛 v2（词源版）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans 逐任务实施（本会话内连续执行，用户已选此方式）。步骤用 `- [ ]` 跟踪。
> 前置规格：[2026-10-06-english-quest-v2-etymology-design.md](../specs/2026-10-06-english-quest-v2-etymology-design.md)

**Goal:** 把 v1 打字背单词版改造为「词源（前缀/词根/后缀）拆解背单词 + 详细语法（英语思维）+ YouTube 视频课 + 全解锁板块」的学习网站。

**Architecture:** 沿用 v1 的 Vite+TS 单文件构建、localStorage 存储层、打卡/XP/成就/统计、ts-fsrs 复习。删除打字引擎与其视图/测试；新增「词根家族库 + 三层助记 + 主题词包 + 自测 + 视频课」模块；导航改为八板块且全部解锁。

**Tech Stack:** Vite 8 + TS 5.9（strict, noUncheckedIndexedAccess）+ Vitest 5（jsdom）+ ts-fsrs 5 + vite-plugin-singlefile。运行命令统一 `npm.cmd test` / `npm.cmd run build` / `npx.cmd tsc --noEmit`。

## Global Constraints

- 产物必须是**单个 dist/index.html**；除视频播放外零外部请求。
- **全部内容无锁定**：不得出现 locked 状态判断或「未解锁」提示。
- 三层助记必须**视觉可区分**并如实标注：`etymology`（词源，ECDICT 校订）、`construction`（构词，前缀/后缀+完整常用词）、`mnemonic`（AI 助记）。
- **禁止宽松规则拆解**：构词层要求词干是 ECDICT 中 `frq >= 2000` 的完整常用单词，且前缀/后缀长度 ≥ 2、词干长度 ≥ 3。
- 内置 YouTube 视频**必须经 oEmbed 核验**（HTTP 200）才可写入清单。
- 词源数据仅来自 ECDICT（MIT）；不得引入 GPL/AGPL 数据。
- 删除打字相关：`engine/typing.ts`、`views/typing.ts`、`engine/quiz.ts`（阶段测验门禁）、`views/quiz.ts`、`tests/typing.test.ts`、`tests/quiz.test.ts`，以及 app.test.ts 中的打字流程用例。
- 每个任务：先写失败测试 → 跑红 → 最小实现 → 跑绿 → 提交。UI 任务用 jsdom 集成测试或构建验证作为验收。

---

## 文件结构（改造后）

```
src/
├── types.ts                 # 类型：RootFamily/Mnemonic/Theme/Video/SelfTestQuestion + 沿用 v1 类型
├── main.ts                  # 八板块路由（全解锁）
├── store/storage.ts         # 沿用 + 新增字段迁移（rootStats/selfTest）
├── data/
│   ├── roots.ts             # 词根家族访问（families/按类型筛选/按词查家族）
│   ├── roots.json           # 611 家族（脚本生成 + 中文义人工校订）
│   ├── mnemonics.ts         # 三层助记查询
│   ├── mnemonics.json       # 生成产物
│   ├── wordbank.ts          # 主题词包 + 表达包访问
│   ├── wordbank-daily.json  # 18 主题 + 表达包
│   ├── words-stage1-3.json  # 初中/高中/四级（沿用生成器，去掉雅思托福）
│   ├── grammar.ts / grammar-*.json   # 重写：六段式语法单元
│   ├── videos.ts / videos.json       # 视频清单 + 用户自添加
│   └── achievements.ts      # 沿用 + 新增词源类成就
├── engine/
│   ├── roots.ts             # 家族与词的关联、覆盖率统计（纯逻辑）
│   ├── mnemonic.ts          # 三层判定（词源优先 → 构词规则 → 助记）（纯逻辑）
│   ├── selfTest.ts          # 四题型出题与判定（纯逻辑）
│   ├── review.ts            # 沿用 ts-fsrs
│   ├── progress.ts          # 沿用（星级改为掌握度）
│   └── streak.ts            # 沿用打卡
├── views/
│   ├── home.ts              # 学习面板（改造）
│   ├── wordbank.ts          # 单词板块（新增）
│   ├── roots.ts             # 词根词缀库（新增）
│   ├── grammar.ts           # 语法（重写六段式）
│   ├── videos.ts            # 视频课（新增）
│   ├── review.ts            # 复习（新增，选择题式）
│   ├── stats.ts / settings.ts  # 沿用适配
└── scripts/build-roots.mjs, scripts/verify-videos.mjs
```

## 关键接口契约

```ts
// data/roots.ts
export interface RootWordRef { id: string; word: string; phonetic: string; meaning: string[]; layer: "etymology"|"construction"|"mnemonic"; formula: string; }
export interface RootFamily { key: string; name: string; type: "root"|"prefix"|"suffix"; meaning: string; meaningZh: string; origin: string; words: RootWordRef[]; }
export function allFamilies(): RootFamily[];
export function familiesByType(t: RootFamily["type"]): RootFamily[];
export function familyOfWord(word: string): RootFamily[];
export function topFamilies(n: number): RootFamily[];   // 按对本阶段词表贡献度排序

// engine/mnemonic.ts
export interface Mnemonic { word: string; layer: "etymology"|"construction"|"mnemonic"; formula: string; note: string; }
export function buildMnemonic(word: string, ctx?: { familyKeys?: string[] }): Mnemonic;
export function mnemonicOf(word: string): Mnemonic | undefined;   // 查预生成表

// data/wordbank.ts
export interface Theme { id: string; title: string; icon: string; words: string[]; }
export interface Expression { zh: string; en: string; note: string; example: string; }
export function allThemes(): Theme[];
export function allExpressions(): Expression[];
export function bankWords(bank: "daily"|"zk"|"gk"|"cet4"): string[];

// engine/selfTest.ts
export type QuestionKind = "word2meaning"|"meaning2word"|"pickBreakdown"|"rootMeaning";
export interface SelfTestQuestion { kind: QuestionKind; prompt: string; options: string[]; answer: number; explain: string; wordId: string; }
export function buildQuestions(words: string[], kinds: QuestionKind[], n: number): SelfTestQuestion[];
export function judge(q: SelfTestQuestion, choice: number): boolean;

// data/videos.ts
export interface Video { id: string; title: string; channel: string; topics: string[]; note: string; custom?: boolean; }
export function builtinVideos(): Video[];
export function loadCustomVideos(): Video[];
export function addCustomVideo(url: string, title: string): Video | null;  // 解析 watch?v=/youtu.be/ 并写 localStorage
export function refreshVideoMeta(v: Video): Promise<Video>;                 // oEmbed 刷新标题（失败返回原值）
```

---

### Task 1: 架构改造——删除打字模块，导航改八板块（全解锁）

**Files:** Delete `src/engine/typing.ts`、`src/views/typing.ts`、`src/engine/quiz.ts`、`src/views/quiz.ts`、`tests/typing.test.ts`、`tests/quiz.test.ts`、`tests/daily.test.ts`、`src/engine/daily.ts`；Modify `src/main.ts`、`tests/app.test.ts`、`src/views/map.ts`（删除锁定判断）、`src/views/home.ts`（去打字入口）

- [ ] Step 1: 删除文件（git rm）
- [ ] Step 2: `src/main.ts` 导航改为：home 学习面板 / wordbank 单词板块 / roots 词根词缀库 / grammar 语法训练 / videos 视频课 / review 复习 / stats 数据 / settings 设置；移除 typing、quiz 路由与 bindTyping/attachTypingKeys/bindQuiz
- [ ] Step 3: `tests/app.test.ts` 删除打字流程用例，保留并调整导航/语法/数据/设置用例为 8 个导航
- [ ] Step 4: 跑测试与类型检查：`npm.cmd test`、`npx.cmd tsc --noEmit` 期望通过（此时新板块视图为占位）
- [ ] Step 5: 提交 `refactor: 移除打字模块，导航改为全解锁八板块`

### Task 2: 词根家族数据生成与访问层（TDD）

**Files:** Create `scripts/build-roots.mjs`、`src/data/roots.json`、`src/engine/mnemonic.ts`、`tests/mnemonic.test.ts`、`tests/roots.test.ts`

- [ ] Step 1: 写 `scripts/build-roots.mjs`：读 `data-prep/wordroot.txt` + `ecdict.csv`，输出 `src/data/roots.json`：
  - 归一化 key（去尾数字/连字符）、type、meaning、origin、examples
  - 与 ECDICT 词条 join（音标/释义），仅保留纯字母词
  - 每家族附 `meaningZh`（中文义，来自内置 611 条映射表，脚本内维护，缺失时回落英文）
  - 只保留 `words.length > 0` 的家族
- [ ] Step 2: 运行脚本，核对数字：家族数 ≈ 611、有词家族 ≈ 600、总词引用 ≈ 9,276
- [ ] Step 3: 写失败测试 `tests/roots.test.ts`：`allFamilies().length > 500`；`familiesByType("prefix")` 含 un-/re-；`familyOfWord("import")` 含 port 家族；每个家族 `words.length >= 1` 且词条有音标或释义
- [ ] Step 4: 实现 `src/data/roots.ts` 使测试通过
- [ ] Step 5: 写失败测试 `tests/mnemonic.test.ts`：
  - `buildMnemonic("unhappy")` → layer `construction`，formula 含 `un-` 与 `happy`
  - `buildMnemonic("advice")` → **不得**因为假规则而输出 construction（词干 `vice` 非完整常用词时回落 mnemonic 或 etymology）
  - `buildMnemonic("import")` → layer `etymology`（词源库命中）
  - `buildMnemonic("juice")` → layer `mnemonic`（无词源无构词）
- [ ] Step 6: 实现 `src/engine/mnemonic.ts`（词源优先 → 构词规则（词干 frq>=2000）→ 助记）
- [ ] Step 7: 跑绿 + 提交 `feat: 词根家族数据 + 三层助记判定引擎`

### Task 3: 词根词缀库视图（新增）

**Files:** Create `src/views/roots.ts`；Modify `src/main.ts`（路由接入）

- [ ] Step 1: 实现总览：611 家族卡片网格 + 类型筛选（全部/词根/前缀/后缀）+ 首字母筛选 + 「贡献度排序」
- [ ] Step 2: 实现家族页：含义（中文+英文）、来源语言徽章、全部同族词列表（单词/音标/释义/拆解标签）、近义反义家族
- [ ] Step 3: 双向链接：家族词点击 → 词详情弹层（三层助记 + 标记按钮）；词详情内显示所属家族 → 跳家族
- [ ] Step 4: app.test.ts 新增用例：进入词根词缀库看到家族卡片；点第一个家族看到同族词列表
- [ ] Step 5: 跑绿 + 提交 `feat: 词根词缀库（611 家族浏览 + 家族页 + 双向链接）`

### Task 4: 日常词包与表达包（数据 + 访问层，TDD）

**Files:** Create `src/data/wordbank-daily.json`、`src/data/wordbank.ts`、`tests/wordbank.test.ts`

- [ ] Step 1: 编写 18 个主题词包（每包 40-60 词）：家庭人物/食物饮品/购物/交通出行/身体健康/时间日期/天气/居家/工作职业/情绪感受/日常动作/衣物/学校学习/运动娱乐/医疗/旅行/性格描述/社交礼貌；词条从 ECDICT 高频词中选取（纯字母、有释义）
- [ ] Step 2: 编写生活表达包 ≥80 条（LetMeEnglish 式「XX 用英文怎么说」+ 例句）
- [ ] Step 3: 写失败测试：`allThemes().length === 18`；每主题 `words.length >= 40`；`allExpressions().length >= 80`；每条表达式含 zh/en/example；`bankWords("daily")` 去重后 > 700
- [ ] Step 4: 实现 `src/data/wordbank.ts`
- [ ] Step 5: 跑绿 + 提交 `feat: 日常词汇板块数据（18 主题词包 + 生活表达包）`

### Task 5: 单词板块视图（新增）

**Files:** Create `src/views/wordbank.ts`；Modify `src/main.ts`

- [ ] Step 1: 板块页：按 日常 → 初中 → 高中 → 四级 顺序的卡片（**无锁**）
- [ ] Step 2: 日常板块：主题词包网格 + 表达包列表（zh → en + 例句）
- [ ] Step 3: 词表页（初中/高中/四级）：分页或虚拟滚动（每页 50 词）；每行显示 单词/音标/释义/三层标签/状态标记
- [ ] Step 4: 词详情弹层：三层拆解 + 来源语言 + 同族词 + 「✅ 记住了 / 🔁 需复习」标记（写 wordStats）
- [ ] Step 5: app.test.ts 用例：进入单词板块 → 顺序正确 → 点日常某主题看到词表
- [ ] Step 6: 跑绿 + 提交 `feat: 单词板块视图（日常/初中/高中/四级，全解锁）`

### Task 6: 自测引擎（四题型，TDD）

**Files:** Create `src/engine/selfTest.ts`、`tests/selfTest.test.ts`

- [ ] Step 1: 写失败测试：
  - `buildQuestions([...], ["word2meaning"], 5)` → 5 题、每题 4 选项、answer 指向正确项
  - `meaning2word` 题干含中文释义、选项为英文单词
  - `pickBreakdown` 题干为单词、选项为拆解式（含 1 个正确 + 3 个错误），仅在词有 etymology/construction 时生成
  - `rootMeaning` 题干为词根、选项为含义
  - `judge(q, q.answer) === true`，`judge(q, 错误项) === false`
- [ ] Step 2: 实现（含干扰项生成：同词源家族其它词 / 同主题其它词，避免重复选项）
- [ ] Step 3: 跑绿 + 提交 `feat: 自测引擎（看词选义/看义选词/选拆解/选词根含义）`

### Task 7: 复习板块（自测 + FSRS 接入）

**Files:** Create `src/views/review.ts`、`src/engine/reviewQueue.ts`、`tests/reviewQueue.test.ts`；Modify `src/main.ts`

- [ ] Step 1: 写失败测试：`dueWords(state, now)` 返回到期词；`markRemembered(state, word)` / `markNeedReview(state, word)` 写入 wordStats 并调度 FSRS（记住=Good/3，需复习=Again/1）
- [ ] Step 2: 实现 `reviewQueue.ts` 并复用 `engine/review.ts`
- [ ] Step 3: 实现复习视图：队列 → 选择题作答 → 正误反馈 + XP → 下一题；空队列显示引导
- [ ] Step 4: 跑绿 + 提交 `feat: 复习板块（选择题式 FSRS 队列）`

### Task 8: 语法模块重写（六段式 + 12 单元，TDD）

**Files:** Create `src/data/grammar-v2/*.json`（12 单元）、Modify `src/data/grammar.ts`、`src/views/grammar.ts`、`tests/grammar.test.ts`

- [ ] Step 1: 定义 schema 并编写 12 单元内容（每单元：thinking 英语思维开篇、rules 规则表、examples 正误对照、mistakes 常见错误、questions ≥6 题带 explain、videos 关联 ID）
  单元：①英语句子骨架五大句型 ②be 动词与存在 ③名词与可数性 ④冠词 ⑤代词 ⑥一般现在时 ⑦进行时 ⑧过去时 ⑨完成时 ⑩将来表达 ⑪情态动词 ⑫介词
- [ ] Step 2: 改写测试：`getGrammarUnits().length === 12`；每单元六字段齐全且 `questions.length >= 6`；每单元至少 1 个 video 且 ID 在内置清单中
- [ ] Step 3: 重写 `src/views/grammar.ts`：单元选择（无锁）→ 六段式渲染（含视频卡内嵌播放）→ 练习作答与解析
- [ ] Step 4: 跑绿 + 提交 `feat: 语法模块重写（英语思维六段式 12 单元）`

### Task 9: 视频课模块（内置清单 + oEmbed 刷新 + 用户添加，TDD）

**Files:** Create `src/data/videos.json`、`src/data/videos.ts`、`src/views/videos.ts`、`scripts/verify-videos.mjs`、`tests/videos.test.ts`

- [ ] Step 1: 编写 `scripts/verify-videos.mjs`（用 PowerShell IWR 的等价实现或文档化用 pwsh 核验），把已核验的 11 条视频写入 `videos.json`（含 topics/note）
- [ ] Step 2: 写失败测试：`builtinVideos().length >= 10`；每条含 id/title/channel/topics；`addCustomVideo("https://youtu.be/xxxx")` 解析出 id 且写入 localStorage；非法 URL 返回 null；`loadCustomVideos()` 读回
- [ ] Step 3: 实现 `src/data/videos.ts`（含 `refreshVideoMeta` 用 fetch oEmbed，失败静默返回原值）
- [ ] Step 4: 实现 `views/videos.ts`：主题分组 + 卡片 + 页内 iframe（`https://www.youtube.com/embed/ID`）+ 文字要点 + 添加表单
- [ ] Step 5: 跑绿 + 提交 `feat: 视频课模块（内置核验清单 + 页内播放 + 自定义添加）`

### Task 10: 首页/数据/设置适配（全解锁 + 掌握度）

**Files:** Modify `src/views/home.ts`、`src/views/stats.ts`、`src/views/settings.ts`、`src/data/achievements.ts`、`src/store/storage.ts`、`tests/*`

- [ ] Step 1: storage 增加字段（`rootStats`、`selfTestStats`）与迁移；测试补齐
- [ ] Step 2: 首页改造：打卡/连续天数/XP + 今日推荐（随机主题、随机词根家族、随机语法单元）+ 四板块快捷入口 + 学习进度概览
- [ ] Step 3: 数据页：新增「词根掌握度」「已学词数/词表总数」「自测正确率」，保留热力图/成就墙/错题本
- [ ] Step 4: 设置页：主题**全部解锁**（移除阶段门槛）；保留音效/发音/释义/每日目标
- [ ] Step 5: 成就新增：首个词源家族学完、累计 100 个词源拆解、连续 7 天打卡等；测试补齐
- [ ] Step 6: 跑绿 + 提交 `feat: 首页/数据/设置适配全解锁与掌握度`

### Task 11: M2 内容补全（初中/高中/四级三层助记 + 语法扩展）

**Files:** Modify `src/data/mnemonics.json`、`src/data/grammar-v2/*`、`src/data/wordbank-daily.json`、`src/data/videos.json`

- [ ] Step 1: 生成初中/高中/四级全量三层助记（词源直出 + 构词规则 + AI 助记补写），输出 `mnemonics.json`；补测试：三个词表的每词都能取到 mnemonic 或明确标记为「基础词」
- [ ] Step 2: 语法扩展至 23 单元（被动/从句/非谓语/虚拟/倒装/主谓一致/语篇/英语思维专题）
- [ ] Step 3: 主题词包与表达包扩充；视频清单扩充至 30+（用核验脚本逐条验证）
- [ ] Step 4: 跑绿 + 提交 `feat: M2 内容补全（全量助记 + 语法 23 单元 + 视频扩充）`

### Task 12: 全量验收与交付

**Files:** Modify `README.md`

- [ ] Step 1: `npm.cmd test` 全绿、`npx.cmd tsc --noEmit` 零错误、`npm.cmd run build` 单文件
- [ ] Step 2: 静态核查：dist/index.html 无外部资源引用（除 iframe 视频）；无「锁定/未解锁」文案残留
- [ ] Step 3: 按规格 §11 验收标准逐条核对并记录证据
- [ ] Step 4: 更新 README（v2 功能、词源三层说明、视频使用与版权声明、如何更新词库/词源）
- [ ] Step 5: 提交 `docs: v2 交付说明与验收记录`

---

## Self-Review

**规格覆盖**：§5 八板块 → Task 1（路由）+3/5/8/9/7（各板块视图）+10（数据/设置）；§6 学习流程 → Task 2（助记）+5（标记）+6（自测）+7（复习）；§3.2 三层策略 → Task 2；“全解锁” → Task 1/5/8/10；§3.3 视频核验 → Task 9；§10 M1/M2 → Task 1-10 / Task 11；§11 验收 → Task 12。
**占位符扫描**：无 TBD；内容类任务给出明确清单（18 主题、12/23 单元、11 条已核验视频 ID）。
**类型一致性**：`Mnemonic.layer` 与 `RootWordRef.layer` 同为三值联合；`buildQuestions` 返回 `SelfTestQuestion[]` 被复习视图与单词详情复用；`Video.custom` 标记用户添加项。
