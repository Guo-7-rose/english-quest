import type { AppState, Word } from "../types";
import { getChapter, getStage } from "../data/words";
import { dueReviews } from "./review";

export function buildDailySession(state: AppState, chapterId: string, now: Date = new Date()): { words: Word[]; tags: ("new" | "review")[] } {
  const ch = getChapter(chapterId);
  const words: Word[] = ch ? [...ch.words] : [];
  const tags: ("new" | "review")[] = words.map(() => "new");
  const due = dueReviews(state, now).slice(0, 10);
  for (const id of due) {
    const w = findWord(id);
    if (w && !words.some(x => x.id === id)) { words.push(w); tags.push("review"); }
  }
  return { words, tags };
}

function findWord(id: string): Word | undefined {
  for (const st of [getStage(1), getStage(2), getStage(3), getStage(4)]) {
    for (const ch of st) for (const w of ch.words) if (w.id === id) return w;
  }
  return undefined;
}
