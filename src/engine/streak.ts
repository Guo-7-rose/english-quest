import type { AppState } from "../types";

export function todayStr(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function daysSinceLastCheckin(state: AppState, now: Date = new Date()): number {
  if (!state.profile.lastCheckinDate) return Infinity;
  const last = new Date(state.profile.lastCheckinDate + "T12:00:00");
  return Math.round((now.getTime() - last.getTime()) / 86400000);
}

export function markGoalMet(state: AppState, now: Date = new Date()): boolean {
  const t = todayStr(now);
  const p = state.profile;
  if (p.lastCheckinDate === t) { p.goalsMetToday = true; return false; }
  const gap = p.lastCheckinDate ? daysSinceLastCheckin(state, now) : Infinity;
  p.streak = gap === 1 ? p.streak + 1 : 1;
  p.lastCheckinDate = t;
  p.goalsMetToday = true;
  p.checkinDates.push(t);
  return true;
}

function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
}

export function grantFreezeIfDue(state: AppState, now: Date = new Date()): void {
  const p = state.profile;
  const thisMon = todayStr(mondayOf(now));
  if (p.lastFreezeGrant === thisMon) return;
  p.lastFreezeGrant = thisMon;
  if (p.freezeCards < 3) p.freezeCards++;
}

export function useFreeze(state: AppState, now: Date = new Date()): boolean {
  const p = state.profile;
  if (p.freezeCards <= 0) return false;
  const gap = daysSinceLastCheckin(state, now);
  if (gap !== 2) return false;   // 只补「昨天断签、今天来补」的场景
  p.freezeCards--;
  p.lastCheckinDate = todayStr(addDays(now, -1));
  p.streak += 1;
  p.checkinDates.push(p.lastCheckinDate);
  return true;
}

export function heatmapDays(state: AppState, now: Date = new Date()): { date: string; checked: boolean; isFuture: boolean }[] {
  const set = new Set(state.profile.checkinDates);
  const out: { date: string; checked: boolean; isFuture: boolean }[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = addDays(now, -i);
    const t = todayStr(d);
    out.push({ date: t, checked: set.has(t), isFuture: d.getTime() > now.getTime() });
  }
  return out;
}

function rolloverDaily(state: AppState, now: Date): void {
  const t = todayStr(now);
  if (state.profile.lastActiveDate !== t) {
    state.profile.lastActiveDate = t;
    state.profile.dailyWordsToday = 0;
    state.profile.dailyGrammarToday = 0;
    state.profile.goalsMetToday = false;
  }
}

export function recordDailyWord(state: AppState, now: Date = new Date()): boolean {
  rolloverDaily(state, now);
  state.profile.dailyWordsToday++;
  state.profile.lifetimeWords++;
  if (state.profile.dailyWordsToday >= state.profile.dailyGoal.words && !state.profile.goalsMetToday) {
    return markGoalMet(state, now);
  }
  return false;
}

export function recordDailyGrammar(state: AppState, now: Date = new Date()): boolean {
  rolloverDaily(state, now);
  state.profile.dailyGrammarToday++;
  if (state.profile.dailyGrammarToday >= state.profile.dailyGoal.grammarUnits && !state.profile.goalsMetToday) {
    return markGoalMet(state, now);
  }
  return false;
}
