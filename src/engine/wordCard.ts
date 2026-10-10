/**
 * 卡片式背单词的编排引擎（纯逻辑，对齐墨墨背单词的四档自评语义）
 *
 * ✅ 认识  → 当天不再出现，间隔递增
 * 🤔 模糊  → 当天在本轮末尾再出现一次
 * ❌ 忘记  → 当天再出现两次（一次靠后、一次在队尾）
 * ⭐ 熟知  → 立即结业，永久不再安排复习
 */

export type Rating = "know" | "vague" | "forgot" | "mastered";

export interface CardItem {
  word: string;
}

export interface CardSession {
  queue: CardItem[];
  uniqueTotal: number;
  finished: string[];
  counts: Record<Rating, number>;
  /** 每个单词当天已出现次数（会话级，重排副本共享计数） */
  shown: Record<string, number>;
}

/** 同一词当天最多出现次数（防止死循环） */
export const MAX_SEEN_PER_DAY = 3;

/** 忘记的词：第一份插到「几张卡之后」，第二份放到队尾 */
const FORGOT_GAP = 5;

export function createSession(words: string[]): CardSession {
  const uniq: string[] = [];
  const seen = new Set<string>();
  for (const w of words) {
    const key = w.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(key);
  }
  return {
    queue: uniq.map(word => ({ word })),
    uniqueTotal: uniq.length,
    finished: [],
    counts: { know: 0, vague: 0, forgot: 0, mastered: 0 },
    shown: {},
  };
}

export function current(s: CardSession): CardItem | null {
  return s.queue[0] ?? null;
}

export function isFinished(s: CardSession): boolean {
  return s.queue.length === 0;
}

export function progress(s: CardSession): { done: number; total: number } {
  return { done: s.finished.length, total: s.uniqueTotal };
}

/** 处理一次自评，返回本次重排了几份 */
export function rate(s: CardSession, rating: Rating, maxSeen: number = MAX_SEEN_PER_DAY): { requeued: number } {
  const item = s.queue.shift();
  if (!item) return { requeued: 0 };
  const shown = (s.shown[item.word] ?? 0) + 1;
  s.shown[item.word] = shown;
  s.counts[rating]++;

  const finish = () => { if (!s.finished.includes(item.word)) s.finished.push(item.word); };
  // 上限是对「当天总出现次数」的限制：已出现 + 队列里还在排队的副本
  const queued = s.queue.filter(i => i.word === item.word).length;
  const budget = Math.max(0, maxSeen - (shown + queued));
  let requeued = 0;

  if (rating === "know" || rating === "mastered") {
    finish();
  } else if (rating === "vague") {
    if (budget >= 1) {
      s.queue.push({ word: item.word });
      requeued = 1;
    } else {
      finish();
    }
  } else {
    const copies = Math.min(budget, 2);
    if (copies >= 2) {
      s.queue.splice(Math.min(FORGOT_GAP, s.queue.length), 0, { word: item.word });
      s.queue.push({ word: item.word });
      requeued = 2;
    } else if (copies === 1) {
      s.queue.push({ word: item.word });
      requeued = 1;
    } else {
      finish();
    }
  }
  return { requeued };
}

/**
 * 动态建议新词量（学墨墨：不设固定新学量，复习多就少学新词）
 * 目的：避免以后每天的复习量滚雪球。
 */
export function suggestNewCount(dueCount: number): number {
  if (dueCount <= 5) return 30;
  if (dueCount <= 15) return 20;
  if (dueCount <= 30) return 10;
  return 5;
}

/** 从词表里挑「还没学过」的词作为新词（优先未出现在 wordStats 中的） */
export function pickNewWords(all: string[], learned: Set<string>, n: number): string[] {
  const fresh = all.filter(w => !learned.has(w.toLowerCase()));
  const pool = fresh.length >= n ? fresh : [...fresh, ...all.filter(w => learned.has(w.toLowerCase()))];
  return pool.slice(0, n);
}
