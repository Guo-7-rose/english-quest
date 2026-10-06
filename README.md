# 英语闯关岛 English Quest 🏝️

游戏化英语学习网站：**打字 + 背单词 + 语法训练 + 每日打卡**，风格参考打字鸭 / Qwerty Learner / Monkeytype / Duolingo。

## 🚀 使用（零安装）

**直接双击 `dist/index.html`**（或拖进浏览器）即可开始使用。

- 无需服务器、无需联网、无任何外部请求，纯离线可用
- 学习进度自动保存在浏览器 localStorage（清理浏览器数据会重置进度）
- 若自己重新构建：`npm.cmd install && npm.cmd run build`

## 🎮 玩法

| 模块 | 说明 |
|---|---|
| ⌨️ 单词训练 | 看释义盲打英文单词，**三种模式**：默写（默认）/ 听写（发音）/ 跟打；打错需重打，连错 3 次显示答案并进复习队列 |
| 🗺️ 闯关地图 | 四阶段「基础→进阶→高手→大师」约 2 万词，按词频排序闯关；正确率 60/80/95% 评 1-3 星，全部通关解锁🎓阶段测验（80 分进入下一阶段） |
| 📖 语法训练 | 阶段一 10 单元（be 动词/复数/时态/疑问句/there be…）：知识卡片 + 选择题，答对 +5 XP |
| ✅ 每日打卡 | 背满 30 词 或 学 2 个语法单元自动打卡；🔥连续天数、热力图、冻结卡补签 |
| 📊 数据中心 | WPM/正确率统计、成就墙、错题本 |
| ⚙️ 设置 | 音效/发音/释义开关、每日目标三档、主题解锁（通关解锁新配色）、数据重置 |

**正反馈系统**：连击火焰（x3 变色、x5/10/20/50 彩带里程碑）、XP/等级（连击加成 ×1.2/×1.5）、升级全屏庆祝、成就徽章、WebAudio 合成音效（零音频文件）。

## 📁 项目结构

```
index.html                  # SPA 壳
src/
├── main.ts                 # 启动/路由/顶栏
├── types.ts                # 共享类型
├── engine/                 # 纯逻辑（typing/progress/streak/review/grammar/quiz/daily）
├── data/                   # 词库 JSON（ECDICT 生成）+ 语法题库 + 成就定义
├── views/                  # home/map/typing/grammar/stats/settings/quiz
├── fx/                     # WebAudio 音效 + 粒子/彩带
├── store/storage.ts        # localStorage + schema 迁移
└── styles/                 # 卡通设计系统
scripts/build-words.mjs     # ECDICT → 四阶段词库生成器
tests/                      # 49 个单元 + 集成测试（Vitest + jsdom）
```

## 🔁 更新词库

```bash
# 1. 下载 ECDICT（MIT 许可）到 data-prep/ecdict.csv
#    https://github.com/skywind3000/ECDICT
# 2. 重新生成词库
node scripts/build-words.mjs
# 3. 构建
npm.cmd run build
```

## 🧪 开发与测试

```bash
npm.cmd install        # 安装依赖（Node 24 / npm 11）
npm.cmd test           # 49 个测试（单元 + jsdom 端到端集成）
npm.cmd run dev        # 开发服务器
npm.cmd run build      # 产出单文件 dist/index.html
```

## 📄 许可

- **词库数据**：源自 [ECDICT](https://github.com/skywind3000/ECDICT)（MIT）
- **复习算法**：[ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)（MIT）
- **代码**：本项目自有；GPL/AGPL 项目仅作设计参考，未复制其代码与数据

## 🗺️ 开发历程文档

- 设计文档：[docs/superpowers/specs/2026-10-06-english-quest-design.md](docs/superpowers/specs/2026-10-06-english-quest-design.md)
- 实施计划：[docs/superpowers/plans/2026-10-06-english-quest.md](docs/superpowers/plans/2026-10-06-english-quest.md)
- GitHub 调研：[english-typing-gamification-research.md](english-typing-gamification-research.md)
