import { wordInfo, allBankWordIds } from "../data/words";
import { buildMnemonic } from "./mnemonic";
import { familyOfWord, allFamilies } from "../data/roots";

export type QuestionKind = "word2meaning" | "meaning2word" | "pickBreakdown" | "rootMeaning";

export interface SelfTestQuestion {
  kind: QuestionKind;
  prompt: string;
  options: string[];
  answer: number;
  explain: string;
  wordId: string;
}

const POOL_LIMIT = 400;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

function distractors(correct: string, pool: string[], n: number): string[] {
  const out: string[] = [];
  for (const c of shuffle(pool)) {
    if (c === correct || out.includes(c)) continue;
    out.push(c);
    if (out.length >= n) break;
  }
  return out;
}

function assemble(correct: string, wrongs: string[]): { options: string[]; answer: number } {
  const options = shuffle([correct, ...wrongs]);
  return { options, answer: options.indexOf(correct) };
}

const GLOSSES: string[] = (() => {
  const set = new Set<string>();
  for (const f of allFamilies()) {
    const g = f.meaningZh || f.meaning;
    if (g) set.add(g);
  }
  return [...set];
})();

const FORMULAS: string[] = (() => {
  const set = new Set<string>();
  for (const w of allBankWordIds()) {
    const f = buildMnemonic(w).formula;
    if (f) set.add(f);
  }
  return [...set];
})();

export function buildQuestions(words: string[], kinds: QuestionKind[], n: number): SelfTestQuestion[] {
  const known = words.filter(w => wordInfo(w));
  const globalPool = allBankWordIds().slice(0, POOL_LIMIT);
  const meaningPool = globalPool.map(w => wordInfo(w)?.meaning[0] ?? "").filter(Boolean);
  const formulaPool = FORMULAS;
  const out: SelfTestQuestion[] = [];

  let ki = 0;
  let guard = 0;
  while (out.length < n && guard < n * 8) {
    guard++;
    const kind = kinds[ki % kinds.length]!;
    ki++;
    let built: SelfTestQuestion | null = null;

    for (const word of shuffle(known)) {
      const info = wordInfo(word);
      if (!info) continue;
      if (kind === "word2meaning") {
        const correct = info.meaning[0] ?? "";
        if (!correct) continue;
        const wrongs = distractors(correct, meaningPool, 3);
        if (wrongs.length < 3) continue;
        const { options, answer } = assemble(correct, wrongs);
        built = { kind, prompt: `「${word}」是什么意思？`, options, answer, explain: `${word}：${info.meaning.join("；")}`, wordId: word };
      } else if (kind === "meaning2word") {
        const correct = word;
        const wrongs = distractors(correct, globalPool, 3);
        if (wrongs.length < 3) continue;
        const { options, answer } = assemble(correct, wrongs);
        built = { kind, prompt: `「${info.meaning[0]}」对应的单词是？`, options, answer, explain: `${word} = ${info.meaning[0]}`, wordId: word };
      } else if (kind === "pickBreakdown") {
        const m = buildMnemonic(word);
        if (!m.formula || m.layer === "mnemonic") continue;
        const wrongs = distractors(m.formula, formulaPool, 3);
        if (wrongs.length < 3) continue;
        const { options, answer } = assemble(m.formula, wrongs);
        built = { kind, prompt: `「${word}」的正确拆解是？`, options, answer, explain: `${m.formula} —— ${m.note}`, wordId: word };
      } else {
        const fams = familyOfWord(word);
        if (fams.length === 0) continue;
        const fam = fams[0]!;
        const correct = fam.meaningZh || fam.meaning;
        const wrongs = distractors(correct, GLOSSES, 3);
        if (wrongs.length < 3) continue;
        const { options, answer } = assemble(correct, wrongs);
        built = { kind, prompt: `词根/词缀「${fam.name}」的含义是？`, options, answer, explain: `${fam.name}${fam.origin ? "（" + fam.origin + "）" : ""}：${correct}`, wordId: word };
      }
      if (built) break;
    }
    if (built) out.push(built);
  }
  return out;
}

export function judge(q: SelfTestQuestion, choice: number): boolean {
  return q.answer === choice;
}
