import type { AppState } from "../types";
import { scheduleReview, dueReviews } from "./review";

/** 标记「✅ 记住了」→ FSRS Good(3) */
export function markRemembered(state: AppState, word: string, now: Date = new Date()): void {
  scheduleReview(state, word.toLowerCase(), 3, now);
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
