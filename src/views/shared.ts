import type { MnemonicLayer } from "../engine/mnemonic";

export function loadingHTML(text = "加载中…"): string {
  return `<div class="card" style="text-align:center;padding:32px">
    <div style="font-size:28px">⏳</div>
    <div class="muted" style="margin-top:8px">${text}</div>
  </div>`;
}

/**
 * 数据按需加载的统一入口：先显示加载态，数据就绪后重绘，失败给出可读提示。
 * 让应用外壳保持很小（秒开），大块数据只在需要时拉取。
 */
export async function withData(
  root: HTMLElement,
  ensure: () => Promise<void>,
  draw: () => void,
  loadingText = "加载中…",
  ready?: () => boolean,
): Promise<void> {
  if (ready?.()) { draw(); return; }   // 数据已就绪：同步渲染，避免闪烁与竞态
  root.innerHTML = loadingHTML(loadingText);
  try {
    await ensure();
  } catch {
    root.innerHTML = `<div class="card"><h2>😕 数据加载失败</h2>
      <div class="muted">可能是网络问题。检查网络后刷新重试；已加载过的内容离线也能用。</div></div>`;
    return;
  }
  root.innerHTML = "";
  draw();
}

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
