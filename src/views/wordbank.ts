import type { AppState } from "../types";

/** 单词板块（日常 / 初中 / 高中 / 四级）—— Task 5 实现完整视图 */
export function renderWordbank(root: HTMLElement, state: AppState, bank?: string): void {
  root.innerHTML = `<div class="card"><h2>📚 单词板块</h2><div class="muted">板块视图建设中（当前参数：${bank ?? "总览"}）</div></div>`;
}
