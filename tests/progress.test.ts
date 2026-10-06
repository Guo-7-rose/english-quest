import { describe, it, expect } from "vitest";
import { xpForWord, addXp, xpNeededForLevel, starsForAccuracy, completeChapter, nextChapterId } from "../src/engine/progress";
import { defaultState } from "../src/store/storage";

describe("progress", () => {
  it("XP 连击加成", () => {
    expect(xpForWord(1)).toBe(10);
    expect(xpForWord(3)).toBe(12);
    expect(xpForWord(10)).toBe(15);
  });

  it("升级消耗 XP", () => {
    const s = defaultState();
    const need = xpNeededForLevel(1);
    s.profile.xp = need - 5;
    expect(addXp(s, 10)).toBe(true);   // 升级
    expect(s.profile.level).toBe(2);
    expect(s.profile.xp).toBe(5);      // 溢出保留
  });

  it("星级阈值", () => {
    expect(starsForAccuracy(40)).toBe(0);
    expect(starsForAccuracy(60)).toBe(1);
    expect(starsForAccuracy(80)).toBe(2);
    expect(starsForAccuracy(95)).toBe(3);
  });

  it("通关解锁下一章", () => {
    const s = defaultState();
    s.stageProgress[1]["1-1"] = { state: "open", stars: 0, bestAcc: 0, bestWpm: 0 };
    completeChapter(s, "1-1", 88, 32);
    expect(s.stageProgress[1]["1-1"]!.state).toBe("done");
    expect(s.stageProgress[1]["1-1"]!.stars).toBe(2);
    expect(s.stageProgress[1]["1-2"]!.state).toBe("open");
  });

  it("下一章 id", () => {
    expect(nextChapterId("1-1")).toBe("1-2");
    expect(nextChapterId("4-30")).toBeNull();
  });
});
