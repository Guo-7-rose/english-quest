import type { AppState, Profile, Settings } from "../types";

export const SCHEMA_VERSION = 1;
const KEY = "eq:state";

export function defaultState(): AppState {
  const profile: Profile = {
    xp: 0, level: 1, streak: 0, lastCheckinDate: null, checkinDates: [],
    totalMinutes: 0, dailyGoal: { words: 30, grammarUnits: 2 },
    goalsMetToday: false, freezeCards: 0, lastFreezeGrant: null,
    lifetimeWords: 0, maxCombo: 0,
  };
  const settings: Settings = { sound: true, tts: true, showMeaning: true, theme: "green" };
  return {
    schemaVersion: SCHEMA_VERSION, profile,
    stageProgress: { 1: {}, 2: {}, 3: {}, 4: {} },
    wordStats: {}, grammar: {}, mistakes: [], achievements: {}, settings,
  };
}

function migrate(raw: unknown): AppState {
  const base = defaultState();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  const merged: AppState = { ...base, ...(obj as Partial<AppState>), schemaVersion: SCHEMA_VERSION };
  merged.profile = { ...base.profile, ...((obj.profile as Partial<Profile>) ?? {}) };
  merged.settings = { ...base.settings, ...((obj.settings as Partial<Settings>) ?? {}) };
  merged.stageProgress = { ...base.stageProgress, ...((obj.stageProgress as AppState["stageProgress"]) ?? {}) };
  merged.wordStats = (obj.wordStats as AppState["wordStats"]) ?? {};
  merged.grammar = (obj.grammar as AppState["grammar"]) ?? {};
  merged.mistakes = (obj.mistakes as AppState["mistakes"]) ?? [];
  merged.achievements = (obj.achievements as AppState["achievements"]) ?? {};
  return merged;
}

export function loadAll(): AppState {
  const raw = localStorage.getItem(KEY);
  if (!raw) return defaultState();
  try { return migrate(JSON.parse(raw)); }
  catch { return defaultState(); }
}

export function save(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetAll(): void {
  localStorage.removeItem(KEY);
}
