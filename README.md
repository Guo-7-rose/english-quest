# 英语闯关岛 English Quest · v2 词源版 🏝️

**词源拆解背单词 + 英语思维语法 + 视频课**，全部内容解锁，想学什么学什么。

> v2 改造：移除打字练习，改为**词根词缀（前缀/词根/后缀）拆解记忆**；语法升级为**英语思维六段式**并配套已核验的 YouTube 视频；所有板块取消锁定。

## 🚀 使用（零安装）

**直接双击 `dist/index.html`** 即可使用。

- 纯离线单文件：无服务器、无需安装、除视频播放外零联网
- 学习进度存浏览器 localStorage（清理浏览器数据会重置）
- 重新构建：`npm.cmd install && npm.cmd run build`

## 📚 八个板块（全部解锁）

| 板块 | 内容 |
|---|---|
| 🏠 学习面板 | 每日打卡🔥 / 连续天数 / XP 等级 / **今日推荐**（随机主题、词根家族、语法单元）/ 热力图 |
| 📚 单词板块 | **日常词汇**（18 个生活主题 746 词 + 50 条生活表达包）→ **初中**（3387）→ **高中**（3516）→ **四级**（3805），词表分页、点词看拆解、可标记「✅记住 / 🔁复习」 |
| 🌱 词根词缀库 | **611 个词根/前缀/后缀家族**（423 词根 + 110 前缀 + 78 后缀）、9,213 个同族词；按类型/搜索筛选；家族页展示含义、来源语言（拉丁/希腊）与全部同族词；词 ↔ 家族双向跳转 |
| 📖 语法训练 | **12 个英语思维单元**：①五大句型 ②be 动词 ③名词可数性 ④冠词 ⑤代词 ⑥一般现在时 ⑦进行时 ⑧过去时 ⑨完成时 ⑩将来表达 ⑪情态动词 ⑫介词。每单元六段：**英语思维开篇 → 规则 → 正误例句 → 常见错误 → 练习 → 配套视频** |
| 🎬 视频课 | **12 条已核验**（oEmbed 返回 200 才收录）的语法视频，按英语思维/时态/冠词/从句分组，页内播放；支持粘贴链接添加自己的视频 |
| 🔁 复习 | 选择题式 FSRS 队列（看词选义 / 看义选词 / **选正确拆解** / 选词根含义），错词按 1→3→7→15 天间隔重现，不打字 |
| 📊 数据 | 已学词数 / 词库总量 / 词根家族数 / 语法进度 / 打卡热力图 / 成就墙 / 错题本 |
| ⚙️ 设置 | 音效、发音、释义开关、每日目标三档、主题（全部解锁）、数据重置 |

## 🧬 三层助记（如实标注，不冒充词源）

| 标签 | 判定规则 | 例 |
|---|---|---|
| 🔵 **词源** | 命中 ECDICT 词源库的**词根家族**（人工校订，含拉丁/希腊来源） | `import = im-(进入) + port(搬运)` |
| 🟢 **构词** | 能产前后缀 + **完整常用词干**（Oxford 3000 或词频排名前 5000） | `unhappy = un- + happy`、`teacher = teach + -er` |
| 🟠 **助记** | 无可靠拆解的**基础词**，用联想/搭配提示 | `juice → 联想 orange 挤出的果汁` |

**精度守门**：只允许能产前缀白名单（un/re/dis/pre/…）+ 完整常用词干参与「构词」判定。开发期实测证明宽松规则会产出假词源（`advice=ad+vice`、`afraid=af+raid`、`beach=be+ach` 全错），因此这些词一律不标「构词」。

## 📁 项目结构

```
src/
├── main.ts                 # 八板块路由（全解锁）
├── data/
│   ├── roots.ts / roots.json            # 611 词根家族（脚本生成）
│   ├── common-stems.json                # 常用词干表（构词守门）
│   ├── wordbank.ts / wordbank-daily.json # 18 主题 + 表达包
│   ├── words-stage1-3.json              # 初中/高中/四级词表
│   ├── grammar.ts / grammar-core-*.json # 12 个英语思维单元
│   ├── videos.ts / videos.json          # 已核验视频清单
│   └── achievements.ts
├── engine/                 # 纯逻辑：mnemonic/selfTest/review/reviewQueue/progress/streak/grammar
├── views/                  # home/wordbank/roots/grammar/videos/review/stats/settings
├── fx/                     # WebAudio 合成音效 + 粒子/彩带
└── store/storage.ts        # localStorage + schema 迁移
scripts/
├── build-roots.mjs         # ECDICT 词源 → roots.json + common-stems.json
├── build-words.mjs         # ECDICT → 初中/高中/四级词表（按词频排名排序、剔除功能词）
└── build-daily.mjs         # 主题词清单 → 带音标释义的日常词包
tests/                      # 87 个测试（单元 + jsdom 端到端集成）
```

## 🔁 重新生成数据

```bash
# 1. 下载 ECDICT（MIT）到 data-prep/：ecdict.csv + wordroot.txt
#    https://github.com/skywind3000/ECDICT
node scripts/build-roots.mjs    # 词根家族 + 常用词干
node scripts/build-words.mjs    # 初中/高中/四级词表
node scripts/build-daily.mjs    # 日常主题词包
npm.cmd run build
```

## 🧪 开发与测试

```bash
npm.cmd test        # 87 个测试
npm.cmd run dev     # 开发服务器
npm.cmd run build   # 产出单文件 dist/index.html
npx.cmd tsc --noEmit
```

## ⚠️ 使用说明与版权

- **视频**：均为 YouTube 上公开的第三方教学视频，版权归原频道所有；本站在线嵌入播放，不下载、不转存。离线时视频不可播放，其余功能正常。
- **数据来源**：词库与词源来自 [ECDICT](https://github.com/skywind3000/ECDICT)（MIT）；复习算法 [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)（MIT）。
- **参考站点**：[LetMeEnglish](https://letmeenglish.com/zh-hans/)（板块组织与「日常表达」思路）、[OpenEtymology](https://github.com/openetymology/OpenEtymology)（词源单词本形式，数据未采用）。

## 📄 开发历程

- v2 设计规格：[docs/superpowers/specs/2026-10-06-english-quest-v2-etymology-design.md](docs/superpowers/specs/2026-10-06-english-quest-v2-etymology-design.md)
- v2 实施计划：[docs/superpowers/plans/2026-10-06-english-quest-v2.md](docs/superpowers/plans/2026-10-06-english-quest-v2.md)
- v1 设计（打字版，已改造）：[docs/superpowers/specs/2026-10-06-english-quest-design.md](docs/superpowers/specs/2026-10-06-english-quest-design.md)
