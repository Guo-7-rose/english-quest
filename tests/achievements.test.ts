import { describe, it, expect } from "vitest";
import { checkAchievements } from "../src/data/achievements";
import { defaultState } from "../src/store/storage";

describe("achievements", () => {
  it("累计词数成就", () => {
    const s = defaultState();
    s.profile.lifetimeWords = 1000;
    const newOnes = checkAchievements(s);
    expect(newOnes).toContain("words-1000");
    expect(s.achievements["words-1000"]).toBeDefined();
    // 幂等
    expect(checkAchievements(s)).toEqual([]);
  });

  it("连击成就", () => {
    const s = defaultState();
    s.profile.maxCombo = 10;
    expect(checkAchievements(s)).toContain("combo-10");
  });

  it("打卡 7 天成就", () => {
    const s = defaultState();
    s.profile.streak = 7;
    expect(checkAchievements(s)).toContain("streak-7");
  });
});
