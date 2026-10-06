import type { AppState, GrammarUnit } from "../types";

export function judgeGrammar(unit: GrammarUnit, index: number, choice: number): boolean {
  return unit.questions[index]?.answer === choice;
}

export function recordGrammarAnswer(state: AppState, unitId: string, index: number, choice: number): void {
  const p = state.grammar[unitId] ?? { done: false, score: 0, answers: [] };
  p.answers[index] = choice;
  state.grammar[unitId] = p;
}

export function finishGrammarUnit(state: AppState, unitId: string, unit: GrammarUnit): void {
  const p = state.grammar[unitId] ?? { done: false, score: 0, answers: [] };
  const correct = unit.questions.filter((q, i) => p.answers[i] === q.answer).length;
  p.done = true;
  p.score = Math.round((correct / unit.questions.length) * 100);
  state.grammar[unitId] = p;
}
