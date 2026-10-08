import type { AppState } from "../types";

/** 复习板块 —— Task 7 实现完整视图 */
export function renderReview(root: HTMLElement, state: AppState): void {
  root.innerHTML = `<div class="card"><h2>🔁 复习</h2><div class="muted">复习队列建设中</div></div>`;
}
