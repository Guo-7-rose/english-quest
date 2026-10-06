import type { Word } from "../types";

export interface TypingStats { startedAt: number; total: number; errors: number; combo: number; maxCombo: number; }
export type SubmitResult = { ok: boolean; word: Word; revealed: boolean };

export interface TypingSession {
  words: Word[];
  stats: TypingStats;
  index: number;
  typed: string;
  wordErrors: number;
  input(ch: string): void;
  submit(): SubmitResult;
  skip(): void;
  readonly current: Word | null;
  readonly done: boolean;
  accuracy(): number;
  wpm(now?: number): number;
  elapsed(now?: number): number;
  wordResult: (boolean | null)[];
}

export function createSession(words: Word[], startedAt: number = Date.now()): TypingSession {
  const stats: TypingStats = { startedAt, total: 0, errors: 0, combo: 0, maxCombo: 0 };
  const wordResult: (boolean | null)[] = words.map(() => null);
  const s: TypingSession = {
    words, stats, index: 0, typed: "", wordErrors: 0, wordResult,
    get current() { return s.words[s.index] ?? null; },
    get done() { return s.index >= s.words.length; },
    input(ch: string) {
      if (s.done || !s.current) return;
      if (/^[a-zA-Z]$/.test(ch) && s.typed.length < s.current.word.length) s.typed += ch.toLowerCase();
    },
    submit(): SubmitResult {
      if (s.done || !s.current) return { ok: false, word: s.current!, revealed: true };
      const word = s.current;
      if (s.typed === word.word) {
        s.stats.total++; s.stats.combo++; s.stats.maxCombo = Math.max(s.stats.maxCombo, s.stats.combo);
        s.wordResult[s.index] = true; s.wordErrors = 0; s.typed = ""; s.index++;
        return { ok: true, word, revealed: false };
      }
      s.wordErrors++; s.stats.errors++; s.stats.combo = 0;
      s.wordResult[s.index] = false;
      if (s.wordErrors >= 3) { s.typed = ""; s.wordErrors = 0; s.index++; return { ok: false, word, revealed: true }; }
      s.typed = "";
      return { ok: false, word, revealed: false };
    },
    skip() { if (!s.done) { s.wordResult[s.index] = null; s.index++; s.typed = ""; s.wordErrors = 0; } },
    accuracy() {
      const all = s.stats.total + s.stats.errors;
      return all === 0 ? 100 : Math.round((s.stats.total / all) * 100);
    },
    wpm(now: number = Date.now()) {
      const min = s.elapsed(now) / 60;
      return min > 0 ? Math.round(s.stats.total / min) : 0;
    },
    elapsed(now: number = Date.now()) { return (now - s.stats.startedAt) / 1000; },
  };
  return s;
}
