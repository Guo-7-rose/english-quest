import type { AppState } from "../types";

export function renderStats(root: HTMLElement, state: AppState): void {
  root.innerHTML = `<div class="card"><h2>📊 数据中心</h2><div class="muted">统计图表即将上线</div></div>`;
}
