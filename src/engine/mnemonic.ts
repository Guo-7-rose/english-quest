import { familyOfWord, hasRootFamily } from "../data/roots";
import type { RootFamily } from "../types";
import commonStems from "../data/common-stems.json";
import extras from "../data/mnemonics-extra.json";
import wordEn from "../data/word-en.json";

export type MnemonicLayer = "etymology" | "construction" | "mnemonic";

export interface MnemonicPart { text: string; gloss: string; }

export interface Mnemonic {
  word: string;
  layer: MnemonicLayer;
  formula: string;
  note: string;
  parts: MnemonicPart[];
}

// 能产前缀白名单：只有这些前缀参与「构词」判定，避免 advice=ad+vice 之类的假词源
const PRODUCTIVE_PREFIXES = [
  "un", "re", "dis", "pre", "post", "non", "anti", "over", "under", "mis", "out",
  "sub", "super", "semi", "inter", "trans", "co", "de", "en", "em", "fore", "mid",
  "multi", "auto", "bi", "extra", "hyper", "mega", "micro", "mono", "neo", "pan",
  "poly", "self", "tri", "ultra", "uni", "im", "in", "il", "ir", "up", "counter", "contra",
].sort((a, b) => b.length - a.length);

// 能产后缀白名单（名词/形容词/副词/动词化后缀）
const PRODUCTIVE_SUFFIXES = [
  "ation", "ition", "ment", "ness", "less", "able", "ible", "ally", "ical", "ance", "ence",
  "ship", "hood", "ward", "wise", "some", "ful", "ous", "ive", "ity", "ify", "ize", "ise",
  "ist", "ism", "age", "ary", "ory", "ant", "ent", "est", "ing", "ly", "er", "or", "al",
  "ic", "ty", "en", "ed",
].sort((a, b) => b.length - a.length);

const STEMS = new Set(commonStems as string[]);
const EXTRAS = extras as Record<string, { formula?: string; note: string }>;
const WORD_EN = wordEn as Record<string, { def: string; syl: string }>;

const glossOf = (f: RootFamily): string => f.meaningZh || f.meaning;

/** 词源层：用家族数据拼出「前缀(义) + 词根(义) + 后缀(义)」 */
function etymologyOf(word: string): Mnemonic | null {
  const fams = familyOfWord(word);
  if (fams.length === 0) return null;
  const pick = (t: RootFamily["type"]) =>
    fams.filter(f => f.type === t).sort((a, b) => b.name.length - a.name.length);
  const prefixes = pick("prefix").slice(0, 1);
  const roots = pick("root").slice(0, 1);
  const suffixes = pick("suffix").slice(0, 1);
  if (prefixes.length === 0 && roots.length === 0 && suffixes.length === 0) return null;

  const parts: MnemonicPart[] = [
    ...prefixes.map(f => ({ text: `${f.name}-`, gloss: glossOf(f) })),
    ...roots.map(f => ({ text: f.name, gloss: glossOf(f) })),
    ...suffixes.map(f => ({ text: `-${f.name}`, gloss: glossOf(f) })),
  ];
  const formula = parts.map(p => `${p.text}(${p.gloss})`).join(" + ");
  const origin = [...new Set([...prefixes, ...roots, ...suffixes].map(f => f.origin).filter(Boolean))].join(" / ");
  const note = origin ? `词源来自${origin}` : "词源拆解";
  return { word, layer: "etymology", formula, note, parts };
}

/** 构词层：能产前后缀 + 完整常用词干（词干必须在常用词表内） */
function constructionOf(word: string): Mnemonic | null {
  for (const p of PRODUCTIVE_PREFIXES) {
    if (word.startsWith(p)) {
      const stem = word.slice(p.length);
      if (stem.length >= 3 && STEMS.has(stem)) {
        const parts: MnemonicPart[] = [
          { text: `${p}-`, gloss: "前缀" },
          { text: stem, gloss: "常用词" },
        ];
        return { word, layer: "construction", formula: `${p}- + ${stem}`, note: "构词记忆（前缀 + 常用词）", parts };
      }
    }
  }
  for (const s of PRODUCTIVE_SUFFIXES) {
    if (word.endsWith(s)) {
      const stem = word.slice(0, word.length - s.length);
      if (stem.length >= 3 && STEMS.has(stem)) {
        const parts: MnemonicPart[] = [
          { text: stem, gloss: "常用词" },
          { text: `-${s}`, gloss: "后缀" },
        ];
        return { word, layer: "construction", formula: `${stem} + -${s}`, note: "构词记忆（常用词 + 后缀）", parts };
      }
    }
  }
  return null;
}

/** 助记层：预置助记（联想/搭配）+ 音节分块 + 英文释义，不编造词源 */
function mnemonicLayer(word: string): Mnemonic {
  const extra = EXTRAS[word];
  const en = WORD_EN[word];
  const chunks = en?.syl ? en.syl.split("-").filter(Boolean) : [];
  const sylFormula = chunks.length >= 2 ? chunks.join(" · ") : "";
  const notes: string[] = [];
  if (extra?.note) notes.push("💡 " + extra.note);
  if (en?.def) notes.push(`英文释义：${en.def}`);
  notes.push(chunks.length >= 2
    ? `记忆法：按音节分块朗读（${chunks.length} 块），再用它造一个自己的句子`
    : "记忆法：结合例句与搭配记忆（本词无可靠词源拆解）");
  return {
    word,
    layer: "mnemonic",
    formula: extra?.formula || sylFormula,
    note: notes.join("　｜　"),
    parts: [],
  };
}

export function buildMnemonic(word: string): Mnemonic {
  const w = word.toLowerCase();
  // 规则 1：含词根家族 → 词源层（import = im- + port）
  if (hasRootFamily(w)) {
    const ety = etymologyOf(w);
    if (ety) return ety;
  }
  // 规则 2：能产前后缀 + 完整常用词干 → 构词层（unhappy = un- + happy）
  const con = constructionOf(w);
  if (con) return con;
  // 规则 3：仅有前缀/词根家族（不含「纯后缀」匹配，如 hospital 的 -al）时也用词源数据
  const fams = familyOfWord(w);
  if (fams.some(f => f.type === "root" || f.type === "prefix")) {
    const ety = etymologyOf(w);
    if (ety) return ety;
  }
  // 规则 4：助记层
  return mnemonicLayer(w);
}

export function mnemonicOf(word: string): Mnemonic | undefined {
  const w = word.toLowerCase();
  const known = familyOfWord(w).length > 0 || constructionOf(w) !== null || EXTRAS[w] !== undefined;
  if (!known) return undefined;
  return buildMnemonic(w);
}
