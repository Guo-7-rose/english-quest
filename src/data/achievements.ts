import type { AppState } from "../types";

export interface AchievementDef { name: string; icon: string; desc: string; }

export const ACHIEVEMENTS: Record<string, AchievementDef> = {
  "grammar-5": { name: "语法入门", icon: "📖", desc: "完成 5 个语法单元（得分 ≥80）" },
  "grammar-23": { name: "语法通读", icon: "🎓", desc: "完成全部 23 个语法单元" },
  "words-100": { name: "百词斩", icon: "💯", desc: "累计学过 100 词" },
  "words-1000": { name: "千词大关", icon: "📚", desc: "累计学过 1000 词" },
  "streak-7": { name: "一周之约", icon: "🗓️", desc: "连续打卡 7 天" },
  "streak-30": { name: "月度坚持", icon: "🏆", desc: "连续打卡 30 天" },
  "streak-100": { name: "百日传奇", icon: "👑", desc: "连续打卡 100 天" },
  "daily-50": { name: "单日猛学", icon: "🔥", desc: "单日学习 50 词以上" },
};

type Cond = (s: AppState) => boolean;
const grammarDone = (s: AppState) => Object.values(s.grammar).filter(g => g.done && g.score >= 80).length;
const CONDS: Record<string, Cond> = {
  "grammar-5": s => grammarDone(s) >= 5,
  "grammar-23": s => grammarDone(s) >= 23,
  "words-100": s => s.profile.lifetimeWords >= 100,
  "words-1000": s => s.profile.lifetimeWords >= 1000,
  "streak-7": s => s.profile.streak >= 7,
  "streak-30": s => s.profile.streak >= 30,
  "streak-100": s => s.profile.streak >= 100,
  "daily-50": s => s.profile.dailyWordsToday >= 50,
};

export function checkAchievements(state: AppState): string[] {
  const unlocked: string[] = [];
  for (const [id, cond] of Object.entries(CONDS)) {
    if (!state.achievements[id] && cond(state)) {
      state.achievements[id] = { unlockedAt: Date.now() };
      unlocked.push(id);
    }
  }
  return unlocked;
}
