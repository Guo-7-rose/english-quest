import type { AppState } from "../types";
import { getChapter } from "../data/words";

export const LEVEL_TITLES: Record<number, string> = {
  1: "新手", 2: "学徒", 3: "入门者", 4: "进阶者", 5: "熟练者",
  6: "高手", 7: "专家", 8: "大师", 9: "传奇",
};

export function xpForWord(combo: number): number {
  const mult = combo >= 10 ? 1.5 : combo >= 3 ? 1.2 : 1;
  return Math.round(10 * mult);
}

export function xpNeededForLevel(level: number): number {
  return 100 + (level - 1) * 50;
}

export function addXp(state: AppState, amount: number): boolean {
  state.profile.xp += amount;
  let leveled = false;
  while (state.profile.xp >= xpNeededForLevel(state.profile.level)) {
    state.profile.xp -= xpNeededForLevel(state.profile.level);
    state.profile.level++;
    leveled = true;
  }
  return leveled;
}

export function starsForAccuracy(acc: number): 0 | 1 | 2 | 3 {
  if (acc >= 95) return 3;
  if (acc >= 80) return 2;
  if (acc >= 60) return 1;
  return 0;
}

export function nextChapterId(chapterId: string): string | null {
  const [stage, no] = chapterId.split("-").map(Number) as [number, number];
  if (!stage || !no) return null;
  const next = getChapter(`${stage}-${no + 1}`);
  return next ? next.id : null;
}

export function unlockNext(state: AppState, chapterId: string): void {
  const nid = nextChapterId(chapterId);
  if (!nid) return;
  const [stage] = nid.split("-").map(Number) as [number, number];
  const p = state.stageProgress[stage as 1 | 2 | 3 | 4];
  if (p[nid] && p[nid]!.state === "locked") p[nid]!.state = "open";
  else if (!p[nid]) p[nid] = { state: "open", stars: 0, bestAcc: 0, bestWpm: 0 };
}

export function completeChapter(state: AppState, chapterId: string, acc: number, wpm: number): void {
  const [stage] = chapterId.split("-").map(Number) as [number, number];
  const p = state.stageProgress[stage as 1 | 2 | 3 | 4];
  const cur = p[chapterId] ?? { state: "open", stars: 0, bestAcc: 0, bestWpm: 0 };
  const stars = Math.max(cur.stars, starsForAccuracy(acc));
  p[chapterId] = { state: "done", stars, bestAcc: Math.max(cur.bestAcc, acc), bestWpm: Math.max(cur.bestWpm, wpm) };
  unlockNext(state, chapterId);
}
