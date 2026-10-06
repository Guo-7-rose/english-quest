import type { AppState, GrammarQuestion, StageId } from "../types";
import { getStage, genWordFormQuestions, type WordFormQuestion } from "../data/words";
import { getGrammarStage } from "../data/grammar";

export interface StageQuiz {
  wordQs: Array<{ prompt: string; answer: string; kind: string }>;
  grammarQs: GrammarQuestion[];
}

function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy.slice(0, n);
}

export function buildStageQuiz(state: AppState, stage: StageId): StageQuiz {
  const words = getStage(stage).flatMap(c => c.words);
  const spellingQs = sample(words, 15).map(w => ({
    prompt: `请拼写单词：${w.meaning.join("；")}`,
    answer: w.word,
    kind: "spelling",
  }));
  const formPool: WordFormQuestion[] = [];
  for (const w of sample(words, 60)) formPool.push(...genWordFormQuestions(w));
  const formQs = sample(formPool, 5).map(q => ({ prompt: q.prompt, answer: q.answer, kind: q.kind }));
  const grammarPool = getGrammarStage(stage).flatMap(u => u.questions);
  const grammarQs = sample(grammarPool, 10);
  return { wordQs: [...spellingQs, ...formQs].slice(0, 20), grammarQs };
}

export function evaluateStageQuiz(state: AppState, stage: StageId, result: { score: number }): { passed: boolean; score: number } {
  const passed = result.score >= 80;
  if (passed && stage < 4) {
    const nextStage = (stage + 1) as StageId;
    const p = state.stageProgress[nextStage];
    const id = `${nextStage}-1`;
    if (!p[id]) p[id] = { state: "open", stars: 0, bestAcc: 0, bestWpm: 0 };
    else if (p[id]!.state === "locked") p[id]!.state = "open";
  }
  return { passed, score: result.score };
}
