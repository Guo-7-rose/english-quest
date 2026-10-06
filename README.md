# 英语闯关岛 English Quest（筹备中）

游戏化英语学习网站：打字 + 背单词 + 语法训练 + 每日打卡，风格参考打字鸭 / Qwerty Learner / Monkeytype / Duolingo。

> 当前状态：**设计阶段完成，等待评审批准后开工**
> 审批人：你（打开下面两样东西，看一眼，说「开工」即可）

## 评审入口

| 产物 | 文件 | 怎么用 |
|---|---|---|
| 🎮 **可视化样版** | [prototype.html](prototype.html) | 双击打开即可玩（或 http://127.0.0.1:8899/prototype.html ） |
| 📐 **设计文档** | [docs/superpowers/specs/2026-10-06-english-quest-design.md](docs/superpowers/specs/2026-10-06-english-quest-design.md) | 重点看第 6 节游戏化机制、第 7 节四阶段路线、第 10 节里程碑 |
| 🔍 **调研报告** | [english-typing-gamification-research.md](english-typing-gamification-research.md) | GitHub 40+ 仓库核实报告 |

## 一句话方案

- **核心玩法**：看中文释义/音标 → 盲打英文单词（三阶递进：跟打 → 默写 → 听写）
- **成长路线**：基础（小初 1200 词）→ 进阶（高中 3500）→ 高手（四级 2000）→ 大师（雅思托福 3000），词汇 + 语法双轨闯关
- **正反馈**：连击火焰、XP/等级、每日打卡🔥、星级、成就徽章、粒子彩带、合成音效
- **技术**：Vite + TypeScript，产物为单文件 index.html，双击即开，数据存本地，纯离线

## 已完成的准备

- ✅ 浏览器实地调研：打字鸭、Qwerty Learner、Monkeytype、Duolingo
- ✅ GitHub 40+ 仓库调研（许可证全部核实，只用 MIT/Apache/BSD）
- ✅ ECDICT 词库下载并实测（77 万词条；zk 1603 / gk 3679 / cet4 3849 / ielts 5040 / toefl 6974）
- ✅ 样版原型在真实浏览器中验证通过（打卡、打字引擎、连击、XP 全链路）
- ✅ 设计文档定稿 + 自审 + git 提交

## 下一步（等你批准）

`批准 → 实施计划（writing-plans）→ M1~M6 开发 → 交付 dist/index.html`
