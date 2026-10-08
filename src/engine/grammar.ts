import type { AppState, GrammarUnitV2 } from "../types";

export function judgeGrammarAnswer(unit: GrammarUnitV2, index: number, choice: number): boolean {
  return unit.questions[index]?.answer === choice;
}

/** 记录练习结果（score 为 0-100） */
export function recordGrammarResult(state: AppState, unitId: string, score: number): void {
  state.grammar[unitId] = { done: true, score, answers: [] };
}
