import type { StageId } from "../types";
import data from "./wordbank-daily.json";
import { getStage } from "./words";

export interface BankWord { word: string; phonetic: string; meaning: string[]; }
export interface Theme { id: string; title: string; icon: string; words: BankWord[]; }
export interface Expression { zh: string; en: string; note: string; example: string; }

interface RawData { themes: Theme[]; expressions: Expression[]; }

const RAW = data as RawData;

export type BankId = "daily" | "zk" | "gk" | "cet4";

export function allThemes(): Theme[] { return RAW.themes; }

export function getTheme(id: string): Theme | undefined {
  return RAW.themes.find(t => t.id === id);
}

export function allExpressions(): Expression[] { return RAW.expressions; }

/** 各板块的词表（daily = 全部主题词去重；zk/gk/cet4 = 考试词表） */
export function bankWords(bank: BankId): string[] {
  if (bank === "daily") {
    const set = new Set<string>();
    for (const t of RAW.themes) for (const w of t.words) set.add(w.word);
    return [...set];
  }
  const stage: StageId = bank === "zk" ? 1 : bank === "gk" ? 2 : 3;
  return getStage(stage).flatMap(c => c.words.map(w => w.word));
}

export function bankMeta(bank: BankId): { title: string; icon: string; desc: string } {
  switch (bank) {
    case "daily": return { title: "日常词汇", icon: "🏠", desc: "18 个生活场景主题 + 生活表达包，最能马上用上" };
    case "zk": return { title: "初中词汇", icon: "🟢", desc: "中考核心词，英语学习的地基" };
    case "gk": return { title: "高中词汇", icon: "🟡", desc: "高考 3500 词，覆盖日常阅读绝大多数词汇" };
    case "cet4": return { title: "四级词汇", icon: "🔵", desc: "大学英语四级，成人应用主力词表" };
  }
}

export const BANK_ORDER: BankId[] = ["daily", "zk", "gk", "cet4"];
