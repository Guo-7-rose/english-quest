import type { RootFamily, RootWordRef } from "../types";
import { load } from "./store";

interface RawFamily {
  key: string; name: string; aliases: string[]; type: string;
  meaning: string; meaningZh: string; origin: string;
  words: { word: string; phonetic: string; meaning: string[] }[];
}

let FAMILIES: RootFamily[] = [];
let WORD_INDEX = new Map<string, RootFamily[]>();
let ready = false;

function toType(t: string): RootFamily["type"] {
  return t === "prefix" ? "prefix" : t === "suffix" ? "suffix" : "root";
}

function build(families: RootFamily[]): void {
  FAMILIES = families;
  WORD_INDEX = new Map<string, RootFamily[]>();
  for (const f of FAMILIES) {
    for (const w of f.words) {
      if (!WORD_INDEX.has(w.word)) WORD_INDEX.set(w.word, []);
      WORD_INDEX.get(w.word)!.push(f);
    }
  }
  ready = true;
}

/** 按需加载词源家族数据（约 1MB；进入词根库或背单词时加载） */
export async function ensureRoots(): Promise<void> {
  if (ready) return;
  const data = await load<{ families: RawFamily[] }>("roots");
  build(data.families.map(f => ({
    key: f.key,
    name: f.name,
    aliases: f.aliases ?? [],
    type: toType(f.type),
    meaning: f.meaning,
    meaningZh: f.meaningZh,
    origin: f.origin,
    words: f.words as RootWordRef[],
  })));
}

export function rootsReady(): boolean { return ready; }

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

/** 按「对词表的贡献度」排序（传入词表集合；不传则按同族词数量） */
export function topFamilies(n: number, bank?: Set<string>): RootFamily[] {
  const scored = FAMILIES.map(f => ({
    f,
    hits: bank && bank.size > 0
      ? f.words.reduce((a, w) => a + (bank.has(w.word) ? 1 : 0), 0)
      : f.words.length,
  }));
  scored.sort((a, b) => b.hits - a.hits || b.f.words.length - a.f.words.length);
  return scored.slice(0, n).map(s => s.f);
}

/** 家族中属于给定词表的词 */
export function familyBankWords(f: RootFamily, bank: Set<string>): RootWordRef[] {
  return f.words.filter(w => bank.has(w.word));
}
