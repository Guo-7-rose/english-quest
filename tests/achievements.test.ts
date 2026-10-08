import { describe, it, expect } from "vitest";
import { checkAchievements, ACHIEVEMENTS } from "../src/data/achievements";
import { defaultState } from "../src/store/storage";

describe("achievements", () => {
  it("累计词数成就", () => {
    const s = defaultState();
    s.profile.lifetimeWords = 1000;
    const newOnes = checkAchievements(s);
    expect(newOnes).toContain("words-1000");
    expect(s.achievements["words-1000"]).toBeDefined();
    expect(checkAchievements(s)).toEqual([]);   // 幂等
  });

  it("语法单元成就（5 个 / 全部 23 个）", () => {
    const s = defaultState();
    for (let i = 1; i <= 5; i++) s.grammar[`g-${i}`] = { done: true, score: 90, answers: [] };
    expect(checkAchievements(s)).toContain("grammar-5");
    for (let i = 6; i <= 23; i++) s.grammar[`g-${i}`] = { done: true, score: 85, answers: [] };
    expect(checkAchievements(s)).toContain("grammar-23");
  });

  it("打卡 7 天成就", () => {
    const s = defaultState();
    s.profile.streak = 7;
    expect(checkAchievements(s)).toContain("streak-7");
  });

  it("单日 50 词成就", () => {
    const s = defaultState();
    s.profile.dailyWordsToday = 50;
    expect(checkAchievements(s)).toContain("daily-50");
  });

  it("所有成就都能被解锁（不存在永久锁死的成就）", () => {
    const s = defaultState();
    s.profile.lifetimeWords = 100000;
    s.profile.streak = 1000;
    s.profile.dailyWordsToday = 1000;
    for (let i = 1; i <= 23; i++) s.grammar[`g-${i}`] = { done: true, score: 100, answers: [] };
    const unlocked = checkAchievements(s);
    expect(new Set(unlocked)).toEqual(new Set(Object.keys(ACHIEVEMENTS)));
  });
});
