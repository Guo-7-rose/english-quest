import type { RootFamily, RootWordRef, StageId } from "../types";
import data from "./roots.json";
import { getStage } from "./words";

interface RawFamily {
  key: string; name: string; aliases: string[]; type: string;
  meaning: string; meaningZh: string; origin: string;
  words: { word: string; phonetic: string; meaning: string[] }[];
}

const RAW = (data as { families: RawFamily[] }).families;

function toType(t: string): RootFamily["type"] {
  return t === "prefix" ? "prefix" : t === "suffix" ? "suffix" : "root";
}

const FAMILIES: RootFamily[] = RAW.map(f => ({
  key: f.key,
  name: f.name,
  aliases: f.aliases ?? [],
  type: toType(f.type),
  meaning: f.meaning,
  meaningZh: f.meaningZh,
  origin: f.origin,
  words: f.words as RootWordRef[],
}));

// 单词 -> 家族 反向索引
const WORD_INDEX = new Map<string, RootFamily[]>();
for (const f of FAMILIES) {
  for (const w of f.words) {
    if (!WORD_INDEX.has(w.word)) WORD_INDEX.set(w.word, []);
    WORD_INDEX.get(w.word)!.push(f);
  }
}

export function allFamilies(): RootFamily[] { return FAMILIES; }

export function familiesByType(t: RootFamily["type"]): RootFamily[] {
  return FAMILIES.filter(f => f.type === t);
}

export function familyOfWord(word: string): RootFamily[] {
  return WORD_INDEX.get(word.toLowerCase()) ?? [];
}

export function hasRootFamily(word: string): boolean {
  return familyOfWord(word).some(f => f.type === "root");
}

export function getFamily(key: string): RootFamily | undefined {
  return FAMILIES.find(f => f.key === key || f.name === key);
}

/** 按「对词表的贡献度」排序（词表中出现的同族词越多越靠前） */
export function topFamilies(n: number): RootFamily[] {
  const bank = new Set<string>();
  for (const st of [1, 2, 3] as StageId[]) {
    for (const ch of getStage(st)) for (const w of ch.words) bank.add(w.id);
  }
  const scored = FAMILIES.map(f => ({
    f,
    hits: f.words.reduce((a, w) => a + (bank.has(w.word) ? 1 : 0), 0),
  }));
  scored.sort((a, b) => b.hits - a.hits || b.f.words.length - a.f.words.length);
  return scored.slice(0, n).map(s => s.f);
}

/** 家族在词表中的命中词（用于家族页展示「本词表相关」） */
export function familyBankWords(f: RootFamily): RootWordRef[] {
  const bank = new Set<string>();
  for (const st of [1, 2, 3] as StageId[]) {
    for (const ch of getStage(st)) for (const w of ch.words) bank.add(w.id);
  }
  return f.words.filter(w => bank.has(w.word));
}
