import type { AppState } from "../types";
import { scheduleReview, dueReviews } from "./review";

/** 标记「✅ 记住了」→ FSRS Good(3) */
export function markRemembered(state: AppState, word: string, now: Date = new Date()): void {
  scheduleReview(state, word.toLowerCase(), 3, now);
}

/** 标记「🤔 模糊」→ FSRS Hard(2)，短期再现但比「忘记」轻 */
export function markVague(state: AppState, word: string, now: Date = new Date()): void {
  scheduleReview(state, word.toLowerCase(), 2, now);
}

/** 标记「⭐ 熟知」→ 永久移出复习队列（仍保留在已学列表） */
export function markMastered(state: AppState, word: string): void {
  const id = word.toLowerCase();
  const st = state.wordStats[id] ?? { correct: 0, wrong: 0, lastSeen: 0, fsrs: null, inReview: false };
  st.mastered = true;
  st.fsrs = null;
  st.inReview = false;
  st.lastSeen = Date.now();
  if (st.correct === 0) st.correct = 1;   // 计入「已学」
  state.wordStats[id] = st;
}

/** 标记「🔁 需复习」→ FSRS Again(1)，留在队列里 */
export function markNeedReview(state: AppState, word: string, now: Date = new Date()): void {
  scheduleReview(state, word.toLowerCase(), 1, now);
}

/** 到期复习词 */
export function dueWords(state: AppState, now: Date = new Date()): string[] {
  return dueReviews(state, now);
}

/** 已学（至少答对一次）词数 */
export function learnedCount(state: AppState): number {
  return Object.values(state.wordStats).filter(s => s.correct > 0).length;
}
