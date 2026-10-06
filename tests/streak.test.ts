import { describe, it, expect } from "vitest";
import { todayStr, heatmapDays, markGoalMet, grantFreezeIfDue, useFreeze, daysSinceLastCheckin, recordDailyWord, recordDailyGrammar } from "../src/engine/streak";
import { defaultState } from "../src/store/storage";

const D = (s: string) => new Date(s + "T12:00:00");

describe("streak", () => {
  it("todayStr 本地日期格式", () => {
    expect(todayStr(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("达标即打卡并累计 streak", () => {
    const s = defaultState();
    const ok = markGoalMet(s, D("2026-01-05"));
    expect(ok).toBe(true);
    expect(s.profile.streak).toBe(1);
    expect(s.profile.goalsMetToday).toBe(true);
    expect(s.profile.lastCheckinDate).toBe("2026-01-05");
    // 同日重复不重复打卡
    expect(markGoalMet(s, D("2026-01-05"))).toBe(false);
    // 次日连续
    expect(markGoalMet(s, D("2026-01-06"))).toBe(true);
    expect(s.profile.streak).toBe(2);
  });

  it("隔天打卡重置 streak 为 1", () => {
    const s = defaultState();
    markGoalMet(s, D("2026-01-01"));
    markGoalMet(s, D("2026-01-05"));
    expect(s.profile.streak).toBe(1);
  });

  it("每周发冻结卡（上限 3）", () => {
    const s = defaultState();
    grantFreezeIfDue(s, D("2026-01-05"));  // 周一
    expect(s.profile.freezeCards).toBe(1);
    grantFreezeIfDue(s, D("2026-01-06"));
    expect(s.profile.freezeCards).toBe(1);  // 同周不重复
    grantFreezeIfDue(s, D("2026-01-12"));
    expect(s.profile.freezeCards).toBe(2);
    s.profile.freezeCards = 3;
    grantFreezeIfDue(s, D("2026-01-19"));
    expect(s.profile.freezeCards).toBe(3);
  });

  it("冻结卡补昨日断签", () => {
    const s = defaultState();
    markGoalMet(s, D("2026-01-01"));
    expect(daysSinceLastCheckin(s, D("2026-01-03"))).toBe(2);
    expect(useFreeze(s, D("2026-01-03"))).toBe(false); // 无卡
    s.profile.freezeCards = 1;
    expect(useFreeze(s, D("2026-01-03"))).toBe(true);  // 补 01-02
    expect(s.profile.streak).toBe(2);
    expect(s.profile.freezeCards).toBe(0);
  });

  it("热力图近 28 天", () => {
    const s = defaultState();
    markGoalMet(s, D("2026-01-05"));
    const days = heatmapDays(s, D("2026-01-05"));
    expect(days.length).toBe(28);
    expect(days[27]!.checked).toBe(true);
    expect(days[27]!.isFuture).toBe(false);
  });

  it("每日词数计数跨天重置，达标自动打卡", () => {
    const s = defaultState();
    s.profile.dailyGoal.words = 3;
    recordDailyWord(s, D("2026-01-05"));
    recordDailyWord(s, D("2026-01-05"));
    expect(s.profile.goalsMetToday).toBe(false);
    recordDailyWord(s, D("2026-01-05"));  // 第 3 词达标
    expect(s.profile.goalsMetToday).toBe(true);
    expect(s.profile.streak).toBe(1);
    // 次日计数重置
    recordDailyWord(s, D("2026-01-06"));
    expect(s.profile.dailyWordsToday).toBe(1);
    expect(s.profile.goalsMetToday).toBe(false);
  });

  it("语法单元计数同样触发打卡", () => {
    const s = defaultState();
    s.profile.dailyGoal.grammarUnits = 2;
    recordDailyGrammar(s, D("2026-01-05"));
    expect(s.profile.goalsMetToday).toBe(false);
    recordDailyGrammar(s, D("2026-01-05"));
    expect(s.profile.goalsMetToday).toBe(true);
  });
});
