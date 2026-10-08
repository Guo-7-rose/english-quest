// ECDICT wordroot.txt + ecdict.csv -> src/data/roots.json + src/data/common-stems.json
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const p = (f) => join(root, "..", "data-prep", f);
if (!existsSync(p("wordroot.txt")) || !existsSync(p("ecdict.csv"))) {
  console.error("缺少 data-prep/wordroot.txt 或 ecdict.csv");
  process.exit(1);
}

// 词根家族的中文义（按下发力的核心家族；缺失则回落英文义）
const ZH = {
  port: "搬运", un: "否定·不", re: "再·回", dis: "否定·分离", pre: "在前·预先", pro: "向前·支持", post: "在后",
  con: "共同·一起", com: "共同·一起", sub: "在下·次级", super: "超过·在上", trans: "穿过·转变", inter: "在…之间",
  ex: "向外·出", in: "进入·否定", im: "进入·否定", en: "使…成为", em: "使…成为", de: "向下·去除", anti: "反对",
  auto: "自己", bi: "二", co: "共同", contra: "相反", counter: "反对", extra: "超出", fore: "在前", hyper: "过度",
  mega: "巨大", micro: "微小", mid: "中间", mis: "错误", mono: "单一", multi: "多", non: "非", over: "过度·在上",
  poly: "多", semi: "半", tri: "三", ultra: "极端", under: "在下·不足", uni: "单一", out: "超出·向外", up: "向上",
  mit: "送·放出", miss: "送·放出", duc: "引导", duct: "引导", ject: "投掷", scrib: "写", script: "写", graph: "写·画",
  spect: "看", spec: "看", vis: "看", vid: "看", aud: "听", son: "声音", dict: "说", dic: "说", loqu: "说", log: "言·学科",
  man: "手", manu: "手", ped: "脚", pod: "脚", cap: "头·抓", capt: "抓", cept: "拿·取", cid: "切·落下", cis: "切",
  fac: "做", fact: "做", fect: "做", fic: "做", form: "形状", gen: "产生·种类", grad: "步·走", gress: "走", it: "走",
  mot: "移动", mov: "移动", mob: "移动", nat: "出生", nasc: "出生", par: "准备·显现", pel: "推", puls: "推",
  pend: "悬挂·称量", pens: "称量", pos: "放置", pon: "放置", press: "压", quir: "寻求", quest: "寻求", quisit: "寻求",
  rupt: "破", sect: "切", sent: "感觉", sens: "感觉", sequ: "跟随", secut: "跟随", sist: "站立", sta: "站立", stat: "站立",
  stit: "建立", struct: "建造", tain: "持有", ten: "持有", tent: "持有", tract: "拉", tra: "拉", tend: "伸展", tens: "伸展",
  vac: "空", ven: "来", vent: "来", vert: "转", vers: "转", volv: "滚·转", volut: "滚·转", vit: "生命", viv: "生命",
  bio: "生命", geo: "地球", therm: "热", phon: "声音", photo: "光", tele: "远", chron: "时间", cycl: "圆·循环",
  dem: "人民", polit: "城市·政治", nom: "法则·名字", nym: "名字", onym: "名字", path: "感情·疾病", phil: "爱",
  soph: "智慧", morph: "形状", meter: "测量", metr: "测量", scop: "观察", scop2: "观察", cred: "相信", fid: "信任",
  fer: "带来", lat: "带来", leg: "读·法", lect: "读·选", lig: "选·读", liter: "字母", lingu: "语言", memor: "记忆",
  ment: "心智", mind: "心智", anim: "生命·精神", corp: "身体", cord: "心", cardi: "心", derm: "皮肤", odont: "牙",
  neur: "神经", psych: "心理", socio: "社会", oeconom: "经济", numer: "数字", equ: "相等", norm: "规范", ver: "真实",
  jur: "法律·宣誓", jus: "法律", leg2: "法律", reg: "统治·规则", rect: "直·正", ten2: "保持",
  al: "与…有关的（形容词后缀）", ate: "使…·做（动词后缀）", ion: "动作·状态（名词后缀）", ance: "状态·性质（名词后缀）",
  ence: "状态·性质（名词后缀）", ant: "…的·…者", ent: "…的·…者", er: "…的人/物", or: "…的人/物", ar: "…的人/物",
  ful: "充满…的", less: "没有…的", ly: "以…方式（副词后缀）", ness: "性质·状态", ment: "行为·结果", ity: "性质·状态",
  ty: "性质·状态", able: "能够…的", ible: "能够…的", ive: "有…性质的", ous: "多…的·有…性质的", ish: "略…的·像…的",
  ist: "…主义者·…的人", ism: "主义·学说", ize: "使…化", ise: "使…化", ify: "使…化", ing: "动名词·进行",
  hood: "身份·状态", ship: "身份·关系", dom: "领域·状态", age: "行为·总称", ary: "与…有关的", ory: "与…有关的",
  ic: "…的", ical: "…的", some: "有…倾向的", ward: "朝…方向", wise: "在…方面", te: "使…", fy: "使…",
};

function parseCsvLine(l) {
  const r = []; let cur = "", q = false;
  for (const c of l) {
    if (c === '"') { q = !q; continue; }
    if (c === "," && !q) { r.push(cur); cur = ""; } else cur += c;
  }
  r.push(cur);
  return r;
}

// 1) 读词典：word -> {phonetic, meaning[], frq}
const dict = new Map();
const lines = readFileSync(p("ecdict.csv"), "utf8").split(/\r?\n/);
for (let i = 1; i < lines.length; i++) {
  const f = parseCsvLine(lines[i]);
  if (f.length < 12) continue;
  const w = (f[0] ?? "").toLowerCase();
  if (!/^[a-z]+$/.test(w)) continue;
  const trans = (f[3] ?? "").split("\\n").map(s => s.trim()).filter(Boolean)
    .filter(s => !s.startsWith("[网络]") && !s.startsWith("[医]") && !s.startsWith("[法]"));
  if (trans.length === 0) continue;
  const frq = Number(f[9] || 0);          // 注意：ECDICT 的 frq/bnc 是「排名」，越小越常用
  const oxford = f[6] ?? "";
  const prev = dict.get(w);
  const better = (a, b) => (a === 0 ? false : b === 0 ? true : a < b);   // 排名取更小者
  if (!prev || better(frq, prev.frq)) {
    dict.set(w, { phonetic: f[1] ?? "", meaning: trans.slice(0, 4).map(s => s.length > 40 ? s.slice(0, 40) : s), frq, oxford });
  }
}
console.log("词典词条:", dict.size);

// 2) 常用词干表（构词层守门用）：Oxford 3000 成员 或 词频排名前 5000
const stems = [...dict.entries()]
  .filter(([w, v]) => w.length >= 3 && (v.oxford === "1" || (v.frq >= 1 && v.frq <= 5000)))
  .map(([w]) => w);
writeFileSync(join(root, "..", "src", "data", "common-stems.json"), JSON.stringify(stems), "utf8");
console.log("常用词干:", stems.length);

// 3) 词根家族
const raw = JSON.parse(readFileSync(p("wordroot.txt"), "utf8"));
const typeOf = (cls) => cls === "prefix" ? "prefix" : String(cls).includes("suffix") ? "suffix" : "root";
const families = [];
for (const [key, v] of Object.entries(raw)) {
  const forms = String(key).split(",").map(s => s.trim().replace(/\d+$/, "").replace(/^-/, "").replace(/-$/, "").toLowerCase()).filter(Boolean);
  const name = forms[0] ?? String(key);
  const exWords = [...new Set((v.example ?? []).map(e => String(e).toLowerCase().trim()).filter(w => /^[a-z]+$/.test(w)))];
  const words = [];
  for (const w of exWords) {
    const d = dict.get(w);
    if (!d) continue;
    words.push({ word: w, phonetic: d.phonetic, meaning: d.meaning });
  }
  if (words.length === 0) continue;
  families.push({
    key, name, aliases: forms.slice(1), type: typeOf(v.class),
    meaning: String(v.meaning ?? "").trim(), meaningZh: ZH[name] ?? ZH[forms[1] ?? ""] ?? "",
    origin: String(v.origin ?? "").trim(), words,
  });
}
families.sort((a, b) => b.words.length - a.words.length);
writeFileSync(join(root, "..", "src", "data", "roots.json"), JSON.stringify({ families }), "utf8");
const withZh = families.filter(f => f.meaningZh).length;
console.log(`家族: ${families.length} | 有中文义: ${withZh} | 词引用总数: ${families.reduce((a, f) => a + f.words.length, 0)}`);
