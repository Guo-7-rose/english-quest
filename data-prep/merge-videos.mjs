// 合并 data-prep/videos-batch2.json 到 src/data/videos.json（按 id 去重，补主题与要点）
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(readFileSync(p, "utf8").replace(/^\uFEFF/, ""));
const target = join(root, "..", "src", "data", "videos.json");
const batch = read(join(root, "..", "data-prep", "videos-batch2.json"));
const current = read(target);

const TOPIC_MAP = {
  "英语 被动语态 讲解": "被动语态",
  "英语 非谓语动词 讲解": "非谓语",
  "英语 虚拟语气 讲解": "虚拟语气",
  "英语 倒装句 讲解": "倒装",
  "英语 主谓一致 讲解": "主谓一致",
  "英语 宾语从句 讲解": "从句",
  "英语 状语从句 讲解": "从句",
  "英语 名词性从句 讲解": "从句",
};

const NOTES = {
  "被动语态": "重点：什么时候该用被动（不知道谁做的 / 不必说谁做的 / 强调受事），别把它当成「中文被字句的翻译」。",
  "非谓语": "不定式 / 动名词 / 分词的选择逻辑：看它在句中充当什么成分、和主语的主动被动关系。",
  "虚拟语气": "核心是「与事实相反的假设」用过去形式表达，理解这点就不用背表格。",
  "倒装": "倒装是为了强调或符合特定句式（否定词提前、only 开头等），不是随意换语序。",
  "主谓一致": "英语要求谓语与主语在数上一致，难点在「主语很长 / 有插入语 / 集合名词」这些情况。",
  "从句": "先分清从句在句中作什么成分（主语/宾语/表语/定语/状语），再选连接词。",
};

const merged = [...current.videos];
const added = [];
const seen = new Set(merged.map(v => v.id));
for (const b of batch) {
  if (seen.has(b.id)) continue;
  seen.add(b.id);
  const topic = TOPIC_MAP[b.topic] ?? "语法综合";
  merged.push({
    id: b.id,
    title: b.title,
    channel: b.channel ?? "",
    topics: [topic],
    note: NOTES[topic] ?? "",
  });
  added.push(`${topic} | ${b.channel} | ${b.title.slice(0, 28)}`);
}

writeFileSync(target, JSON.stringify({ videos: merged }, null, 1), "utf8");
console.log(`视频总数: ${merged.length}（新增 ${added.length}）`);
for (const a of added) console.log("  + " + a);
const topics = new Set();
for (const v of merged) for (const t of v.topics) topics.add(t);
console.log("主题数:", topics.size, "→", [...topics].join(" / "));
