import type { Chapter, StageId, Word } from "../types";
import { load, type DataKey } from "./store";

export interface WordFormQuestion { wordId: string; prompt: string; answer: string; kind: string; }

const STAGE_KEY: Record<1 | 2 | 3, DataKey> = { 1: "words1", 2: "words2", 3: "words3" };

const STAGES: Chapter[][] = [[], [], []];
const WORD_INFO = new Map<string, Word>();
const loadedStages = new Set<number>();

/** 按需加载考试词表（初中 / 高中 / 四级，各约 0.5-0.7MB） */
export async function ensureWords(stages: Array<1 | 2 | 3> = [1, 2, 3]): Promise<void> {
  const need = stages.filter(s => !loadedStages.has(s));
  await Promise.all(need.map(async (s) => {
    const data = await load<{ stage: number; chapters: Chapter[] }>(STAGE_KEY[s]);
    for (const ch of data.chapters) {
      const withId: Chapter = { ...ch, id: `${ch.stage}-${ch.no}` };
      STAGES[ch.stage - 1]!.push(withId);
      for (const w of withId.words) if (!WORD_INFO.has(w.word)) WORD_INFO.set(w.word, w);
    }
    STAGES[s - 1]!.sort((a, b) => a.no - b.no);
    loadedStages.add(s);
  }));
}

export function wordsReady(stages: Array<1 | 2 | 3> = [1, 2, 3]): boolean {
  return stages.every(s => loadedStages.has(s));
}

const KIND_KEYS: Array<[string, string, (w: Word, forms: string[]) => string]> = [
  ["s", "plural", (w) => `${w.word} 的复数形式是？`],
  ["d", "past", (w) => `${w.word} 的过去式是？`],
  ["i", "ing", (w) => `${w.word} 的现在分词是？`],
  ["3", "third", (w) => `${w.word} 的第三人称单数是？`],
  ["r", "comparative", (w) => `${w.word} 的比较级是？`],
  ["t", "superlative", (w) => `${w.word} 的最高级是？`],
];

export function getStage(stage: StageId): Chapter[] {
  return STAGES[stage - 1] ?? [];
}

export function getChapter(id: string): Chapter | undefined {
  for (const st of STAGES) for (const ch of st) if (ch.id === id) return ch;
  return undefined;
}

export function wordInfo(word: string): Word | undefined {
  return WORD_INFO.get(word.toLowerCase());
}

export function allBankWordIds(): string[] {
  return [...WORD_INFO.keys()];
}

export function genWordFormQuestions(word: Word): WordFormQuestion[] {
  const qs: WordFormQuestion[] = [];
  for (const [key, kind, promptFn] of KIND_KEYS) {
    const forms = word.exchange[key];
    if (forms && forms.length > 0) {
      qs.push({ wordId: word.id, prompt: promptFn(word, forms), answer: forms[0]!, kind });
    }
  }
  return qs;
}
