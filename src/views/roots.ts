import type { AppState } from "../types";

/** 词根词缀库 —— Task 3 实现完整视图 */
export function renderRoots(root: HTMLElement, state: AppState, familyKey?: string): void {
  root.innerHTML = `<div class="card"><h2>🌱 词根词缀库</h2><div class="muted">词根家族浏览建设中（当前参数：${familyKey ?? "总览"}）</div></div>`;
}
