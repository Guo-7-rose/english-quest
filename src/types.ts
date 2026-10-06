export type StageId = 1 | 2 | 3 | 4;

export interface Word {
  id: string;            // 单词本身（小写）
  word: string;
  phonetic: string;
  meaning: string[];
  exchange: Record<string, string[]>; // s(复数) d(过去式) i(现在分词) 3(三单) r(比较级) t(最高级)
}

export interface Chapter {
  id: string;            // `${stage}-${no}`
  stage: StageId;
  no: number;
  title: string;
  words: Word[];
}

export interface FsrsCard { due: string; stability: number; difficulty: number; state: number; }

export interface WordStats {
  correct: number;
  wrong: number;
  lastSeen: number;      // epoch ms
  fsrs: FsrsCard | null;
  inReview: boolean;     // 是否在复习队列
}

export interface ChapterProgress {
  state: "locked" | "open" | "done";
  stars: 0 | 1 | 2 | 3;
  bestAcc: number;
  bestWpm: number;
}

export type StageProgress = Record<string, ChapterProgress>;

export interface Profile {
  xp: number;
  level: number;
  streak: number;
  lastCheckinDate: string | null;   // YYYY-MM-DD
  checkinDates: string[];           // 全部打卡日期（热力图）
  totalMinutes: number;
  dailyGoal: { words: number; grammarUnits: number };
  goalsMetToday: boolean;
  freezeCards: number;
  lastFreezeGrant: string | null;   // YYYY-MM-DD 上次发卡
  lifetimeWords: number;            // 累计打对词数
  maxCombo: number;                 // 历史最高连击
  dailyWordsToday: number;          // 今日已打对词数
  dailyGrammarToday: number;        // 今日已完成语法单元数
  lastActiveDate: string | null;    // 上次学习日期（跨天重置计数）
}

export interface GrammarQuestion { q: string; options: string[]; answer: number; }

export interface GrammarUnit {
  id: string;
  stage: number;
  no: number;
  title: string;
  knowledge: string;
  questions: GrammarQuestion[];
}

export interface GrammarUnitProgress { done: boolean; score: number; answers: number[]; }

export interface Mistake { word: string; wrongAnswer: string; ts: number; }

export type AchievementState = Record<string, { unlockedAt: number }>;

export interface Settings { sound: boolean; tts: boolean; showMeaning: boolean; theme: string; }

export interface AppState {
  schemaVersion: number;
  profile: Profile;
  stageProgress: Record<StageId, StageProgress>;
  wordStats: Record<string, WordStats>;
  grammar: Record<string, GrammarUnitProgress>;
  mistakes: Mistake[];
  achievements: AchievementState;
  settings: Settings;
}
