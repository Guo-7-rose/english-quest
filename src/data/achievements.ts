import type { AppState } from "../types";

export interface AchievementDef { name: string; icon: string; desc: string; }

export const ACHIEVEMENTS: Record<string, AchievementDef> = {
  "combo-10": { name: "十连击", icon: "🔥", desc: "单局打出 10 连击" },
  "combo-20": { name: "二十连击", icon: "⚡", desc: "单局打出 20 连击" },
  "words-100": { name: "百词斩", icon: "💯", desc: "累计打对 100 词" },
  "words-1000": { name: "千词大关", icon: "📚", desc: "累计打对 1000 词" },
  "streak-7": { name: "一周之约", icon: "🗓️", desc: "连续打卡 7 天" },
  "streak-30": { name: "月度坚持", icon: "🏆", desc: "连续打卡 30 天" },
  "streak-100": { name: "百日传奇", icon: "👑", desc: "连续打卡 100 天" },
  "stage1-3star": { name: "基础满星", icon: "🌟", desc: "阶段一全部 3 星" },
};

type Cond = (s: AppState) => boolean;
const CONDS: Record<string, Cond> = {
  "combo-10": s => s.profile.maxCombo >= 10,
  "combo-20": s => s.profile.maxCombo >= 20,
  "words-100": s => s.profile.lifetimeWords >= 100,
  "words-1000": s => s.profile.lifetimeWords >= 1000,
  "streak-7": s => s.profile.streak >= 7,
  "streak-30": s => s.profile.streak >= 30,
  "streak-100": s => s.profile.streak >= 100,
  "stage1-3star": s => {
    const chs = Object.values(s.stageProgress[1]);
    return chs.length > 0 && chs.every(p => p.state === "done" && p.stars === 3);
  },
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
