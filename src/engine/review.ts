import { createEmptyCard, generatorParameters, fsrs, type Card, type Grade } from "ts-fsrs";
import type { AppState, WordStats } from "../types";

let f = fsrs(generatorParameters());

export function initFsrs(): void { f = fsrs(generatorParameters()); }

export function scheduleReview(state: AppState, wordId: string, grade: 1 | 2 | 3 | 4, now: Date = new Date()): void {
  const st: WordStats = state.wordStats[wordId] ?? { correct: 0, wrong: 0, lastSeen: 0, fsrs: null, inReview: true };
  let card: Card;
  if (st.fsrs) {
    card = {
      due: new Date(st.fsrs.due),
      stability: st.fsrs.stability,
      difficulty: st.fsrs.difficulty,
      state: st.fsrs.state as Card["state"],
      elapsed_days: 0,
      scheduled_days: 0,
      learning_steps: 0,
      reps: 0,
      lapses: 0,
      last_review: new Date(st.lastSeen || now.getTime()),
    };
  } else {
    card = createEmptyCard(now);
  }
  const r = f.next(card, now, grade as Grade);
  st.fsrs = { due: r.card.due.toISOString(), stability: r.card.stability, difficulty: r.card.difficulty, state: r.card.state };
  st.lastSeen = now.getTime();
  st.inReview = r.card.state !== 2 || r.card.due > now; // Review 状态且未到期才退出队列
  if (grade >= 3) st.correct++; else st.wrong++;
  state.wordStats[wordId] = st;
}

export function isDue(ws: WordStats, now: Date = new Date()): boolean {
  return !!ws.fsrs && new Date(ws.fsrs.due).getTime() <= now.getTime();
}

export function dueReviews(state: AppState, now: Date = new Date()): string[] {
  return Object.entries(state.wordStats)
    .filter(([, ws]) => ws.inReview && isDue(ws, now))
    .map(([id]) => id);
}
