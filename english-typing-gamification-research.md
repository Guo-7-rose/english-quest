# 调研报告：游戏化英语学习 × 打字练习 开源项目调研

> **调研目标**：为「打字鸭」类网站（打字 + 背单词 + 语法训练 + 每日打卡 + 游戏化正反馈）收集 GitHub 开源参考素材。
> **数据口径**：所有 star 数、许可证、语言均通过 GitHub 官方 API 实时获取（gh CLI，账号 Guo-7-rose）；star 数会随时间变化，下文数值为调研执行时点数据。
> **许可提醒**：本报告区分「可直接复用（宽松许可证）」与「仅借鉴思路（GPL/AGPL/闭源）」。

---

## 一、重点项目档案

### A. 打字 × 词汇结合（最直接对标）

#### 1. Qwerty Learner —— 全球最成功的「打字背单词」开源项目 ⭐ 标杆
- **URL**: https://github.com/RealKai42/qwerty-learner ｜ **23,315 stars** ｜ TypeScript（React + Tailwind）｜ **GPL-3.0**
- 一句话：为键盘工作者设计的单词记忆与「英语肌肉记忆」锻炼软件，在线版 https://qwerty.kaiyi.cool/
- **核心机制**：单词跟打（显示音标 + 中英释义 + 英美发音）；**输入错误必须重打整个单词**（防止形成错误肌肉记忆）；每章（20 词）练完弹出**默写模式**（看释义打单词）；错词自动收集进「错误单词」本；支持 200+ 词库切换（四六级/考研/雅思/托福/GRE/牛津3000/COCA20000/RAZ 分级等）。
- **技术栈**：纯前端 React + TS，词库为静态 JSON，进度存 localStorage，发音调有道 dictvoice 接口。
- **可借鉴点**：①「错误重打」这一条看似反人性、实为打字学习的核心设计；②词库 JSON 极简格式 `{name, trans[], usphone, ukphone}`，一张表换一个词库；③跟打→默写→听写的三阶难度递进；④无需后端、纯前端即可上线。

#### 2. KanaDojo —— 明确以「Duolingo + Monkeytype」为蓝本的项目（最接近我们的定位）
- **URL**: https://github.com/lingdojo/kana-dojo ｜ **3,566 stars** ｜ TypeScript ｜ **AGPL-3.0**
- 一句话：美学化、极简、高度可定制的日语学习平台（假名/汉字/词汇训练），灵感直接来自 Duolingo 与 Monkeytype，Next.js 15 + Zustand + Tailwind + Vitest，获 Vercel OSS 赞助，有 Discord 社区。
- **可借鉴点**：①「语言学习内容 × Monkeytype 式打字交互」的融合范式已被验证可行（3566 star + Vercel 赞助）；②打字训练器与词汇卡片的 UI 融合方式；③用 Zustand 管全局状态、Tailwind 做主题化的工程实践；④以「Good First Issues + Discord」运营开源社区。**注意 AGPL，只借鉴思路。**

#### 3. Monkeytype —— 打字练习体验的天花板
- **URL**: https://github.com/monkeytypegame/monkeytype ｜ **20,826 stars** ｜ TypeScript ｜ **GPL-3.0**
- 一句话：最可定制、极简设计的打字网站，https://monkeytype.com/
- **机制清单**（官方文档确认）：时间/单词/引言/Zen/自定义模式；标点、数字、大小写开关；**主题系统**（社区贡献上百套配色）、光标样式、**平滑光标动画**；**stop-on-error**（出错即停）、confidence mode（隐去文字）；**按键声/错误音效**；**Funbox 彩蛋模式**（视觉特效、挑战、特殊字符、文本变换、词汇生成、布局等 7 类）；实时 wpm/acc 曲线、个人最佳（PB）；XP 系统、**每日/每周 XP/全时排行榜**、Discord 集成、REST API、presets、tags、challenges。
- **可借鉴点**：①打字即时反馈的细节标准（光标动画、错误标红、音效分层）；②主题 + 自定义是留存利器；③XP + 周榜重置的轻量竞争设计；④彩蛋模式成本低、传播价值高。GPL 注意只学思路。

#### 4. keybr.com —— 打字教学算法的天花板（已开源！）
- **URL**: https://github.com/aradzie/keybr.com ｜ **4,764 stars** ｜ TypeScript ｜ **AGPL-3.0**
- 一句话：keybr.com 的完整源码，「最聪明的触觉打字学习法」。
- **核心算法**：记录每一次击键，**按单个按键统计速度/准确率**；自动生成聚焦「最弱按键」的伪词练习；用户自设目标速度，达标才解锁新字母（从最高频字母开始逐步引入）；**能预测还需多少课时达标**；个人页有详细进度图表。
- **可借鉴点**：①「按键级统计 → 最弱键强化 → 达标解锁」是打字教学的方法论核心，可移植为「单词按键盘难度/字母分布分级」；②目标速度 + 达标解锁字母 = 天然的关卡化；③预测完成进度给用户确定感。

#### 5. ZType —— 经典打字射击游戏（原仓库已下线，有镜像）
- 原仓库 phoboslab/ztype 已 404（作者删除）；游戏仍可玩（zty.pe），社区镜像/训练器如 [KevinWang15/ztype-trainer](https://github.com/KevinWang15/ztype-trainer)（69★，JS，含 6 种特效）。
- 一句话：打单词发射子弹击落敌机，单词越长火力越猛。
- **可借鉴点**：①「单词 = 子弹」的即时爽感反馈；②单词难度（长度/生僻度）与游戏强度挂钩；③可做成我们网站的「休闲模式」小游戏引流。

#### 6. 其他打字项目速览（按价值排序）
| 项目 | stars | 语言/许可 | 要点 |
|---|---|---|---|
| [max-niederman/ttyper](https://github.com/max-niederman/ttyper) | 1,599 | Rust/MIT | 终端彩色打字测试，有趣的 UI 参考 |
| [unhappychoice/gittype](https://github.com/unhappychoice/gittype) | 1,621 | Rust/MIT | 用真实源码当打字素材（内容 = 练习素材的思路） |
| [jankrepl/mltype](https://github.com/jankrepl/mltype) | 471 | Python/MIT | 用神经网络按击键难度生成练习文本 |
| [ranelpadon/ngram-type](https://github.com/ranelpadon/ngram-type) | 300 | JS | n-gram 打字训练，带音效/颜色反馈与最低达标门槛 |
| [didoesdigital/typey-type](https://github.com/didoesdigital/typey-type) | 109 | TS/AGPL | 免费速记打字应用 |
| [susam/quickqwerty](https://github.com/susam/quickqwerty) | 81 | HTML/MIT | 极简浏览器打字教练 |
| [harismuneer/Typing-Tutor](https://github.com/harismuneer/Typing-Tutor) | 32 | C++/MIT | 老牌图形化打字游戏 |
| [mrkkrp/typit](https://github.com/mrkkrp/typit)、[jpablobr/emacs-monkeytype](https://github.com/jpablobr/emacs-monkeytype) | 76/84 | Emacs Lisp | 「10fastfingers/monkeytype 移植」范例 |

> **10fastfingers、TypingClub、TypeLit.io 均为闭源**：GitHub 上没有成熟的官方开源实现（typelit 关键词搜索结果全部无关）。TypeLit 式「打字读书」可用 **Project Gutenberg 公版书**自建。

### B. 游戏化语言学习 / Duolingo 类

#### 7. WordPecker —— Duolingo 式课程 × 个人词库 × LLM 生成内容
- **URL**: https://github.com/baturyilmaz/wordpecker-app ｜ **2,268 stars** ｜ TypeScript（React + MongoDB + Docker）｜ **MIT** ✅
- 一句话：把 Duolingo 式课程体验用到你自己收集的词上——从书/文章/视频里加词，用互动测验和 LLM 生成课程复习。
- **可借鉴点**：①「用户自建词表 + 模板化课程生成」的产品形态；②LLM 批量生成例句/课程的流水线思路；③有自己的吉祥物（WordPecker）做品牌化；MIT 可直接参考架构。

#### 8. LibreLingo —— 最完整的开源 Duolingo 替代品
- **URL**: https://github.com/kantord/LibreLingo ｜ **2,636 stars** ｜ Python（Django + Svelte 前端）｜ **AGPL-3.0**
- 一句话：社区共有的语言学习平台，课程以 YAML 定义（skills/lessons/exercises），内置 SRS 复习与 TTS。
- **可借鉴点**：①**课程内容 = 结构化数据（YAML）**，与代码解耦，社区可贡献课程；②题型模板化（选择/填空/听写等）；③SRS 与课程树的结合方式。

#### 9. Duolingo 克隆们（可参考产品结构与 UI 实现）
- [sanidhyy/duolingo-clone](https://github.com/sanidhyy/duolingo-clone)（Lingo）｜ 663★ ｜ TS/Next.js ｜ **MIT** ✅ —— 交互式语言学习平台，像素级复刻 Duolingo UI。
- [DhavalDudheliya/DuoLingo_Clone](https://github.com/DhavalDudheliya/DuoLingo_Clone)｜ 10★ ｜ Next.js + PostgreSQL + Drizzle ORM + Clerk 认证 + Stripe 支付 —— **完整全栈结构**：units/lessons/points/**hearts 红心**/quests/leaderboards/shop 一个不少，小 star 但工程参考价值高。
- [jokerhutt/ludolang](https://github.com/jokerhutt/ludolang)｜ 36★ ｜ React + TS + Tailwind。
- **可借鉴点**：红心（生命）、XP、任务、商店、排行榜的前端数据流实现；Next.js + Drizzle + Stripe 的轻量全栈模板。

#### 10. 中文社区「背单词」类开源（百词斩/扇贝均无官方开源，这些是实际存在的开源实现）
- [Uahh/ToastFish](https://github.com/Uahh/ToastFish)｜ 6,572★ ｜ C#/WPF ｜ MIT ✅ —— Windows 桌面「摸鱼背单词」，**利用 toast 通知碎片时间弹词**（场景创新，值得借鉴）。
- [Benature/WordReview](https://github.com/Benature/WordReview)｜ 678★ ｜ Django + MySQL + JS ｜ LGPL-3.0 —— 网页背单词完整实现（用户/词书/学习记录）。
- [KyleBing/english-vocabulary](https://github.com/KyleBing/english-vocabulary)｜ 2,034★ ｜ **BSD-3-Clause** ✅ —— 四六级/考研/SAT 单词 txt+json 词表（**直接可用的词库素材**，见第三节）。
- [busiyiworld/maimemo-export](https://github.com/busiyiworld/maimemo-export)｜ 981★ —— 墨墨背单词导出工具（说明词表互通是刚需）。

#### 11. 阅读/挖词类（内容获取侧的参考）
- [LuteOrg/lute-v3](https://github.com/LuteOrg/lute-v3)｜ 1,578★ ｜ Python ｜ **MIT** ✅ —— LWT 后继者，阅读中查词、生词自动进复习队列（「语境挖词」工作流）。
- [FreeLanguageTools/vocabsieve](https://github.com/FreeLanguageTools/vocabsieve)｜ 542★ ｜ Python ｜ GPL-3.0 —— 句子挖掘 + 词频过滤 + 一键生成 Anki 卡片。
- [VocabHunter/VocabHunter](https://github.com/VocabHunter/VocabHunter)｜ 295★ ｜ Java ｜ Apache-2.0 ✅ —— 从任意文本自动提取生词清单。
- [mengxi-ream/read-frog](https://github.com/mengxi-ream/read-frog)｜ 9,980★ ｜ TS ｜ GPL-3.0 —— 陪读蛙：阅读翻译一体化（说明「学习工具 × 陪伴感」的流量潜力）。

### C. 记忆算法 / Anki 生态

#### 12. Anki / AnkiDroid —— 间隔重复的事实标准
- [ankitects/anki](https://github.com/ankitects/anki)｜ 31,791★ ｜ Rust+Python+TS ｜ **AGPL-3.0**；[ankidroid/Anki-Android](https://github.com/ankidroid/Anki-Android)｜ 11,941★ ｜ Kotlin ｜ GPL-3.0
- **可借鉴点**：①卡片调度状态机（New/Learning/Review/Relearn）；②统计数据面板（预测、复习负载、正确率曲线）；③「每日复习量控制」防止 burnout。

#### 13. FSRS —— 新一代开源间隔重复算法（比 SM-2 更优，可直接用）
- [open-spaced-repetition/fsrs4anki](https://github.com/open-spaced-repetition/fsrs4anki)｜ 4,089★ ｜ **MIT** ✅；同组织 [py-fsrs](https://github.com/open-spaced-repetition/py-fsrs)（Python）、[ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)（TS）、[free-spaced-repetition-scheduler](https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler)（Rust，723★，Apache-2.0）。
- **可借鉴点**：**背单词的复习调度直接集成 ts-fsrs（MIT），不要自己发明艾宾浩斯**。FSRS 按记忆稳定性建模，比固定间隔曲线实测召回率更高。

#### 14. Anki 生态的「打卡可视化」—— review-heatmap
- [glutanimate/review-heatmap](https://github.com/glutanimate/review-heatmap)｜ 1,314★ ｜ Python ｜ 自定义许可证（仅参考思路）
- 一句话：GitHub 贡献图样式的复习热力图，Anki 社区「连续打卡」心理锚点的来源。
- **可借鉴点**：热力图 = 最成熟的 streak 可视化形态（我们可直接用 [grubersjoe/react-github-calendar](https://github.com/grubersjoe/react-github-calendar)，660★，**MIT** ✅）。

### D. 语法训练

#### 15. Harper —— 可嵌入浏览器的开源语法检查器（首选）
- **URL**: https://github.com/Automattic/harper ｜ **16,178 stars** ｜ Rust ｜ **Apache-2.0** ✅
- 一句话：离线、隐私优先的语法检查器，Rust 编写、**编译为 WASM 可纯前端运行**，由 WordPress 母公司 Automattic 维护。
- **可借鉴点**：①**直接作为我们语法练习的即时批改引擎**（本地判卷：时态、标点、拼写、风格）；②开源且 Apache-2.0 可商用、无后端成本；③有 lint 规则清单可反推「可自动判分的题型」。

#### 16. LanguageTool —— 功能最全，但重
- [languagetool-org/languagetool](https://github.com/languagetool-org/languagetool)｜ 15,107★ ｜ Java ｜ LGPL-2.1 —— 25+ 语言语法检查，可 Docker 自托管，提供 HTTP API；[jxmorris12/language_tool_python](https://github.com/jxmorris12/language_tool_python)（533★，GPL）可本地调用。
- **可借鉴点**：若后期需要「不限题型/自由写作纠错」，自托管 LT 是免费方案；MVP 阶段用 Harper 即可。

#### 17. 轻量英语写作检查器（可直接做「语法题判分」规则库）
- [btford/write-good](https://github.com/btford/write-good)｜ 5,094★ ｜ JS ｜ **MIT** ✅ —— 被动语态、weasel words、长句等风格检查，规则简单可读。
- [textlint/textlint](https://github.com/textlint/textlint)｜ 3,199★ ｜ TS ｜ **MIT** ✅ —— 可插拔自然语言 linter，生态里有 [textlint-rule-write-good](https://github.com/textlint-rule/textlint-rule-write-good) 等英文规则包。
- **可借鉴点**：write-good 的每条规则 = 一道可自动出题/判分的语法题（「把被动语态改成主动」类题型可程序化生成）。

#### 18. 语法练习/题库类
- [codeyu/EnglishGrammarBook](https://github.com/codeyu/EnglishGrammarBook)｜ 800★ ｜ JS ｜ **MIT** ✅ —— 旋元佑《进阶文法》的交互式网页书（中文学习者友好，章节组织可参考）。
- [galvarezz09/Grammar-Drill-Yard](https://github.com/galvarezz09/Grammar-Drill-Yard)｜ 56★ —— 交互式语法练习与测验。
- 另有 [rastmob/openai-grammar-correction](https://github.com/rastmob/openai-grammar-correction)（LLM 纠错）等大量 LLM 类小项目 —— **趋势：语法练习正转向「Harper 类规则引擎判分 + LLM 生成解析」的混合方案**。

### E. 打卡 / 游戏化习惯系统

#### 19. Habitica —— 游戏化习惯养成的最完整开源实现
- **URL**: https://github.com/HabitRPG/habitica ｜ **14,185 stars** ｜ JavaScript（Vue + Node + MongoDB）｜ 代码 GPL-3.0，美术素材 CC-BY-NC-SA 3.0
- 一句话：把待办/习惯当 RPG 玩的习惯追踪器：**XP、等级、职业、宠物、坐骑、装备、Boss 团战、任务线**。
- **可借鉴点**：①「每日任务（Dailies）断了掉血、连续完成加成」的 streak 奖惩框架；②成就/徽章分级；③社交组队打 Boss 的留存设计。素材不可商用（NC），只借机制。

#### 20. Duolingo 的 streak 系统（闭源，但机制值得拆解）
- 参考其公开产品设计：**连击火焰 + 冻结卡（streak freeze，防断签保险）+ 每日目标可调（轻松/正常/硬核）+ 宝石货币 + 红心生命 + 联赛（周重置防马太效应）+ 每日/月度任务 + 吉祥物 + 对/错音效分层**。这些是「每日打卡 + 游戏化正反馈」的行业标准答案，我们可逐条对照实现（机制不受版权保护，UI 需原创）。

#### 21. Wordle —— 「每日一题 + 可分享战报」的社交裂变范式
- 原仓库 [powerlanguage/wordle](https://github.com/powerlanguage/wordle) 已被删除（NYT 收购后闭源），但开源克隆众多：[yyx990803/vue-wordle](https://github.com/yyx990803/vue-wordle)（597★，Vue）、[ajeetdsouza/clidle](https://github.com/ajeetdsouza/clidle)（634★）、[antfu/handle](https://github.com/antfu/handle)（1,440★，汉兜）。
- **可借鉴点**：**每日一个全球统一题目 + 完成结果生成 emoji 方块战报**——零成本病毒传播机制，强烈建议做成我们的「每日挑战」。

### F. 词库基础设施（详见第三节）

| 项目 | stars | 许可 | 用途 |
|---|---|---|---|
| [skywind3000/ECDICT](https://github.com/skywind3000/ECDICT) | 8,381 | **MIT** ✅ | 免费英汉词典库（含音标/释义/词频/考试标签/词形变化）——**我们词库的地基** |
| [first20hours/google-10000-english](https://github.com/first20hours/google-10000-english) | 4,486 | 无明确许可 ⚠️ | Google 万亿语料库前 1 万高频词（按长度/难度分组，打字练习常用） |
| [rspeer/wordfreq](https://github.com/rspeer/wordfreq) | 1,754 | Apache-2.0 ✅ | 多语种词频库（Python 包） |
| [llt22/coca-vocabulary-20000](https://github.com/llt22/coca-vocabulary-20000) | 345 | MIT ✅ | COCA 语料库前 2 万词 |
| [openlanguageprofiles/olp-en-cefrj](https://github.com/openlanguageprofiles/olp-en-cefrj) | 223 | AGPL ⚠️ | CEFR-J 分级词表（A1–C2） |
| [Maximax67/Words-CEFR-Dataset](https://github.com/Maximax67/Words-CEFR-Dataset) | 102 | MIT ✅ | 单词→CEFR 级别映射（含词形/词频） |
| [Kolia951/The_Oxford_3000_CEFR](https://github.com/Kolia951/The_Oxford_3000_CEFR) | 8 | Unlicense ✅ | 牛津 3000 核心词 + CEFR 分级 |
| [tatuylonen/wiktextract](https://github.com/tatuylonen/wiktextract) | 1,280 | 代码 MIT ✅ / 数据 CC-BY-SA | Wiktionary 全量结构化数据（kaikki.org 提供下载） |

### G. Awesome 列表

- [yvoronoy/awesome-english](https://github.com/yvoronoy/awesome-english)｜ 4,091★ ｜ **CC0** ✅ —— 英语学习资源大全（语法/词汇/播客/影视），其中值得注意的条目：Numblr（听数字打字，IELTS 听力训练）、KaChiKa（FSRS 拍照记词）、Sentence Mining 方法论。
- [open-spaced-repetition/awesome-fsrs](https://github.com/open-spaced-repetition/awesome-fsrs)｜ 714★ ｜ CC0 —— FSRS 全语言实现与论文清单（选型 ts-fsrs 前可浏览）。
- [ankicommunity/awesome-anki](https://github.com/ankicommunity/awesome-anki)（README 指向 tianshanghong/awesome-anki）—— Anki 插件/牌组/工具清单，review-heatmap、AwesomeTTS 等皆列于此。
- **⚠️ 缺口发现：GitHub 上没有成规模的「awesome-typing」列表**（搜索到的同名仓库均为无关项目）——侧面说明「打字 × 语言学习」细分赛道尚缺一个权威清单，我们的项目有成为该赛道标杆的机会。

---

## 二、游戏化机制清单

> 按机制类别归纳，每条注明来源。✅ = 建议直接采纳。

### 即时反馈类
| 机制 | 说明 | 来源 |
|---|---|---|
| ✅ 正确/错误音效分层（按键声、错误提示音、完成音） | 打字时每键有 click 声，错误有专属音效 | Monkeytype |
| ✅ 错误字符即时标红 + 光标平滑动画 | 可感知的「手感」，是打字体验的灵魂 | Monkeytype |
| ✅ 错误必须重打（防错误肌肉记忆） | 打错整个词需重来，看似惩罚实为保护 | Qwerty Learner |
| ✅ 连击（combo）显示 | 连续正确击键计数，激励不犯错 | Monkeytype、各类打字游戏 |
| 连击火焰/streak 火焰动画 | 连击数越高火焰越旺（Duolingo 每日连击） | Duolingo、Wordle 系 |
| 输入即发音（视觉+听觉双通道记忆） | 打完/打中即播放单词发音 | Qwerty Learner、Anki+AwesomeTTS |
| 词汇游戏化射击反馈（爆炸/得分飘字） | 打对单词消灭敌人/得分动画 | ZType |

### 进度与成长类
| 机制 | 说明 | 来源 |
|---|---|---|
| ✅ XP/经验值 + 等级 | 每次练习给 XP，累积升级 | Monkeytype、Habitica、Duolingo |
| ✅ 个人最佳（PB）记录与突破提示 | wpm/acc 打破纪录有明确庆祝 | Monkeytype |
| ✅ 章节/单元进度条 + 课程树 | 内容关卡化，进度可视 | Qwerty Learner、Duolingo、LibreLingo |
| 达标解锁（字母/难度/章节） | 达到目标速度才解锁新内容 | keybr.com |
| 进度预测（还差多少达标） | 给用户确定性与期待 | keybr.com |
| 统计图表（正确率曲线、复习负载预测） | 数据面板增强掌控感 | Anki、keybr.com、Monkeytype |

### 竞争类
| 机制 | 说明 | 来源 |
|---|---|---|
| ✅ 排行榜（全时 + 每日 + 每周 XP） | 每日/每周榜定期重置，避免马太效应 | Monkeytype |
| 联赛/段位（周赛制晋升降级） | 同水平人群竞争，每周重置 | Duolingo |
| ✅ 每日全球统一挑战 | 每天一道全站统一题，大家可比较 | Wordle |
| 多人实时竞速 | 同文本实时 PK | TypeRacer 类（开源克隆：cheatsnake/TypingRace 等，均小项目） |

### 习惯与打卡类
| 机制 | 说明 | 来源 |
|---|---|---|
| ✅ streak 连击 + 火焰展示 | 连续学习天数，断签清零（可购冻结卡） | Duolingo |
| ✅ 冻结卡（streak freeze） | 断签保护道具，降低流失焦虑，还是商店付费点 | Duolingo |
| ✅ 每日目标可调（轻松/正常/硬核） | 目标分级让不同强度用户都能坚持 | Duolingo |
| ✅ 贡献图热力图 | GitHub 绿格式打卡可视化，心理锚点极强 | Anki review-heatmap、react-github-calendar |
| 每日任务（Dailies）断签扣血 | 每日任务与生命值挂钩 | Habitica |

### 收集与身份类
| 机制 | 说明 | 来源 |
|---|---|---|
| ✅ 成就/徽章系统 | 里程碑式一次性成就 | Habitica、Monkeytype（challenges）、Duolingo |
| 主题/皮肤收集（可用货币购买） | 视觉个性化作为奖励 | Monkeytype 主题系统、Habitica 装备 |
| 宠物/吉祥物养成 | 情感联结 + 收集癖 | Habitica 宠物、Duolingo 猫头鹰、WordPecker |
| 称号/段位身份 | 打字速度段位（如「键盘侠」分级） | 10fastfingers、Monkeytype 排行榜 |

### 社交传播类
| 机制 | 说明 | 来源 |
|---|---|---|
| ✅ 战报分享（emoji 方块图 + 成绩卡片） | 完成结果一键生成可分享图文 | Wordle |
| 组队打 Boss / 好友任务 | 社交互助任务 | Habitica 组队、Duolingo 好友任务 |
| Discord/社区积分联动 | 排行榜与 Discord 角色挂钩 | Monkeytype |

### 惩罚与压力类（谨慎使用）
| 机制 | 说明 | 来源 |
|---|---|---|
| 红心/生命值（做错扣命，用完暂停） | 制造稀缺感但也制造挫败 | Duolingo 克隆们 |
| stop-on-error / 强制准确率门槛 | 达不到准确率不算完成 | Monkeytype、ngram-type |
| 错误词强制进复习队列 | 错词自动变「负债」，下次优先考 | Qwerty Learner 错词本、Anki |

---

## 三、词库与内容来源

### 3.1 首选地基：ECDICT（MIT ✅，可直接商用）
- **URL**: https://github.com/skywind3000/ECDICT ｜ 8,381★ ｜ **MIT**
- **CSV 字段全解**（对我们的价值）：
  - `word` 单词、`phonetic` 音标、`definition` 英文释义、`translation` 中文释义（多行=多义项）
  - `pos` 词性（`/` 分隔）、`collins` 柯林斯星级（1–5，词的重要性评分）、`oxford` 是否牛津 3000 核心词
  - `tag` **考试标签**：`zk 中考 / gk 高考 / cet4 四级 / cet6 六级 / ky 考研 / toefl / ielts / gre` —— **天然就是我们的词库分级体系**
  - `bnc` 英国国家语料库词频排名、`frq` 当代语料库词频排名 —— **天然就是「先学高频词」的排序依据**
  - `exchange` 词形变化（单复数/过去式/过去分词/三单/比较级…）—— **可直接自动生成词形题（语法训练的低垂果实）**
  - `audio` 发音音频 URL 字段
- 提供 SQLite 版本与读取脚本，70 万+ 词条，覆盖全部主流考试词表。

### 3.2 现成「打字用」词库格式：Qwerty Learner 的 JSON
- 每个词库一个 JSON 文件：`[{"name":"abandon","trans":["v. 放弃"],"usphone":"ə'bændən","ukphone":"ə'bændən"}, ...]`
- 其 `public/dicts/` 下 **200+ 现成词表**：CET4_T/CET6_T/考研/TOEFL/GRE/IELTS 全家桶、牛津 3000/5000、COCA20000、Macmillan 7000、朗文 3000、RAZ A–Z 分级读物词汇、新概念 1–4、KET/PET、高考 3500、程序员词汇等 —— **可直接参考其「词库清单」做我们自己的词库规划**。
- ⚠️ 该项目整体 GPL-3.0，词库文件建议**不要直接照搬**；同样的格式用 ECDICT 自行生成即可（格式本身简单，不受保护）。

### 3.3 可复用的开源词表清单（按许可安全度排序）
| 来源 | 许可 | 用途建议 |
|---|---|---|
| ECDICT | MIT ✅ | 主词库：释义/音标/词频/考试分级/词形变化 |
| KyleBing/english-vocabulary | BSD-3 ✅ | 四六级/考研/SAT 纯词表（txt+json）快速起步 |
| wordfreq | Apache-2.0 ✅ | 多语种词频（若要做「词频排序学习」） |
| COCA 20000（llt22 仓库） | MIT ✅ | COCA 高频 2 万词表 |
| Oxford 3000 CEFR（Kolia951 仓库） | Unlicense ✅ | 核心词 + A1–B2 分级 |
| Words-CEFR-Dataset | MIT ✅ | 单词→CEFR 级别映射（做分级课程用） |
| google-10000-english | 无明确许可 ⚠️ | 高频词排序参考（打字练习社区事实标准，商用前需自行评估） |
| CEFR-J（olp-en-cefrj） | AGPL ⚠️ | 只做分级参考，勿打包分发 |
| wiktextract / kaikki.org | 代码 MIT ✅ / 数据 CC-BY-SA ⚠️ | 需要完整词典（例句/词源）时的备选 |
| Project Gutenberg | 公版 ✅ | TypeLit 式「打字读书」内容源 |

### 3.4 发音音频
- **Web Speech API**（浏览器原生 TTS）：零成本、零版权风险，MVP 首选；
- Qwerty Learner 使用有道 dictvoice 开放接口（免费但非官方保证，商用需评估条款）；
- ECDICT `audio` 字段提供真实发音音频 URL 备份方案；
- Anki 生态的 AwesomeTTS 插件思路（多引擎聚合）可参考。

### 3.5 语法题内容
- **自动判分引擎**：Harper（WASM，Apache-2.0 ✅）+ write-good/textlint 规则（MIT ✅）；
- **题库**：先人工按语法点（时态/主谓一致/冠词/介词/从句）建题，Harper 负责判分；解释文案可用 LLM 批量生成后人工校对（WordPecker 已验证该流水线）；
- 交互式语法书 [codeyu/EnglishGrammarBook](https://github.com/codeyu/EnglishGrammarBook)（MIT）可参考知识点章节组织。

---

## 四、对我们的启示（8 条可落地建议）

1. **词库直接建在 ECDICT（MIT）上**：用 `tag` 字段天然获得「中考→高考→四级→六级→考研→雅思→托福→GRE」分级体系，用 `bnc/frq` 词频排序出「先高频后低频」的学习路径，用 `exchange` 字段自动生成词形变化题。词库 JSON 采用 Qwerty Learner 同款三字段格式（格式无版权），自研生成脚本即可。

2. **打字引擎三层融合**：交互细节抄 Monkeytype 标准（光标动画、错误标红、分层音效、stop-on-error 可选）；教学算法抄 keybr 思路（按键级统计、最弱键强化、达标解锁、进度预测）；学习保护抄 Qwerty Learner（错误重打、错词本）。三者叠加就是我们差异化的「打字教学内核」。（三者均 GPL/AGPL——只抄思路，代码全部自研。）

3. **三阶难度递进是产品主线**：跟打（词 + 音标 + 释义 + 发音）→ 默写（看释义打单词）→ 听写（听发音打单词），每章完成触发默写巩固（Qwerty Learner 验证过的流程）；错词自动进入复习队列。

4. **复习调度直接集成 ts-fsrs（MIT）**，不要自己发明艾宾浩斯曲线。Anki 生态 20 年验证了 SRS 的留存价值，FSRS 是当前最优开源算法；把「每日复习量」做成可调目标，控制 burnout。

5. **打卡系统 = streak 火焰 + 冻结卡 + 热力图 + 每日目标**：Duolingo 的 streak + freeze 是留存率最高的组合；热力图用 react-github-calendar（MIT）现成组件；每日目标设「轻松/正常/硬核」三档。

6. **社交裂变做「每日一题」**：每天一道全球统一挑战（如「今日单词」或语法题），完成后生成 emoji 方块战报一键分享（Wordle 模式）。这是零投放成本的增长引擎，且天然配合第 5 条的打卡。

7. **语法模块用 Harper + write-good 做规则引擎**：Harper 编译为 WASM 纯前端判分（Apache-2.0 可商用），write-good 规则天然可程序化出题（被动语态改写、冗余词删除等）。MVP 不用接任何 LLM API，后续再用 LLM 生成题目解析（WordPecker 流水线）。

8. **架构与许可证策略**：MVP 纯前端（React/Next.js + TS + Zustand + Tailwind + IndexedDB），Qwerty Learner、Monkeytype、KanaDojo 都验证了纯前端可行、上线快；需要账号/排行时再加 Next.js API Routes + PostgreSQL（参考 DuoLingo_Clone 的 Drizzle + Clerk + Stripe 模板）。**代码级复用只选 MIT/Apache/BSD**（ECDICT、harper、write-good、textlint、ts-fsrs、react-github-calendar、KyleBing 词表），GPL/AGPL 项目（Qwerty Learner、Monkeytype、keybr、KanaDojo、Habitica、LibreLingo）仅作交互与机制参考。

---

## 五、最有价值链接清单

**必看（我们的直接对标）**
1. https://github.com/RealKai42/qwerty-learner （打字背单词标杆，词库清单在此）
2. https://github.com/monkeytypegame/monkeytype （打字体验标准）
3. https://github.com/aradzie/keybr.com （打字教学算法）
4. https://github.com/lingdojo/kana-dojo （Duolingo×Monkeytype 融合范式）
5. https://github.com/baturyilmaz/wordpecker-app （Duolingo 式 × 个人词库 × LLM，MIT）

**词库**
6. https://github.com/skywind3000/ECDICT （词库地基，MIT）
7. https://github.com/KyleBing/english-vocabulary （考试词表，BSD-3）
8. https://github.com/llt22/coca-vocabulary-20000 ｜ https://github.com/rspeer/wordfreq ｜ https://github.com/Maximax67/Words-CEFR-Dataset

**复习算法**
9. https://github.com/open-spaced-repetition/fsrs4anki ｜ https://github.com/open-spaced-repetition/awesome-fsrs
10. https://github.com/glutanimate/review-heatmap （打卡热力图参考）｜ https://github.com/grubersjoe/react-github-calendar （MIT 实现）

**语法**
11. https://github.com/Automattic/harper （WASM 语法引擎，Apache-2.0）
12. https://github.com/btford/write-good ｜ https://github.com/textlint/textlint （MIT 规则引擎）
13. https://github.com/codeyu/EnglishGrammarBook （中文交互式语法书）

**游戏化**
14. https://github.com/HabitRPG/habitica （RPG 化习惯系统）
15. https://github.com/sanidhyy/duolingo-clone ｜ https://github.com/DhavalDudheliya/DuoLingo_Clone （Duolingo UI/全栈参考）

**Awesome 列表**
16. https://github.com/yvoronoy/awesome-english （CC0）
17. https://github.com/ankicommunity/awesome-anki

**中文社区**
18. https://github.com/Uahh/ToastFish （摸鱼背单词）｜ https://github.com/Benature/WordReview ｜ https://github.com/mengxi-ream/read-frog

---

*报告完。所有 star/许可数据经 GitHub API 实时核实；引用时请注意 GPL/AGPL 项目仅可参考思路，代码与素材复用请以第三节标注的 ✅ 许可为准。*
