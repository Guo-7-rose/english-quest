import type { MnemonicLayer } from "../engine/mnemonic";

export const LAYER_LABEL: Record<MnemonicLayer, string> = {
  etymology: "词源",
  construction: "构词",
  mnemonic: "助记",
};

export const LAYER_COLOR: Record<MnemonicLayer, string> = {
  etymology: "#1CB0F6",
  construction: "#58CC02",
  mnemonic: "#FF9600",
};

export const TYPE_LABEL: Record<"root" | "prefix" | "suffix", string> = {
  root: "词根",
  prefix: "前缀",
  suffix: "后缀",
};

export const TYPE_COLOR: Record<"root" | "prefix" | "suffix", string> = {
  root: "#1CB0F6",
  prefix: "#58CC02",
  suffix: "#CE82FF",
};

export function layerBadge(layer: MnemonicLayer): string {
  return `<span style="display:inline-block;font-size:11px;font-weight:900;color:#fff;background:${LAYER_COLOR[layer]};border-radius:8px;padding:1px 7px;margin-right:6px;">${LAYER_LABEL[layer]}</span>`;
}

export function statusIcon(state: { correct: number; wrong: number; inReview: boolean } | undefined): string {
  if (!state) return "";
  if (state.inReview) return "🔁";
  if (state.correct > 0) return "✅";
  return "";
}

/** 通用：渲染一个词的三层拆解详情块（含标记按钮） */
export interface DetailHooks {
  onRemember: (word: string) => void;
  onReview: (word: string) => void;
  onFamily?: (familyKey: string) => void;
}
