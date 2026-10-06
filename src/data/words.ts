import type { Chapter, StageId, Word } from "../types";
import stage1 from "./words-stage1.json";

export interface WordFormQuestion { wordId: string; prompt: string; answer: string; kind: string; }

const RAW: unknown[] = [stage1];

const KIND_KEYS: Array<[string, string, (w: Word, forms: string[]) => string]> = [
  ["s", "plural", (w) => `${w.word} 的复数形式是？`],
  ["d", "past", (w) => `${w.word} 的过去式是？`],
  ["i", "ing", (w) => `${w.word} 的现在分词是？`],
  ["3", "third", (w) => `${w.word} 的第三人称单数是？`],
  ["r", "comparative", (w) => `${w.word} 的比较级是？`],
  ["t", "superlative", (w) => `${w.word} 的最高级是？`],
];

function buildStages(): Chapter[][] {
  const stages: Chapter[][] = [[], [], [], []];
  for (const entry of RAW) {
    const d = (entry as { stage: number; chapters: Chapter[] });
    for (const ch of d.chapters) stages[ch.stage - 1]!.push({ ...ch, id: `${ch.stage}-${ch.no}` });
  }
  return stages;
}

export const ALL_STAGES: Chapter[][] = buildStages();

export function getStage(stage: StageId): Chapter[] {
  return ALL_STAGES[stage - 1] ?? [];
}

export function getChapter(id: string): Chapter | undefined {
  for (const st of ALL_STAGES) for (const ch of st) if (ch.id === id) return ch;
  return undefined;
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
