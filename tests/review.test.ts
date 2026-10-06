import { describe, it, expect, beforeEach } from "vitest";
import { scheduleReview, dueReviews } from "../src/engine/review";
import { defaultState } from "../src/store/storage";

const NOW = new Date("2026-01-01T12:00:00");

describe("review (fsrs)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("首次复习后生成卡片并有到期日", () => {
    const s = defaultState();
    scheduleReview(s, "apple", 3, NOW);
    const st = s.wordStats["apple"]!;
    expect(st.fsrs).not.toBeNull();
    expect(new Date(st.fsrs!.due).getTime()).toBeGreaterThan(NOW.getTime());
  });

  it("到期队列", () => {
    const s = defaultState();
    scheduleReview(s, "apple", 3, NOW);
    // 40 天后应到期
    const later = new Date(NOW.getTime() + 40 * 86400000);
    expect(dueReviews(s, later)).toContain("apple");
    expect(dueReviews(s, NOW)).not.toContain("apple");
  });

  it("不同评分到期间隔递增（3 良好 > 1 忘记）", () => {
    const s1 = defaultState();
    scheduleReview(s1, "a", 1, NOW);
    const s2 = defaultState();
    scheduleReview(s2, "a", 3, NOW);
    const due1 = new Date(s1.wordStats["a"]!.fsrs!.due).getTime();
    const due2 = new Date(s2.wordStats["a"]!.fsrs!.due).getTime();
    expect(due2).toBeGreaterThan(due1);
  });
});
