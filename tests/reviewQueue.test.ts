import { describe, it, expect } from "vitest";
import { markRemembered, markNeedReview, dueWords, learnedCount } from "../src/engine/reviewQueue";
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
});
