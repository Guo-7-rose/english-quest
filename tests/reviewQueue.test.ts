import { describe, it, expect } from "vitest";
import { markRemembered, markNeedReview, markVague, markMastered, dueWords, learnedCount } from "../src/engine/reviewQueue";
import { defaultState } from "../src/store/storage";

const NOW = new Date("2026-01-01T12:00:00");

describe("复习队列引擎", () => {
  it("标记「记住了」写入 FSRS 卡片且到期日在未来", () => {
    const s = defaultState();
    markRemembered(s, "help", NOW);
    const st = s.wordStats["help"]!;
    expect(st.fsrs).not.toBeNull();
    expect(new Date(st.fsrs!.due).getTime()).toBeGreaterThan(NOW.getTime());
    expect(st.correct).toBe(1);
  });

  it("标记「需复习」进入队列并记录错误", () => {
    const s = defaultState();
    markNeedReview(s, "juice", NOW);
    const st = s.wordStats["juice"]!;
    expect(st.inReview).toBe(true);
    expect(st.wrong).toBe(1);
  });

  it("到期词出现在队列中", () => {
    const s = defaultState();
    markNeedReview(s, "juice", NOW);
    const later = new Date(NOW.getTime() + 30 * 86400000);
    expect(dueWords(s, later)).toContain("juice");
    expect(dueWords(s, NOW)).not.toContain("juice");
  });

  it("已学词计数", () => {
    const s = defaultState();
    markRemembered(s, "help", NOW);
    markRemembered(s, "water", NOW);
    expect(learnedCount(s)).toBe(2);
  });

  it("模糊：进入队列，间隔不短于「忘记」", () => {
    const s1 = defaultState();
    markVague(s1, "umbrella", NOW);
    const s2 = defaultState();
    markNeedReview(s2, "umbrella", NOW);
    const dueVague = new Date(s1.wordStats["umbrella"]!.fsrs!.due).getTime();
    const dueForgot = new Date(s2.wordStats["umbrella"]!.fsrs!.due).getTime();
    expect(s1.wordStats["umbrella"]!.inReview).toBe(true);
    expect(dueVague).toBeGreaterThanOrEqual(dueForgot);
  });

  it("熟知：永久移出复习队列，但仍算已学", () => {
    const s = defaultState();
    markNeedReview(s, "bicycle", NOW);
    markMastered(s, "bicycle");
    expect(s.wordStats["bicycle"]!.mastered).toBe(true);
    expect(s.wordStats["bicycle"]!.inReview).toBe(false);
    expect(s.wordStats["bicycle"]!.fsrs).toBeNull();
    const later = new Date(NOW.getTime() + 365 * 86400000);
    expect(dueWords(s, later)).not.toContain("bicycle");
    expect(learnedCount(s)).toBe(1);
  });
});
