import { describe, it, expect } from "vitest";
import { buildDailySession } from "../src/engine/daily";
import { defaultState } from "../src/store/storage";
import { scheduleReview } from "../src/engine/review";
import { getChapter } from "../src/data/words";

describe("daily session", () => {
  it("混合新词与到期复习词", () => {
    const s = defaultState();
    scheduleReview(s, "apple", 1, new Date("2026-01-01T12:00:00"));
    const ch = getChapter("1-1")!;
    const { words, tags } = buildDailySession(s, ch.id, new Date("2026-02-01T12:00:00"));
    expect(words.length).toBe(ch.words.length + 1);  // 全部新词 + 1 复习词
    expect(tags).toContain("review");
    expect(tags.filter(t => t === "new").length).toBe(ch.words.length);
  });

  it("无到期复习时不追加", () => {
    const s = defaultState();
    const ch = getChapter("1-1")!;
    const { words, tags } = buildDailySession(s, ch.id, new Date("2026-02-01T12:00:00"));
    expect(words.length).toBe(ch.words.length);
    expect(tags).not.toContain("review");
  });
});
